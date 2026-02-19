import { DocumentService } from './document.service';
export declare class DocumentController {
    private readonly documentService;
    constructor(documentService: DocumentService);
    uploadFile(file: Express.Multer.File, title?: string): Promise<any>;
    uploadImages(files: Express.Multer.File[], title?: string): Promise<any>;
    createManual(title: string, content: string): Promise<any>;
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
    getQuestions(id: string, limit?: string): Promise<{
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
        structuredData: import("@prisma/client/runtime/library").JsonValue | null;
    }[]>;
}
