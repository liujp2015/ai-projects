export type AlignedSentencePair = {
    en: string;
    zh: string;
};
export declare class AIService {
    private readonly logger;
    mergeAndDeduplicate(texts: string[]): Promise<string>;
    validateSentence(word: string, scenario: string, sentence: string): Promise<any>;
    private extractJsonText;
    translateEnglishToChinese(sentences: string[]): Promise<string[]>;
    extractAlignedSentencePairsFromEnglishArticle(englishArticle: string): Promise<AlignedSentencePair[]>;
    generateQuestionsForSentences(sentences: {
        id: string;
        content: string;
        translationZh: string;
    }[]): Promise<any>;
    generateAdvancedQuestions(data: {
        chinese_sentence: string;
        chinese_words: string[];
        english_sentence: string;
        english_words: string[];
    }): Promise<any>;
    parseImagesWithQwenVL(files: Express.Multer.File[]): Promise<string>;
}
