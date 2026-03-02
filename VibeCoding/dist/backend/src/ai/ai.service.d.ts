import { PrismaService } from '../prisma/prisma.service';
export type AlignedSentencePair = {
    en: string;
    zh: string;
};
export type SentencePatternTrainingItem = {
    en: string;
    zh: string;
};
export declare class AIService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    mergeAndDeduplicate(texts: string[]): Promise<string>;
    validateSentence(word: string, scenario: string, sentence: string): Promise<any>;
    generateSentencePatternTraining(sentence: string, scenario: string): Promise<SentencePatternTrainingItem[]>;
    saveSentencePatternTrainingHistory(params: {
        documentId?: string;
        sourceSentence: string;
        scenario: string;
        items: SentencePatternTrainingItem[];
    }): Promise<{
        id: string;
        documentId: string | null;
        sourceSentence: string;
        scenario: string;
        items: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getSentencePatternTrainingHistory(params: {
        documentId?: string;
        sourceSentence?: string;
        limit?: number;
    }): Promise<{
        id: string;
        documentId: string | null;
        sourceSentence: string;
        scenario: string;
        items: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
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
    extractWordsFromSentences(sentences: string[]): Promise<Array<{
        word: string;
        lemma: string | null;
        partOfSpeech: string;
        translation: string;
        sentence: string;
    }>>;
    generateWordQuizQuestions(words: Array<{
        word: string;
        translation: string;
        partOfSpeech: string;
        sentence: string;
    }>): Promise<any>;
    getLemmasForWords(words: string[]): Promise<Record<string, string>>;
}
