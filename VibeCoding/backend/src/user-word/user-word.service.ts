import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DictionaryService } from '../dictionary/dictionary.service';
import { SRSService } from './srs.service';

@Injectable()
export class UserWordService {
  constructor(
    private prisma: PrismaService,
    private dictionaryService: DictionaryService,
    private srsService: SRSService,
  ) {}

  async upsert(word: string, status?: string, sourceSentenceId?: string, translation?: string, definition?: string) {
    const cleanWord = word.toLowerCase().trim();
    return this.prisma.userWord.upsert({
      where: { word: cleanWord },
      update: {
        status: status,
        sourceSentenceId: sourceSentenceId,
        translation: translation,
        definition: definition,
      },
      create: {
        word: cleanWord,
        status: status || 'NEW',
        sourceSentenceId: sourceSentenceId,
        translation: translation,
        definition: definition,
      },
    });
  }

  async findAll() {
    return this.prisma.userWord.findMany({
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findByWord(word: string) {
    return this.prisma.userWord.findUnique({
      where: { word: word.toLowerCase().trim() },
    });
  }

  async updateStatus(word: string, status: string) {
    return this.prisma.userWord.update({
      where: { word: word.toLowerCase().trim() },
      data: { status },
    });
  }

  async updateCategory(word: string, category: string | null) {
    return this.prisma.userWord.update({
      where: { word: word.toLowerCase().trim() },
      data: { category: category || null },
    });
  }

  async remove(word: string) {
    return this.prisma.userWord.delete({
      where: { word: word.toLowerCase().trim() },
    });
  }

  async getReviewQueue() {
    const now = new Date();
    return this.prisma.userWord.findMany({
      where: {
        nextReviewAt: {
          lte: now,
        },
      },
      include: {
        sourceSentence: {
          include: {
            paragraph: {
              include: {
                document: true,
              },
            },
          },
        },
      },
      orderBy: {
        nextReviewAt: 'asc',
      },
    });
  }

  async submitReview(word: string, quality: number) {
    const userWord = await this.findByWord(word);
    if (!userWord) throw new Error('Word not found in collection');

    const nextReview = this.srsService.calculateNextReview(
      quality,
      userWord.interval,
      userWord.reps,
      userWord.difficulty,
    );

    return this.prisma.userWord.update({
      where: { word: word.toLowerCase().trim() },
      data: {
        interval: nextReview.interval,
        reps: nextReview.reps,
        difficulty: nextReview.difficulty,
        nextReviewAt: nextReview.nextReviewAt,
        status: quality >= 3 ? 'LEARNING' : 'NEW',
      },
    });
  }

  async fillMissingTranslations() {
    const wordsMissingData = await this.prisma.userWord.findMany({
      where: {
        OR: [
          { translation: null },
          { translation: '' },
          { definition: null },
          { definition: '' },
        ],
      },
    });

    const results: Array<{ word: string; success: boolean; error?: string }> = [];
    for (const userWord of wordsMissingData) {
      try {
        const lookupResult = await this.dictionaryService.lookup(userWord.word);
        if (lookupResult) {
          await this.prisma.userWord.update({
            where: { id: userWord.id },
            data: {
              translation: (lookupResult as any).translation,
              definition: (lookupResult as any).definitionZh,
            },
          });
          results.push({ word: userWord.word, success: true });
        }
      } catch (error) {
        results.push({ word: userWord.word, success: false, error: error.message });
      }
    }
    return {
      total: wordsMissingData.length,
      processed: results.length,
      details: results,
    };
  }
}

