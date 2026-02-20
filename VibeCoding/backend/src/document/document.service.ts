import { Injectable, Logger } from '@nestjs/common';
import * as mammoth from 'mammoth';
import { PrismaService } from '../prisma/prisma.service';
import * as pdfjs from 'pdfjs-dist';
import { OCRService } from '../ai/ocr.service';
import { AIService } from '../ai/ai.service';
// Prisma namespace types are not needed here; we use the generated client via PrismaService.

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(
    private prisma: PrismaService,
    private ocrService: OCRService,
    private aiService: AIService,
  ) {}

  async parseAndSaveDocument(file: Express.Multer.File, title: string) {
    let text = '';
    const mimeType = file.mimetype;

    try {
      if (mimeType === 'application/pdf') {
        const loadingTask = pdfjs.getDocument({ data: new Uint8Array(file.buffer) });
        const pdf = await loadingTask.promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items
            .map((item: any) => item.str)
            .join(' ');
          fullText += pageText + '\n\n';
        }
        text = fullText;
      } else if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimeType === 'application/msword'
      ) {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        text = result.value;
      } else if (mimeType === 'text/plain') {
        text = file.buffer.toString('utf-8');
      } else {
        throw new Error('Unsupported file type');
      }

      return this.saveStructuredContent(text, title, file.originalname, file.size, mimeType);
    } catch (error) {
      this.logger.error(`Failed to parse document: ${error.message}`);
      throw error;
    }
  }

  async parseAndSaveImages(files: Express.Multer.File[], title: string) {
    const originalTexts: string[] = [];
    const chineseTexts: string[] = [];
    const englishTexts: string[] = [];

    for (const file of files) {
      const mimeType = file.mimetype;
      if (!mimeType.startsWith('image/')) {
        throw new Error(`Unsupported image type: ${mimeType}`);
      }

      const ocrResult = await this.ocrService.imageToTextStructured(file);
      originalTexts.push(ocrResult.originalText);
      chineseTexts.push(ocrResult.chineseText);
      englishTexts.push(ocrResult.englishText);
    }

    // 合并所有 OCR 结果
    const mergedOriginal = originalTexts.join('\n\n');
    // 逐行一一对照：不同图片的行直接按顺序拼接
    const mergedChinese = chineseTexts.filter((t) => t.trim()).join('\n');
    const mergedEnglish = englishTexts.filter((t) => t.trim()).join('\n');

    return this.saveStructuredContentWithOCR(
      mergedOriginal,
      mergedChinese,
      mergedEnglish,
      title,
      `${title}.images`,
      files.reduce((sum, f) => sum + f.size, 0),
      'image/*',
    );
  }

  async saveRawText(content: string, title: string) {
    return this.saveStructuredContent(content, title, 'manual-input.txt', Buffer.byteLength(content), 'text/plain');
  }

  private async saveStructuredContentWithOCR(
    originalText: string,
    chineseText: string,
    englishText: string,
    title: string,
    filename: string,
    fileSize: number,
    mimeType: string,
  ) {
    // 1. Create Document metadata with OCR results
    const document = await this.prisma.document.create({
      data: {
        title: title,
        filename: filename,
        fileSize: fileSize,
        mimeType: mimeType,
        originalText: originalText,  // 存储千问返回的原文
        chineseText: chineseText,     // 存储纯中文的句子和单词
        englishText: englishText,     // 存储纯英文的句子和单词
      },
    });

    // 2. 仍然将原文保存为段落和句子结构（用于后续处理）
    return this.saveStructuredContent(originalText, title, filename, fileSize, mimeType, document.id);
  }

  private async saveStructuredContent(text: string, title: string, filename: string, fileSize: number, mimeType: string, existingDocumentId?: string) {
    // 1. Create Document metadata (如果已存在则使用现有的)
    let document;
    if (existingDocumentId) {
      document = await this.prisma.document.findUnique({ where: { id: existingDocumentId } });
      if (!document) {
        throw new Error('Document not found');
      }
    } else {
      document = await this.prisma.document.create({
        data: {
          title: title,
          filename: filename,
          fileSize: fileSize,
          mimeType: mimeType,
        },
      });
    }

    // 2. Split into paragraphs
    const paragraphTexts = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    for (let i = 0; i < paragraphTexts.length; i++) {
      const pText = paragraphTexts[i].trim();
      const paragraph = await this.prisma.paragraph.create({
        data: {
          content: pText,
          orderIndex: i,
          documentId: document.id,
        },
      });

      // 3. Split paragraph into sentences
      const sentenceTexts = pText.match(/[^.!?]+[.!?]+|\s*[^.!?]+$/g) || [pText];
      
      await this.prisma.sentence.createMany({
        data: sentenceTexts
          .map(s => s.trim())
          .filter(s => s.length > 0)
          .map((s, index) => ({
            content: s,
            orderIndex: index,
            paragraphId: paragraph.id,
          })),
      });
    }

    return document;
  }

  async findAll() {
    return this.prisma.document.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.document.findUnique({
      where: { id },
      include: {
        paragraphs: {
          orderBy: { orderIndex: 'asc' },
          include: {
            sentences: { orderBy: { orderIndex: 'asc' } },
          },
        },
      },
    });
  }

  async appendText(documentId: string, newText: string) {
    const doc = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) throw new Error('Document not found');

    this.logger.log(`Appending text to document ${documentId}...`);

    // 1. 对新文本进行翻译对齐，获取结构化数据（模拟OCR结果格式）
    const alignedPairsRaw = await this.aiService.extractAlignedSentencePairsFromEnglishArticle(newText);

    const containsChinese = (s: string) => /[\u3400-\u9FFF]/.test(s);

    const sanitizeEnglishSentence = (input: string) => {
      let s = String(input ?? '').trim();
      s = s.replace(/\s*[\(（][^\)）]*[\u3400-\u9FFF][^\)）]*[\)）]\s*/g, ' ');
      s = s.replace(/[\u3400-\u9FFF]/g, '');
      s = s.replace(/[，。！？、“”‘'《》【】（）]/g, '');
      s = s.replace(/\s+/g, ' ').trim();
      return s;
    };

    const alignedPairs = alignedPairsRaw
      .map((p) => ({
        en: sanitizeEnglishSentence(p.en),
        zh: String(p.zh ?? '').trim(),
      }))
      .filter((p) => p.en.length > 0 && !containsChinese(p.en) && /[A-Za-z]/.test(p.en));

    if (alignedPairs.length === 0) {
      throw new Error('AI failed to extract valid aligned sentence pairs from new text');
    }

    // 2. 构建新增内容的OCR结果格式
    const newZhLines = alignedPairs.map(p => p.zh);
    const newEnLines = alignedPairs.map(p => p.en);
    const newOCRResult = {
      originalText: newText,
      chineseText: newZhLines.join('\n'),
      englishText: newEnLines.join('\n'),
    };

    // 3. 调用千问合并原有内容和新增内容
    const mergedResult = await this.ocrService.mergeAndStructureContent(
      doc.originalText || '',
      doc.chineseText || '',
      doc.englishText || '',
      [newOCRResult],
    );

    // 4. 更新文档的结构化文本字段（不重建段落和句子结构）
    // 注意：段落和句子结构保持不变，只更新Document表的结构化文本字段
    // 生成测试题时会根据chineseText和englishText生成，不需要重建段落结构
    await this.prisma.document.update({
      where: { id: documentId },
      data: {
        originalText: mergedResult.originalText,
        chineseText: mergedResult.chineseText,
        englishText: mergedResult.englishText,
      },
    });

    this.logger.log(`Successfully appended text to document ${documentId}. Content merged and structured.`);
    this.logger.log(`Updated originalText length: ${mergedResult.originalText.length}`);
    this.logger.log(`Updated chineseText lines: ${mergedResult.chineseText.split(/\r?\n/).length}`);
    this.logger.log(`Updated englishText lines: ${mergedResult.englishText.split(/\r?\n/).length}`);

    return this.findOne(documentId);
  }

  async appendImages(documentId: string, files: Express.Multer.File[]) {
    const doc = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) throw new Error('Document not found');

    this.logger.log(`Appending ${files.length} image(s) to document ${documentId}...`);

    // 1. 对每张图片进行 OCR，获取结构化数据
    const newImagesOCRResults: Array<{ originalText: string; chineseText: string; englishText: string }> = [];
    
    for (const file of files) {
      const ocrResult = await this.ocrService.imageToTextStructured(file);
      newImagesOCRResults.push(ocrResult);
    }

    // 2. 调用千问合并原有内容和新增内容
    const mergedResult = await this.ocrService.mergeAndStructureContent(
      doc.originalText || '',
      doc.chineseText || '',
      doc.englishText || '',
      newImagesOCRResults,
    );

    // 3. 更新文档的结构化文本字段（不重建段落和句子结构）
    // 注意：段落和句子结构保持不变，只更新Document表的结构化文本字段
    // 生成测试题时会根据chineseText和englishText生成，不需要重建段落结构
    await this.prisma.document.update({
      where: { id: documentId },
      data: {
        originalText: mergedResult.originalText,
        chineseText: mergedResult.chineseText,
        englishText: mergedResult.englishText,
      },
    });

    this.logger.log(`Successfully appended ${files.length} image(s) to document ${documentId}. Content merged and structured.`);
    this.logger.log(`Updated originalText length: ${mergedResult.originalText.length}`);
    this.logger.log(`Updated chineseText lines: ${mergedResult.chineseText.split(/\r?\n/).length}`);
    this.logger.log(`Updated englishText lines: ${mergedResult.englishText.split(/\r?\n/).length}`);

    return this.findOne(documentId);
  }

  async translateAlignRebuild(documentId: string, overrideFullText?: string) {
    // 1. 获取文档信息（无论是否有 overrideFullText，都需要获取以清理旧数据）
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        paragraphs: {
          orderBy: { orderIndex: 'asc' },
          include: { sentences: { orderBy: { orderIndex: 'asc' } } },
        },
      },
    });
    if (!doc) throw new Error('Document not found');

    // 2. 获取原文内容
    let fullEnglishText = '';
    if (overrideFullText) {
      fullEnglishText = overrideFullText;
    } else {
      fullEnglishText = doc.paragraphs
        .map((p) => p.sentences.map((s) => s.content).join(' '))
        .join('\n\n');
    }

    this.logger.log(`Realigning document ${documentId}. Text length: ${fullEnglishText.length}`);

    // 更新 Document 的原文存储
    await this.prisma.document.update({
      where: { id: documentId },
      data: { originalText: fullEnglishText },
    });

    // 3. 调用 DeepSeek 获取对齐后的中英对照
    const alignedPairsRaw = await this.aiService.extractAlignedSentencePairsFromEnglishArticle(fullEnglishText);

    const containsChinese = (s: string) => /[\u3400-\u9FFF]/.test(s);

    const sanitizeEnglishSentence = (input: string) => {
      let s = String(input ?? '').trim();

      // Remove common translation patterns like: "... (中文...)" or "...（中文...）"
      s = s.replace(/\s*[\(（][^\)）]*[\u3400-\u9FFF][^\)）]*[\)）]\s*/g, ' ');

      // Remove any remaining Chinese characters and Chinese punctuation.
      s = s.replace(/[\u3400-\u9FFF]/g, '');
      s = s.replace(/[，。！？、“”‘’《》【】（）]/g, '');

      // Collapse spaces
      s = s.replace(/\s+/g, ' ').trim();
      return s;
    };

    const alignedPairs = alignedPairsRaw
      .map((p) => ({
        en: sanitizeEnglishSentence(p.en),
        zh: String(p.zh ?? '').trim(),
      }))
      .filter((p) => p.en.length > 0 && !containsChinese(p.en) && /[A-Za-z]/.test(p.en));

    if (alignedPairs.length === 0) {
      throw new Error('AI failed to extract valid aligned sentence pairs');
    }

    // 4. Clear old data for this document
    // UserWord.sourceSentenceId must be set to null before deleting sentences
    const allSentenceIds = doc.paragraphs.flatMap(p => p.sentences.map(s => s.id));
    if (allSentenceIds.length > 0) {
      await this.prisma.userWord.updateMany({
        where: { sourceSentenceId: { in: allSentenceIds } },
        data: { sourceSentenceId: null },
      });
    }

    // Cascade delete will handle Sentence and ExerciseQuestion if configured, 
    // but let's be explicit for safety or if cascade isn't fully set up in DB level.
    await this.prisma.exerciseQuestion.deleteMany({ where: { documentId } });
    await this.prisma.$executeRaw`
      DELETE FROM "AlignedSentencePair" WHERE "documentId" = ${documentId}
    `;
    await this.prisma.paragraph.deleteMany({ where: { documentId } });

    // 4. Rebuild structure based on AI aligned pairs
    // We create one paragraph for simplicity, or we could try to maintain original paragraph breaks.
    // For now, let's create a single container paragraph.
    const newParagraph = await this.prisma.paragraph.create({
      data: {
        content: fullEnglishText,
        orderIndex: 0,
        documentId: documentId,
      },
    });

    // Batch create new sentences and aligned pairs
    const sentenceData = alignedPairs.map((pair, index) => ({
      content: pair.en,
      translationZh: pair.zh,
      orderIndex: index,
      paragraphId: newParagraph.id,
    }));

    await this.prisma.sentence.createMany({
      data: sentenceData,
    });

    // 使用 Prisma Client 直接写入 AlignedSentencePair 表（schema.prisma 已定义该模型）
    if (alignedPairs.length > 0) {
      await this.prisma.alignedSentencePair.createMany({
        data: alignedPairs.map((pair, index) => ({
          orderIndex: index,
          en: pair.en,
          zh: pair.zh,
          documentId,
          // id / createdAt / updatedAt 使用数据库或 Prisma 默认值
        })),
      });
    }

    this.logger.log(`Successfully realigned ${documentId} into ${alignedPairs.length} sentences`);

    // 新增：同步更新 Document 表的结构化文本字段，确保前端展示一致
    const mergedZh = alignedPairs.map(p => p.zh).join('\n');
    const mergedEn = alignedPairs.map(p => p.en).join('\n');
    
    await this.prisma.document.update({
      where: { id: documentId },
      data: {
        chineseText: mergedZh,
        englishText: mergedEn,
      },
    });

    return { total: alignedPairs.length, status: 'success' };
  }

  async translateMissingSentences(documentId: string) {
    const sentences = await this.prisma.sentence.findMany({
      where: {
        paragraph: {
          documentId,
        },
        translationZh: null,
      },
      orderBy: { orderIndex: 'asc' },
    });

    if (sentences.length === 0) {
      return { total: 0, translated: 0 };
    }

    const translations = await this.aiService.translateEnglishToChinese(
      sentences.map((s) => s.content),
    );

    await this.prisma.$transaction(
      sentences.map((s, idx) =>
        this.prisma.sentence.update({
          where: { id: s.id },
          data: { translationZh: translations[idx] },
        }),
      ),
    );

    return { total: sentences.length, translated: sentences.length };
  }

  async getDocumentTranslation(documentId: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        paragraphs: {
          orderBy: { orderIndex: 'asc' },
          include: {
            sentences: { orderBy: { orderIndex: 'asc' } },
          },
        },
      },
    });

    if (!doc) return null;

    const allSentences = doc.paragraphs.flatMap((p) => p.sentences);
    const total = allSentences.length;
    const translated = allSentences.filter((s) => !!s.translationZh).length;

    const sentenceData = allSentences
      .map((s) => ({
        id: s.id,
        content: s.content, // 英文原句
        translationZh: s.translationZh || null, // 对应中文句子
      }));

    const translationText = doc.paragraphs
      .map((p) =>
        p.sentences
          .map((s) => (s.translationZh && s.translationZh.trim() ? s.translationZh.trim() : '（未翻译）'))
          .join(''),
      )
      .join('\n\n');

    return { documentId, total, translated, translationText, sentenceData };
  }

  // 辅助函数：分词（仅保留单词，去除标点）
  private tokenizeForTest(text: string): string[] {
    return text
      .split(/[^a-zA-Z0-9'-]+/)
      .filter((t) => t.length > 0 && !/^[0-9]+$/.test(t));
  }

  // 辅助函数：洗牌
  private shuffleArray<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // 辅助函数：从文档中获取随机干扰词
  private async getRandomWordsFromDoc(documentId: string, exclude: string[], count: number = 3): Promise<string[]> {
    const sentences = await this.prisma.sentence.findMany({
      where: { paragraph: { documentId } },
      select: { content: true },
    });

    const excludeSet = new Set(exclude.map((e) => e.toLowerCase()));
    const allWords = Array.from(new Set(sentences.flatMap((s) => this.tokenizeForTest(s.content))));
    const candidates: string[] = allWords
      .map((w: string) => w.trim())
      .filter((w: string) => w.length >= 4 && !excludeSet.has(w.toLowerCase()));

    const picked: string[] = this.shuffleArray<string>(candidates).slice(0, count);

    // If not enough distractors in this doc, pad with safe generic words.
    // (Ensure we still return exactly `count` items and avoid duplicates/excludes.)
    const fallbackPool = ['feature', 'system', 'process', 'method', 'result', 'context', 'example', 'pattern', 'support', 'change'];
    const out: string[] = [];
    const used = new Set<string>();

    for (const w of picked) {
      const k = w.toLowerCase();
      if (used.has(k) || excludeSet.has(k)) continue;
      used.add(k);
      out.push(w);
    }

    for (const w of fallbackPool) {
      if (out.length >= count) break;
      const k = w.toLowerCase();
      if (used.has(k) || excludeSet.has(k)) continue;
      used.add(k);
      out.push(w);
    }

    return out.slice(0, count);
  }

  // 辅助函数：标准化比对（忽略标点、大小写、多余空格）
  private normalizeForCompare(s: string): string {
    return s
      .replace(/[“”"'.,!?;:()\[\]{}]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  async generateQuestions(documentId: string, force: boolean = false) {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        paragraphs: {
          include: { sentences: true },
        },
      },
    });

    if (!doc) throw new Error('Document not found');

    if (force) {
      await this.prisma.exerciseQuestion.deleteMany({ where: { documentId } });
    }

    // 1. 解析 OCR 提取的结构化文本
    const zhLines = (doc.chineseText || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
    const enLines = (doc.englishText || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
    
    // 简单的句子/单词分类逻辑（对应前端展示逻辑）
    const sentencePairs = zhLines.map((zh, i) => ({ zh, en: enLines[i] }))
      .filter(item => item.en && (item.en.includes(' ') && item.en.length > 15));
    
    const wordPairs = zhLines.map((zh, i) => ({ zh, en: enLines[i] }))
      .filter(item => item.en && !(item.en.includes(' ') && item.en.length > 15));

    // 2. 为没有题目的句子生成"选词造句"和"句子拼装"题
    const sentences = doc.paragraphs.flatMap(p => p.sentences);
    let questionsCreated = 0;
    
    for (const pair of sentencePairs) {
      try {
        // 寻找匹配的数据库句子
        const matchedSent = sentences.find(s => 
          this.normalizeForCompare(s.content).includes(this.normalizeForCompare(pair.en!)) || 
          this.normalizeForCompare(pair.en!).includes(this.normalizeForCompare(s.content))
        );

        if (!matchedSent) continue;

        // 增量检查：如果该句子已经有了题目，且不是强制刷新模式，则跳过
        if (!force) {
          const hasQuestions = await this.prisma.exerciseQuestion.count({
            where: { sentenceId: matchedSent.id }
          });
          if (hasQuestions > 0) continue;
        }

        const aiRes = await this.aiService.generateAdvancedQuestions({
          chinese_sentence: pair.zh,
          chinese_words: [],
          english_sentence: pair.en!,
          english_words: []
        });

        if (aiRes.sentence_completion) {
          const sc = aiRes.sentence_completion;
          await this.prisma.exerciseQuestion.create({
            data: {
              type: 'SENTENCE_COMPLETION',
              promptZh: pair.zh,
              answerEn: pair.en!,
              blankedEn: sc.template,
              structuredData: sc as any,
              documentId,
              sentenceId: matchedSent.id,
            },
          });

          if (aiRes.sentence_scramble) {
            const ss = aiRes.sentence_scramble;
            const shuffledTokens: string[] = this.shuffleArray((ss.tokens || []) as string[]);
            await this.prisma.exerciseQuestion.create({
              data: {
                type: 'SCRAMBLE',
                promptZh: ss.promptZh || pair.zh,
                answerEn: ss.answerEn || pair.en!,
                scrambledTokens: shuffledTokens,
                documentId,
                sentenceId: matchedSent.id,
              },
            });
          }
          questionsCreated += 2;
        }
      } catch (e) {
        this.logger.error(`Failed to generate sentence question: ${e.message}`);
      }
    }

    // 3. 为单词生成“单词选择”题
    for (const pair of wordPairs) {
      try {
        // 单词题增量检查：如果该单词已经作为题目存在（根据 answerEn 判定），则跳过
        if (!force) {
          const hasWordQuestion = await this.prisma.exerciseQuestion.count({
            where: { 
              documentId,
              type: 'WORD_MATCHING',
              answerEn: pair.en!
            }
          });
          if (hasWordQuestion > 0) continue;
        }

        const aiRes = await this.aiService.generateAdvancedQuestions({
          chinese_sentence: '',
          chinese_words: [pair.zh],
          english_sentence: '',
          english_words: [pair.en!]
        });

        if (Array.isArray(aiRes.word_matching)) {
          for (const wm of aiRes.word_matching) {
            const firstSentId = doc.paragraphs[0]?.sentences[0]?.id;
            if (firstSentId) {
              await this.prisma.exerciseQuestion.create({
                data: {
                  type: 'WORD_MATCHING',
                  promptZh: wm.chinese_meaning,
                  answerEn: wm.correct_word,
                  options: wm.options,
                  structuredData: wm as any,
                  documentId,
                  sentenceId: firstSentId,
                },
              });
              questionsCreated++;
            }
          }
        }
      } catch (e) {
        this.logger.error(`Failed to generate word question: ${e.message}`);
      }
    }

    return { total: questionsCreated, generated: questionsCreated };
  }

  async getQuestions(documentId: string, limit: number = 20) {
    const questions = await this.prisma.exerciseQuestion.findMany({
      where: { documentId },
    });
    return this.shuffleArray(questions).slice(0, limit);
  }
}
