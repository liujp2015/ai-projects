import { PrismaService } from '../prisma/prisma.service';
import { OCRService } from '../ai/ocr.service';
import { AIService } from '../ai/ai.service';
export declare class DocumentService {
    private prisma;
    private ocrService;
    private aiService;
    private readonly logger;
    private readonly generatingQuestionDocs;
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
        createdAt: Date;
        updatedAt: Date;
        title: string;
        filename: string;
        fileSize: number;
        mimeType: string;
        hasOcrValidationIssues: boolean;
        ocrValidationIssues: string | null;
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
            documentId: string;
            orderIndex: number;
        })[];
        alignedWordPairs: {
            id: string;
            en: string;
            zh: string;
            lemma: string | null;
            documentId: string;
            createdAt: Date;
            updatedAt: Date;
            orderIndex: number;
            partOfSpeech: string | null;
            isImportant: boolean;
        }[];
    } & {
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
            documentId: string;
            orderIndex: number;
        })[];
        alignedWordPairs: {
            id: string;
            en: string;
            zh: string;
            lemma: string | null;
            documentId: string;
            createdAt: Date;
            updatedAt: Date;
            orderIndex: number;
            partOfSpeech: string | null;
            isImportant: boolean;
        }[];
    } & {
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
            documentId: string;
            orderIndex: number;
        })[];
        alignedWordPairs: {
            id: string;
            en: string;
            zh: string;
            lemma: string | null;
            documentId: string;
            createdAt: Date;
            updatedAt: Date;
            orderIndex: number;
            partOfSpeech: string | null;
            isImportant: boolean;
        }[];
    } & {
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
        failed: number;
        skippedWordPairs: any;
    }>;
    getQuestions(documentId: string, limit?: number): Promise<{
        type: import("@prisma/client").$Enums.QuestionType;
        id: string;
        options: string[];
        documentId: string;
        createdAt: Date;
        updatedAt: Date;
        sentenceId: string;
        promptZh: string;
        answerEn: string;
        scrambledTokens: string[];
        blankedEn: string | null;
        structuredData: import("@prisma/client/runtime/library").JsonValue | null;
    }[]>;
    generateWordQuiz(documentId: string, force?: boolean): Promise<{
        total: number;
        generated: number;
    }>;
    getWordQuiz(documentId: string, limit?: number): Promise<any[]>;
    extractWordsFromDocument(documentId: string): Promise<{
        extracted: number;
        message: string;
    }>;
    getExtractedWords(documentId: string, partOfSpeech?: string): Promise<{
        sentence: string;
        id: string;
        lemma: string | null;
        documentId: string;
        createdAt: Date;
        updatedAt: Date;
        word: string;
        translation: string | null;
        partOfSpeech: string;
    }[]>;
    exportLemmas(documentId: string): Promise<string>;
    backfillLemmas(documentId: string): Promise<{
        total: number;
        message: string;
        posSynced?: undefined;
    } | {
        total: number;
        posSynced: number;
        message: string;
    }>;
    updateWordPair(pairId: string, data: {
        isImportant?: boolean;
        partOfSpeech?: string;
    }): Promise<{
        id: string;
        en: string;
        zh: string;
        lemma: string | null;
        documentId: string;
        createdAt: Date;
        updatedAt: Date;
        orderIndex: number;
        partOfSpeech: string | null;
        isImportant: boolean;
    }>;
}
