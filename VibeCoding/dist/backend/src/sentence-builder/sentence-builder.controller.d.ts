import { SentenceBuilderService, SceneLexicon } from './sentence-builder.service';
export declare class SentenceBuilderController {
    private readonly service;
    constructor(service: SentenceBuilderService);
    getSceneLexicon(body: {
        scene: string;
        word?: string;
        language?: string;
        targetUserLevel?: string;
    }): Promise<SceneLexicon>;
    evaluate(body: {
        scene: string;
        word?: string;
        sentence: string;
        userLevel?: string;
    }): Promise<any>;
    nextToken(body: {
        scene: string;
        currentTokens: any[];
        allOptions: SceneLexicon;
    }): Promise<{
        nextCategory: "subjects" | "verbs" | "objects" | "modifiers" | "done";
        recommendedIds: string[];
    }>;
    save(body: {
        word: string;
        scene: string;
        sentence: string;
        source?: 'USER' | 'SUGGESTED' | 'EVAL' | string;
    }): Promise<{
        sentence: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        word: string;
        scene: string;
        source: import("@prisma/client").$Enums.SavedSentenceSource;
    }>;
    list(word: string, scene?: string): Promise<{
        sentence: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        word: string;
        scene: string;
        source: import("@prisma/client").$Enums.SavedSentenceSource;
    }[]>;
    remove(id: string): Promise<{
        id: string;
        deleted: boolean;
    }>;
}
