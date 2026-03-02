import { DocumentService } from './document.service';
export declare class DocumentController {
    private readonly documentService;
    private readonly logger;
    constructor(documentService: DocumentService);
    uploadFile(file: Express.Multer.File, title?: string): Promise<any>;
    uploadImages(files: Express.Multer.File[], title?: string): Promise<any>;
    createManual(title: string, content: string): Promise<any>;
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
    translateMissing(id: string): Promise<{
        total: number;
        translated: number;
    }>;
    translateAlignRebuild(id: string): Promise<{
        total: number;
        status: string;
    }>;
    getTranslation(id: string): Promise<{
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
    generateQuestions(id: string, force?: boolean): Promise<{
        total: number;
        generated: number;
        failed: number;
        skippedWordPairs: any;
    }>;
    appendText(id: string, text: string): Promise<({
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
    appendImages(id: string, files: Express.Multer.File[]): Promise<({
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
    getQuestions(id: string, limit?: string): Promise<{
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
    extractWords(id: string): Promise<{
        extracted: number;
        message: string;
    }>;
    getExtractedWords(id: string, partOfSpeech?: string): Promise<{
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
    generateWordQuiz(id: string, force?: boolean): Promise<{
        total: number;
        generated: number;
    }>;
    getWordQuiz(id: string, limit?: string): Promise<any[]>;
    exportLemmas(id: string): Promise<string>;
    backfillLemmas(id: string): Promise<{
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
