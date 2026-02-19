export type DocumentItem = {
    id: string;
    title: string;
    filename: string;
    fileSize: number;
    mimeType: string;
    originalText?: string | null;
    chineseText?: string | null;
    englishText?: string | null;
    createdAt: string;
    updatedAt: string;
};
export type DocumentDetail = DocumentItem & {
    paragraphs: Array<{
        id: string;
        content: string;
        orderIndex: number;
        sentences: Array<{
            id: string;
            content: string;
            orderIndex: number;
        }>;
    }>;
};
export declare function fetchDocuments(): Promise<DocumentItem[]>;
export type WordDefinition = {
    word: string;
    phonetic?: string;
    translation?: string;
    definitionZh?: string;
    meanings: Array<{
        partOfSpeech: string;
        definitions: Array<{
            definition: string;
            example?: string;
        }>;
    }>;
};
export type UserWord = {
    id: string;
    word: string;
    translation?: string;
    definition?: string;
    status: string;
    sourceSentenceId?: string;
    sourceSentence?: {
        id: string;
        content: string;
        paragraphId: string;
        paragraph: {
            id: string;
            documentId: string;
            document: {
                id: string;
                title: string;
            };
        };
    };
    nextReviewAt: string;
};
export declare function lookupWord(word: string): Promise<WordDefinition>;
export declare function fetchUserWords(): Promise<UserWord[]>;
export declare function upsertUserWord(word: string, status?: string, sourceSentenceId?: string, translation?: string, definition?: string): Promise<UserWord>;
export declare function deleteUserWord(word: string): Promise<void>;
export declare function updateUserWordStatus(word: string, status: string): Promise<UserWord>;
export declare function fillMissingTranslations(): Promise<{
    total: number;
    processed: number;
}>;
export declare function fetchReviewQueue(): Promise<UserWord[]>;
export declare function submitReview(word: string, quality: number): Promise<UserWord>;
export declare function getTTSUrl(text: string): string;
export type AIValidationResult = {
    isCorrect: boolean;
    score: number;
    correction: string;
    nativeSuggestion: string;
    explanation: string;
    wordUsage: string;
};
export declare function validateSentence(word: string, scenario: string, sentence: string): Promise<AIValidationResult>;
export type Exercise = {
    sentenceId: string;
    originalContent: string;
    blankedContent?: string;
    targetWord?: string;
    translation?: string;
    type: 'fill' | 'scramble';
    scrambledWords?: string[];
};
export declare function fetchExercises(documentId: string): Promise<Exercise[]>;
export declare function fetchDocument(id: string): Promise<DocumentDetail>;
export declare function uploadDocument(file: File, title?: string): Promise<DocumentItem>;
export declare function uploadImages(files: File[], title?: string): Promise<DocumentItem>;
export declare function createManualDocument(title: string, content: string): Promise<DocumentItem>;
export declare function appendText(id: string, text: string): Promise<DocumentDetail>;
export declare function appendImages(id: string, files: File[]): Promise<DocumentDetail>;
export type DocumentTranslation = {
    documentId: string;
    total: number;
    translated: number;
    translationText: string;
    sentenceData: Array<{
        id: string;
        content: string;
        translationZh: string | null;
    }>;
};
export type ExerciseQuestion = {
    id: string;
    type: 'SCRAMBLE' | 'CHOICE' | 'SENTENCE_COMPLETION' | 'WORD_MATCHING';
    promptZh: string;
    answerEn: string;
    scrambledTokens: string[];
    blankedEn?: string;
    options: string[];
    structuredData?: any;
};
export declare function generateQuestionBank(id: string, force?: boolean): Promise<{
    total: number;
    generated: number;
}>;
export declare function fetchQuestionBank(id: string, limit?: number): Promise<ExerciseQuestion[]>;
export declare function translateMissingSentences(id: string): Promise<{
    total: number;
    translated: number;
}>;
export declare function translateAlignRebuild(id: string): Promise<{
    total: number;
    status: string;
}>;
export declare function fetchDocumentTranslation(id: string): Promise<DocumentTranslation>;
export declare function resetDatabase(): Promise<{
    message: string;
    timestamp: string;
}>;
