import { PrismaService } from '../prisma/prisma.service';
export declare class ReviewService {
    private readonly prisma;
    private readonly INTERVAL_SEQUENCE;
    constructor(prisma: PrismaService);
    importFromExtractedWords(documentId: string): Promise<{
        total: number;
        inserted: number;
        skipped: number;
        message: string;
        updated?: undefined;
        posSynced?: undefined;
    } | {
        total: number;
        inserted: number;
        updated: number;
        skipped: number;
        posSynced: number;
        message?: undefined;
    }>;
    getDueCards(documentId: string, limit?: number, partOfSpeech?: string, mode?: 'due' | 'all'): Promise<{
        sentence: string | null;
        id: string;
        documentId: string;
        createdAt: Date;
        updatedAt: Date;
        word: string;
        translation: string | null;
        status: import("@prisma/client").$Enums.ReviewCardStatus;
        nextReviewAt: Date;
        partOfSpeech: string;
        stage: number;
        lastReviewAt: Date | null;
    }[]>;
    gradeCard(cardId: string, result: 'GOOD' | 'AGAIN'): Promise<{
        sentence: string | null;
        id: string;
        documentId: string;
        createdAt: Date;
        updatedAt: Date;
        word: string;
        translation: string | null;
        status: import("@prisma/client").$Enums.ReviewCardStatus;
        nextReviewAt: Date;
        partOfSpeech: string;
        stage: number;
        lastReviewAt: Date | null;
    }>;
    getSummary(documentId: string): Promise<{
        dueCount: number;
        learningCount: number;
        masteredCount: number;
        totalCount: number;
    }>;
}
