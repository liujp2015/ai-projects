import { ReviewService } from './review.service';
type GradeBody = {
    result: 'GOOD' | 'AGAIN';
};
export declare class ReviewController {
    private readonly reviewService;
    constructor(reviewService: ReviewService);
    import(documentId: string): Promise<{
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
    due(documentId: string, limit?: number, partOfSpeech?: string, mode?: 'due' | 'all'): Promise<{
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
    grade(cardId: string, body: GradeBody): Promise<{
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
    summary(documentId: string): Promise<{
        dueCount: number;
        learningCount: number;
        masteredCount: number;
        totalCount: number;
    }>;
}
export {};
