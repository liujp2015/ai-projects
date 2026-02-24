import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewCardStatus } from '@prisma/client';

@Injectable()
export class ReviewService {
  // 固定复习间隔序列（天）
  private readonly INTERVAL_SEQUENCE = [1, 2, 4, 7, 15, 30, 60, 180];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 将文档中提取的词性单词导入到复习卡片表
   * @param documentId 文档 ID
   */
  async importFromExtractedWords(documentId: string) {
    // 1. 检查文档是否存在
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
    });
    if (!doc) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    // 2. 获取该文档所有提取出的单词
    const extractedWords = await this.prisma.extractedWord.findMany({
      where: { documentId },
    });

    if (extractedWords.length === 0) {
      return {
        total: 0,
        inserted: 0,
        skipped: 0,
        message: '没有找到可导入的单词，请先进行词性提取',
      };
    }

    // 3) 高确定性的统计：先找出已存在的 key 集合，再批量 createMany(skipDuplicates)
    const now = new Date();

    const existing = await this.prisma.reviewCard.findMany({
      where: { documentId },
      select: { word: true, partOfSpeech: true },
    });

    const existingKey = new Set(
      existing.map((x) => `${x.word.toLowerCase()}@@${x.partOfSpeech.toLowerCase()}`),
    );

    // Prisma createMany 不支持嵌套/关系 connect，所以直接写 documentId
    const rows = extractedWords.map((ew) => ({
      documentId,
      word: ew.word,
      partOfSpeech: ew.partOfSpeech,
      translation: ew.translation,
      sentence: ew.sentence as string | null,
      stage: 0,
      nextReviewAt: now,
      status: ReviewCardStatus.LEARNING,
    }));

    const insertedCandidates: any[] = rows.filter(
      (r) => !existingKey.has(`${r.word.toLowerCase()}@@${r.partOfSpeech.toLowerCase()}`),
    );

    // 4. 额外导入用户手动标记为“重点”的单词 (AlignedWordPair.isImportant = true)
    const importantPairs = await this.prisma.alignedWordPair.findMany({
      where: {
        documentId,
        isImportant: true,
      },
    });

    for (const pair of importantPairs) {
      const pos = (pair.partOfSpeech || 'unknown').toLowerCase();
      const key = `${pair.en.toLowerCase()}@@${pos}`;
      
      // 如果这个重点词还没在导入队列里，且复习库里也没有，则添加
      const alreadyInCandidates = insertedCandidates.some(c => 
        c.word.toLowerCase() === pair.en.toLowerCase() && c.partOfSpeech.toLowerCase() === pos
      );

      if (!existingKey.has(key) && !alreadyInCandidates) {
        insertedCandidates.push({
          documentId,
          word: pair.en,
          partOfSpeech: pos,
          translation: pair.zh,
          sentence: null as string | null, // 重点词可能没有例句
          stage: 0,
          nextReviewAt: now,
          status: ReviewCardStatus.LEARNING,
        });
      }
    }

    // 只对“新 key”做插入，避免把已复习过的卡重置 stage
    const createRes = await this.prisma.reviewCard.createMany({
      data: insertedCandidates,
      skipDuplicates: true,
    });

    // 4) 对已存在的卡：更新 translation/sentence（不重置 stage/nextReviewAt）
    // 简化：逐条 update（数据量通常不大，个人场景可接受；后续可优化为批量 SQL）
    let updated = 0;
    for (const ew of extractedWords) {
      const key = `${ew.word.toLowerCase()}@@${ew.partOfSpeech.toLowerCase()}`;
      if (!existingKey.has(key)) continue;

      await this.prisma.reviewCard.update({
        where: {
          documentId_word_partOfSpeech: {
            documentId,
            word: ew.word,
            partOfSpeech: ew.partOfSpeech,
          },
        },
        data: {
          translation: ew.translation,
          sentence: ew.sentence,
        },
      });
      updated++;
    }

    const inserted = createRes.count;
    const skipped = extractedWords.length - inserted;

    // 5. 同步词性到 AlignedWordPair（用于中英对照表显示和按词性刷词）
    const posByWord = new Map<string, string>();
    const posByLemma = new Map<string, string>();
    for (const ew of extractedWords) {
      const w = ew.word.toLowerCase().trim();
      if (!posByWord.has(w)) posByWord.set(w, ew.partOfSpeech);
      if (ew.lemma) {
        const l = ew.lemma.toLowerCase().trim();
        if (!posByLemma.has(l)) posByLemma.set(l, ew.partOfSpeech);
      }
    }

    // 获取所有 AlignedWordPair，优先更新空词性的，有词性的也允许用 ExtractedWord 覆盖（保持与提取结果一致）
    const allAligned = await this.prisma.alignedWordPair.findMany({
      where: { documentId },
      select: { id: true, en: true, lemma: true, partOfSpeech: true },
    });

    let posSynced = 0;
    for (const pair of allAligned) {
      const enLower = pair.en.toLowerCase().trim();
      const pos = posByWord.get(enLower) ?? (pair.lemma ? posByLemma.get(pair.lemma.toLowerCase().trim()) : null);
      if (pos) {
        await this.prisma.alignedWordPair.update({
          where: { id: pair.id },
          data: { partOfSpeech: pos },
        });
        posSynced++;
      }
    }

    return {
      total: extractedWords.length,
      inserted,
      updated,
      skipped,
      posSynced,
    };
  }

  /**
   * 获取复习卡片队列
   * @param mode due: 仅到期, all: 全部学习中
   */
  async getDueCards(documentId: string, limit: number = 50, partOfSpeech?: string, mode: 'due' | 'all' = 'due') {
    const where: any = {
      documentId,
      status: ReviewCardStatus.LEARNING,
    };

    if (mode === 'due') {
      where.nextReviewAt = { lte: new Date() };
    }

    if (partOfSpeech && partOfSpeech !== 'all') {
      where.partOfSpeech = { equals: partOfSpeech.toLowerCase(), mode: 'insensitive' };
    }

    return this.prisma.reviewCard.findMany({
      where,
      orderBy: [
        { nextReviewAt: 'asc' }, // 到期的排前面
        { createdAt: 'asc' }
      ],
      take: limit,
    });
  }

  /**
   * 提交复习结果（判定）
   */
  async gradeCard(cardId: string, result: 'GOOD' | 'AGAIN') {
    const card = await this.prisma.reviewCard.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      throw new NotFoundException(`ReviewCard with ID ${cardId} not found`);
    }

    let nextStage = card.stage;
    let nextStatus = card.status;

    if (result === 'GOOD') {
      // 认识：提升阶段
      nextStage = Math.min(card.stage + 1, this.INTERVAL_SEQUENCE.length - 1);
      // 如果到了最后一个阶段，标记为已掌握
      if (nextStage === this.INTERVAL_SEQUENCE.length - 1) {
        nextStatus = ReviewCardStatus.MASTERED;
      }
    } else {
      // 不认识：回退 2 个阶段，最少到 0
      nextStage = Math.max(card.stage - 2, 0);
    }

    const now = new Date();
    const intervalDays = this.INTERVAL_SEQUENCE[nextStage];
    const nextReviewAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

    return this.prisma.reviewCard.update({
      where: { id: cardId },
      data: {
        stage: nextStage,
        lastReviewAt: now,
        nextReviewAt,
        status: nextStatus,
      },
    });
  }

  /**
   * 获取文档的复习统计摘要
   */
  async getSummary(documentId: string) {
    const now = new Date();
    const [dueCount, learningCount, masteredCount] = await Promise.all([
      this.prisma.reviewCard.count({
        where: { documentId, nextReviewAt: { lte: now }, status: ReviewCardStatus.LEARNING },
      }),
      this.prisma.reviewCard.count({
        where: { documentId, status: ReviewCardStatus.LEARNING },
      }),
      this.prisma.reviewCard.count({
        where: { documentId, status: ReviewCardStatus.MASTERED },
      }),
    ]);

    return {
      dueCount,
      learningCount,
      masteredCount,
      totalCount: learningCount + masteredCount,
    };
  }
}
