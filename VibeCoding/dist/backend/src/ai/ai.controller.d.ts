import { AIService } from './ai.service';
export declare class AIController {
    private readonly aiService;
    constructor(aiService: AIService);
    validate(word: string, scenario: string, sentence: string): Promise<any>;
    qwenImagesParse(files: Express.Multer.File[]): Promise<string>;
    sentencePatternTraining(sentence: string, scenario: string, documentId?: string): Promise<{
        sentence: string;
        scenario: string;
        items: import("./ai.service").SentencePatternTrainingItem[];
        count: number;
    }>;
    sentencePatternTrainingHistory(documentId?: string, sentence?: string, limit?: string): Promise<{
        items: {
            id: string;
            documentId: string | null;
            sourceSentence: string;
            scenario: string;
            items: import("@prisma/client/runtime/library").JsonValue;
            createdAt: Date;
            updatedAt: Date;
        }[];
        count: number;
    }>;
}
