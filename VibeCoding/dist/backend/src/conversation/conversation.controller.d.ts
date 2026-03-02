import { ConversationService } from './conversation.service';
export declare class ConversationController {
    private readonly conversationService;
    constructor(conversationService: ConversationService);
    uploadConversation(files: Express.Multer.File[], title?: string): Promise<{
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
