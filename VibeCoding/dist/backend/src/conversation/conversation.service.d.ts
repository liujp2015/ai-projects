import { PrismaService } from '../prisma/prisma.service';
import { OCRService } from '../ai/ocr.service';
import { AIService } from '../ai/ai.service';
export declare class ConversationService {
    private prisma;
    private ocrService;
    private aiService;
    private readonly logger;
    constructor(prisma: PrismaService, ocrService: OCRService, aiService: AIService);
    extractConversationFromImages(files: Express.Multer.File[], title?: string): Promise<{
        messages: {
            id: string;
            content: string;
            createdAt: Date;
            updatedAt: Date;
            orderIndex: number;
            speaker: string;
            imageUrl: string | null;
            conversationId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
    }>;
    private extractDialogueFromText;
    private extractJsonText;
    findAll(): Promise<({
        messages: {
            id: string;
            content: string;
            createdAt: Date;
            updatedAt: Date;
            orderIndex: number;
            speaker: string;
            imageUrl: string | null;
            conversationId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
    })[]>;
    findOne(id: string): Promise<({
        messages: {
            id: string;
            content: string;
            createdAt: Date;
            updatedAt: Date;
            orderIndex: number;
            speaker: string;
            imageUrl: string | null;
            conversationId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
    }) | null>;
    delete(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
    }>;
}
