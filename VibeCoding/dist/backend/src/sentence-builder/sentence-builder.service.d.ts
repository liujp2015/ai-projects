export type SceneLexiconToken = {
    id: string;
    text: string;
};
export type SceneLexicon = {
    scene: string;
    subjects: SceneLexiconToken[];
    verbs: SceneLexiconToken[];
    objects: SceneLexiconToken[];
    modifiers: SceneLexiconToken[];
};
export declare class SentenceBuilderService {
    private readonly logger;
    private extractJsonText;
    generateSceneLexicon(scene: string, level: string): Promise<SceneLexicon>;
    evaluateSentence(payload: {
        scene: string;
        sentence: string;
        userLevel: string;
    }): Promise<any>;
    suggestNextTokens(payload: {
        scene: string;
        currentTokens: string[];
        allOptions: SceneLexicon;
    }): Promise<{
        nextCategory: "subjects" | "verbs" | "objects" | "modifiers" | "done";
        recommendedIds: string[];
    }>;
}
