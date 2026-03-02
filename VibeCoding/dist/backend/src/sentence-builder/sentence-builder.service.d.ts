import { PrismaService } from '../prisma/prisma.service';
export type SceneLexiconToken = {
    id: string;
    text: string;
};
export type SceneLexicon = {
    scene: string;
    requiredWord?: string;
    corePhrases?: SceneLexiconToken[];
    subjects: SceneLexiconToken[];
    verbs: SceneLexiconToken[];
    objects: SceneLexiconToken[];
    modifiers: SceneLexiconToken[];
    suggestedSentences?: string[];
};
export type CurrentSelectionToken = {
    category: 'core' | 'subject' | 'verb' | 'modifier' | 'object';
    id: string;
    text: string;
};
export declare class SentenceBuilderService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private extractJsonText;
    generateSceneLexicon(scene: string, level: string, requiredWord?: string): Promise<SceneLexicon>;
    evaluateSentence(payload: {
        scene: string;
        word?: string;
        sentence: string;
        userLevel: string;
    }): Promise<any>;
    suggestNextTokens(payload: {
        scene: string;
        currentTokens: Array<string | CurrentSelectionToken>;
        allOptions: SceneLexicon;
    }): Promise<{
        nextCategory: "subjects" | "verbs" | "objects" | "modifiers" | "done";
        recommendedIds: string[];
    }>;
    private normalizeWord;
    private normalizeScene;
    private normalizeSentence;
    private sentenceContainsWord;
    saveSentence(input: {
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
    listSavedSentences(input: {
        word: string;
        scene?: string;
    }): Promise<{
        sentence: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        word: string;
        scene: string;
        source: import("@prisma/client").$Enums.SavedSentenceSource;
    }[]>;
    deleteSavedSentence(id: string): Promise<{
        id: string;
        deleted: boolean;
    }>;
}
