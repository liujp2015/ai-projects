import { SentenceBuilderService, SceneLexicon } from './sentence-builder.service';
export declare class SentenceBuilderController {
    private readonly service;
    constructor(service: SentenceBuilderService);
    getSceneLexicon(body: {
        scene: string;
        language?: string;
        targetUserLevel?: string;
    }): Promise<SceneLexicon>;
    evaluate(body: {
        scene: string;
        sentence: string;
        userLevel?: string;
    }): Promise<any>;
    nextToken(body: {
        scene: string;
        currentTokens: string[];
        allOptions: SceneLexicon;
    }): Promise<{
        nextCategory: "subjects" | "verbs" | "objects" | "modifiers" | "done";
        recommendedIds: string[];
    }>;
}
