export type DocumentItem = {
    id: string;
    title: string;
    filename: string;
    fileSize: number;
    mimeType: string;
    originalText?: string | null;
    chineseText?: string | null;
    englishText?: string | null;
    hasOcrValidationIssues?: boolean;
    ocrValidationIssues?: string | null;
    createdAt: string;
    updatedAt: string;
    alignedWordPairs?: Array<{
        id: string;
        en: string;
        zh: string;
        lemma?: string | null;
        partOfSpeech?: string | null;
        isImportant?: boolean;
        orderIndex: number;
    }>;
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
    phonetics?: Array<{
        text?: string;
        audio?: string;
    }>;
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
    category?: string | null;
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
    createdAt?: string;
    updatedAt?: string;
};
export declare function lookupWord(word: string): Promise<WordDefinition>;
export declare function fetchUserWords(): Promise<UserWord[]>;
export declare function upsertUserWord(word: string, status?: string, sourceSentenceId?: string, translation?: string, definition?: string): Promise<UserWord>;
export declare function deleteUserWord(word: string): Promise<void>;
export declare function updateUserWordStatus(word: string, status: string): Promise<UserWord>;
export declare function updateUserWordCategory(word: string, category: string | null): Promise<UserWord>;
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
export type SentencePatternTrainingItem = {
    en: string;
    zh: string;
};
export type SentencePatternTrainingResponse = {
    sentence: string;
    scenario: string;
    items: SentencePatternTrainingItem[];
    count: number;
};
export type SentencePatternTrainingHistoryItem = {
    id: string;
    documentId: string | null;
    sourceSentence: string;
    scenario: string;
    items: SentencePatternTrainingItem[];
    createdAt: string;
    updatedAt: string;
};
export declare function validateSentence(word: string, scenario: string, sentence: string): Promise<AIValidationResult>;
export declare function generateSentencePatternTraining(sentence: string, scenario: string, documentId?: string): Promise<SentencePatternTrainingResponse>;
export declare function fetchSentencePatternTrainingHistory(params?: {
    documentId?: string;
    sentence?: string;
    limit?: number;
}): Promise<{
    items: SentencePatternTrainingHistoryItem[];
    count: number;
}>;
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
    failed?: number;
    skippedWordPairs?: number;
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
export type ExtractedWord = {
    id: string;
    word: string;
    lemma: string | null;
    partOfSpeech: string;
    translation: string | null;
    sentence: string;
    documentId: string;
    createdAt: string;
    updatedAt: string;
};
export declare function extractWordsFromDocument(id: string): Promise<{
    extracted: number;
    message: string;
}>;
export declare function fetchExtractedWords(id: string, partOfSpeech?: string): Promise<ExtractedWord[]>;
export type WordQuizQuestion = {
    id: string;
    type: 'ZH_TO_EN' | 'EN_TO_ZH';
    prompt: string;
    answer: string;
    options: string[];
    sentenceContext?: string | null;
    documentId: string;
    createdAt: string;
    updatedAt: string;
};
export declare function generateWordQuiz(id: string, force?: boolean): Promise<{
    total: number;
    generated: number;
}>;
export declare function fetchWordQuizQuestions(id: string, limit?: number): Promise<WordQuizQuestion[]>;
export declare function exportDocumentLemmas(id: string): Promise<string>;
export declare function backfillDocumentLemmas(id: string): Promise<{
    total: number;
    message: string;
}>;
export type ConversationMessage = {
    id: string;
    speaker: string;
    content: string;
    orderIndex: number;
    imageUrl?: string | null;
    createdAt: string;
    updatedAt: string;
};
export type Conversation = {
    id: string;
    title: string;
    description?: string | null;
    messages: ConversationMessage[];
    createdAt: string;
    updatedAt: string;
};
export declare function uploadConversation(files: File[], title?: string): Promise<Conversation>;
export declare function fetchConversations(): Promise<Conversation[]>;
export declare function fetchConversation(id: string): Promise<Conversation>;
export declare function deleteConversation(id: string): Promise<void>;
export declare function resetDatabase(): Promise<{
    message: string;
    timestamp: string;
}>;
export type ReviewCard = {
    id: string;
    documentId: string;
    word: string;
    partOfSpeech: string;
    translation: string | null;
    sentence: string | null;
    stage: number;
    lastReviewAt: string | null;
    nextReviewAt: string;
    status: 'LEARNING' | 'MASTERED';
    createdAt: string;
    updatedAt: string;
};
export declare function importReviewCards(documentId: string): Promise<{
    total: number;
    inserted: number;
    updated: number;
    skipped: number;
    posSynced?: number;
    message?: string;
}>;
export declare function fetchReviewSummary(documentId: string): Promise<{
    dueCount: number;
    learningCount: number;
    masteredCount: number;
    totalCount: number;
}>;
export declare function fetchDueReviewCards(documentId: string, limit?: number, partOfSpeech?: string, mode?: 'due' | 'all'): Promise<ReviewCard[]>;
export declare function updateAlignedWordPair(pairId: string, data: {
    isImportant?: boolean;
    partOfSpeech?: string | null;
}): Promise<any>;
export declare function gradeReviewCard(cardId: string, result: 'GOOD' | 'AGAIN'): Promise<ReviewCard>;
