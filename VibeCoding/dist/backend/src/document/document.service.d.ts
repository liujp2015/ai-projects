import { PrismaService } from '../prisma/prisma.service';
import { OCRService } from '../ai/ocr.service';
import { AIService } from '../ai/ai.service';
import { Prisma } from '@prisma/client';
export declare class DocumentService {
    private prisma;
    private ocrService;
    private aiService;
    private readonly logger;
    constructor(prisma: PrismaService, ocrService: OCRService, aiService: AIService);
    parseAndSaveDocument(file: Express.Multer.File, title: string): Promise<any>;
    parseAndSaveImages(files: Express.Multer.File[], title: string): Promise<any>;
    saveRawText(content: string, title: string): Promise<any>;
    private saveStructuredContentWithOCR;
    private saveStructuredContent;
    findAll(): Promise<{
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
    }[]>;
    findOne(id: string): Promise<({
        paragraphs: ({
            sentences: {
                id: string;
                content: string;
                orderIndex: number;
                translationZh: string | null;
                paragraphId: string;
            }[];
        } & {
            id: string;
            content: string;
            orderIndex: number;
            documentId: string;
        })[];
    } & {
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
    }) | null>;
    appendText(documentId: string, newText: string): Promise<({
        paragraphs: ({
            sentences: {
                id: string;
                content: string;
                orderIndex: number;
                translationZh: string | null;
                paragraphId: string;
            }[];
        } & {
            id: string;
            content: string;
            orderIndex: number;
            documentId: string;
        })[];
    } & {
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
    }) | null>;
    appendImages(documentId: string, files: Express.Multer.File[]): Promise<({
        paragraphs: ({
            sentences: {
                id: string;
                content: string;
                orderIndex: number;
                translationZh: string | null;
                paragraphId: string;
            }[];
        } & {
            id: string;
            content: string;
            orderIndex: number;
            documentId: string;
        })[];
    } & {
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
    }) | null>;
    translateAlignRebuild(documentId: string, overrideFullText?: string): Promise<{
        total: number;
        status: string;
    }>;
    translateMissingSentences(documentId: string): Promise<{
        total: number;
        translated: number;
    }>;
    getDocumentTranslation(documentId: string): Promise<{
        documentId: string;
        total: number;
        translated: number;
        translationText: string;
        sentenceData: {
            id: string;
            content: string;
            translationZh: string | null;
        }[];
    } | null>;
    private tokenizeForTest;
    private shuffleArray;
    private getRandomWordsFromDoc;
    private normalizeForCompare;
    generateQuestions(documentId: string, force?: boolean): Promise<{
        total: number;
        generated: number;
    }>;
    getQuestions(documentId: string, limit?: number): Promise<{
        type: import("@prisma/client").$Enums.QuestionType;
        id: string;
        options: string[];
        createdAt: Date;
        updatedAt: Date;
        documentId: string;
        sentenceId: string;
        promptZh: string;
        answerEn: string;
        scrambledTokens: string[];
        blankedEn: string | null;
        structuredData: Prisma.JsonValue | null;
    }[]>;
}
