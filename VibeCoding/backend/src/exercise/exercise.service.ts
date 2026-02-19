import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type Exercise =
  | {
      type: 'fill';
  sentenceId: string;
  originalContent: string;
  blankedContent: string;
  targetWord: string;
  translation?: string;
    }
  | {
      type: 'scramble';
      sentenceId: string;
      originalContent: string;
      scrambledWords: string[];
      translation?: string;
};

@Injectable()
export class ExerciseService {
  private readonly logger = new Logger(ExerciseService.name);

  constructor(private prisma: PrismaService) {}

  async generateExercises(documentId: string): Promise<Exercise[]> {
    // 1. Get all collected words for the user
    const userWords = await this.prisma.userWord.findMany();
    const wordList = userWords.map(uw => uw.word.toLowerCase());

    if (wordList.length === 0) return [];

    // 2. Get all sentences in the document
    const sentences = await this.prisma.sentence.findMany({
      where: {
        paragraph: {
          documentId: documentId,
        },
      },
      include: {
        userWords: true, // If we have direct relations set up
      },
    });

    const exercises: Exercise[] = [];

    for (const sent of sentences) {
      // Find which collected words are in this sentence
      for (const word of wordList) {
        // Simple regex to find the word as a whole word
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        if (regex.test(sent.content)) {
          const userWord = userWords.find(uw => uw.word.toLowerCase() === word);
          
          // Randomly choose between 'fill' and 'scramble'
          const useScramble = Math.random() > 0.5;

          if (useScramble) {
            // Helper to scramble words (basic split by space)
            const words = sent.content.split(/\s+/).filter(Boolean);
            const scrambled = [...words].sort(() => Math.random() - 0.5);
            
            exercises.push({
              type: 'scramble',
              sentenceId: sent.id,
              originalContent: sent.content,
              scrambledWords: scrambled,
              translation: userWord?.translation ?? undefined,
            });
          } else {
          exercises.push({
              type: 'fill',
            sentenceId: sent.id,
            originalContent: sent.content,
            blankedContent: sent.content.replace(regex, '____'),
            targetWord: word,
              translation: userWord?.translation ?? undefined,
          });
          }
          
          // Limit to one exercise per sentence to avoid clutter
          break;
        }
      }
    }

    // Shuffle and return a max of 10 exercises
    return exercises.sort(() => Math.random() - 0.5).slice(0, 10);
  }
}

