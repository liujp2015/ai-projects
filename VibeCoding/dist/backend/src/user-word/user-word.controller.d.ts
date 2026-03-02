import { UserWordService } from './user-word.service';
export declare class UserWordController {
    private readonly userWordService;
    constructor(userWordService: UserWordService);
    upsert(word: string, status?: string, sourceSentenceId?: string, translation?: string, definition?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        word: string;
        translation: string | null;
        definition: string | null;
        status: string;
        category: string | null;
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
        category: string | null;
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
        category: string | null;
        interval: number;
        difficulty: number;
        reps: number;
        nextReviewAt: Date;
        sourceSentenceId: string | null;
    } | null>;
    fillMissing(): Promise<{
        total: number;
        processed: number;
        details: {
            word: string;
            success: boolean;
            error?: string;
        }[];
    }>;
    getReviewQueue(): Promise<({
        sourceSentence: ({
            paragraph: {
                document: {
                    originalText: string | null;
                    chineseText: string | null;
                    englishText: string | null;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    title: string;
                    filename: string;
                    fileSize: number;
                    mimeType: string;
                    hasOcrValidationIssues: boolean;
                    ocrValidationIssues: string | null;
                };
            } & {
                id: string;
                content: string;
                documentId: string;
                orderIndex: number;
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
        category: string | null;
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
        category: string | null;
        interval: number;
        difficulty: number;
        reps: number;
        nextReviewAt: Date;
        sourceSentenceId: string | null;
    }>;
    updateStatus(word: string, status: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        word: string;
        translation: string | null;
        definition: string | null;
        status: string;
        category: string | null;
        interval: number;
        difficulty: number;
        reps: number;
        nextReviewAt: Date;
        sourceSentenceId: string | null;
    }>;
    updateCategory(word: string, category: string | null): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        word: string;
        translation: string | null;
        definition: string | null;
        status: string;
        category: string | null;
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
        category: string | null;
        interval: number;
        difficulty: number;
        reps: number;
        nextReviewAt: Date;
        sourceSentenceId: string | null;
    }>;
}
