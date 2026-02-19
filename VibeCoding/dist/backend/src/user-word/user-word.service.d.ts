import { PrismaService } from '../prisma/prisma.service';
import { DictionaryService } from '../dictionary/dictionary.service';
import { SRSService } from './srs.service';
export declare class UserWordService {
    private prisma;
    private dictionaryService;
    private srsService;
    constructor(prisma: PrismaService, dictionaryService: DictionaryService, srsService: SRSService);
    upsert(word: string, status?: string, sourceSentenceId?: string, translation?: string, definition?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        word: string;
        translation: string | null;
        definition: string | null;
        status: string;
        interval: number;
        difficulty: number;
        reps: number;
        nextReviewAt: Date;
        sourceSentenceId: string | null;
    }>;
    findAll(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        word: string;
        translation: string | null;
        definition: string | null;
        status: string;
        interval: number;
        difficulty: number;
        reps: number;
        nextReviewAt: Date;
        sourceSentenceId: string | null;
    }[]>;
    findByWord(word: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        word: string;
        translation: string | null;
        definition: string | null;
        status: string;
        interval: number;
        difficulty: number;
        reps: number;
        nextReviewAt: Date;
        sourceSentenceId: string | null;
    } | null>;
    updateStatus(word: string, status: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        word: string;
        translation: string | null;
        definition: string | null;
        status: string;
        interval: number;
        difficulty: number;
        reps: number;
        nextReviewAt: Date;
        sourceSentenceId: string | null;
    }>;
    remove(word: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        word: string;
        translation: string | null;
        definition: string | null;
        status: string;
        interval: number;
        difficulty: number;
        reps: number;
        nextReviewAt: Date;
        sourceSentenceId: string | null;
    }>;
    getReviewQueue(): Promise<({
        sourceSentence: ({
            paragraph: {
                document: {
                    originalText: string | null;
                    chineseText: string | null;
                    englishText: string | null;
                    id: string;
                    title: string;
                    filename: string;
                    fileSize: number;
                    mimeType: string;
                    createdAt: Date;
                    updatedAt: Date;
                };
            } & {
                id: string;
                content: string;
                orderIndex: number;
                documentId: string;
            };
        } & {
            id: string;
            content: string;
            orderIndex: number;
            translationZh: string | null;
            paragraphId: string;
        }) | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        word: string;
        translation: string | null;
        definition: string | null;
        status: string;
        interval: number;
        difficulty: number;
        reps: number;
        nextReviewAt: Date;
        sourceSentenceId: string | null;
    })[]>;
    submitReview(word: string, quality: number): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        word: string;
        translation: string | null;
        definition: string | null;
        status: string;
        interval: number;
        difficulty: number;
        reps: number;
        nextReviewAt: Date;
        sourceSentenceId: string | null;
    }>;
    fillMissingTranslations(): Promise<{
        total: number;
        processed: number;
        details: {
            word: string;
            success: boolean;
            error?: string;
        }[];
    }>;
}
