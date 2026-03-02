"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchDocuments = fetchDocuments;
exports.lookupWord = lookupWord;
exports.fetchUserWords = fetchUserWords;
exports.upsertUserWord = upsertUserWord;
exports.deleteUserWord = deleteUserWord;
exports.updateUserWordStatus = updateUserWordStatus;
exports.updateUserWordCategory = updateUserWordCategory;
exports.fillMissingTranslations = fillMissingTranslations;
exports.fetchReviewQueue = fetchReviewQueue;
exports.submitReview = submitReview;
exports.getTTSUrl = getTTSUrl;
exports.validateSentence = validateSentence;
exports.generateSentencePatternTraining = generateSentencePatternTraining;
exports.fetchSentencePatternTrainingHistory = fetchSentencePatternTrainingHistory;
exports.fetchExercises = fetchExercises;
exports.fetchDocument = fetchDocument;
exports.uploadDocument = uploadDocument;
exports.uploadImages = uploadImages;
exports.createManualDocument = createManualDocument;
exports.appendText = appendText;
exports.appendImages = appendImages;
exports.generateQuestionBank = generateQuestionBank;
exports.fetchQuestionBank = fetchQuestionBank;
exports.translateMissingSentences = translateMissingSentences;
exports.translateAlignRebuild = translateAlignRebuild;
exports.fetchDocumentTranslation = fetchDocumentTranslation;
exports.extractWordsFromDocument = extractWordsFromDocument;
exports.fetchExtractedWords = fetchExtractedWords;
exports.generateWordQuiz = generateWordQuiz;
exports.fetchWordQuizQuestions = fetchWordQuizQuestions;
exports.exportDocumentLemmas = exportDocumentLemmas;
exports.backfillDocumentLemmas = backfillDocumentLemmas;
exports.uploadConversation = uploadConversation;
exports.fetchConversations = fetchConversations;
exports.fetchConversation = fetchConversation;
exports.deleteConversation = deleteConversation;
exports.resetDatabase = resetDatabase;
exports.importReviewCards = importReviewCards;
exports.fetchReviewSummary = fetchReviewSummary;
exports.fetchDueReviewCards = fetchDueReviewCards;
exports.updateAlignedWordPair = updateAlignedWordPair;
exports.gradeReviewCard = gradeReviewCard;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';
async function apiFetch(url, options = {}) {
    const mergedOptions = {
        ...options,
    };
    const isFormData = options.body instanceof FormData;
    const hasContentType = options.headers && ('Content-Type' in options.headers ||
        'content-type' in options.headers);
    if (isFormData) {
        mergedOptions.headers = {
            ...options.headers,
        };
        if (mergedOptions.headers) {
            delete mergedOptions.headers['Content-Type'];
            delete mergedOptions.headers['content-type'];
        }
    }
    else if (!hasContentType) {
        mergedOptions.headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };
    }
    else {
        mergedOptions.headers = {
            ...options.headers,
        };
    }
    return fetch(url, mergedOptions);
}
async function fetchDocuments() {
    const res = await apiFetch('/api/documents', { cache: 'no-store' });
    if (!res.ok)
        throw new Error(`Failed to fetch documents: ${res.status}`);
    return res.json();
}
async function lookupWord(word) {
    const res = await apiFetch(`/api/dictionary/${encodeURIComponent(word)}`);
    if (!res.ok)
        throw new Error(`Failed to lookup word: ${res.status}`);
    return res.json();
}
async function fetchUserWords() {
    const res = await apiFetch('/api/user-words');
    if (!res.ok)
        throw new Error(`Failed to fetch user words: ${res.status}`);
    return res.json();
}
async function upsertUserWord(word, status, sourceSentenceId, translation, definition) {
    const res = await apiFetch('/api/user-words', {
        method: 'POST',
        body: JSON.stringify({ word, status, sourceSentenceId, translation, definition }),
    });
    if (!res.ok)
        throw new Error(`Failed to upsert user word: ${res.status}`);
    return res.json();
}
async function deleteUserWord(word) {
    const res = await apiFetch(`/api/user-words/${encodeURIComponent(word)}`, {
        method: 'DELETE',
    });
    if (!res.ok)
        throw new Error(`Failed to delete user word: ${res.status}`);
}
async function updateUserWordStatus(word, status) {
    const res = await apiFetch(`/api/user-words/${encodeURIComponent(word)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });
    if (!res.ok)
        throw new Error(`Failed to update user word status: ${res.status}`);
    return res.json();
}
async function updateUserWordCategory(word, category) {
    const res = await apiFetch(`/api/user-words/${encodeURIComponent(word)}/category`, {
        method: 'PATCH',
        body: JSON.stringify({ category }),
    });
    if (!res.ok)
        throw new Error(`Failed to update user word category: ${res.status}`);
    return res.json();
}
async function fillMissingTranslations() {
    const res = await apiFetch('/api/user-words/fill-translations', {
        method: 'POST',
    });
    if (!res.ok)
        throw new Error(`Failed to fill translations: ${res.status}`);
    return res.json();
}
async function fetchReviewQueue() {
    const res = await apiFetch('/api/user-words/review/queue', { cache: 'no-store' });
    if (!res.ok)
        throw new Error(`Failed to fetch review queue: ${res.status}`);
    return res.json();
}
async function submitReview(word, quality) {
    const res = await apiFetch('/api/user-words/review/submit', {
        method: 'POST',
        body: JSON.stringify({ word, quality }),
    });
    if (!res.ok)
        throw new Error(`Failed to submit review: ${res.status}`);
    return res.json();
}
function getTTSUrl(text) {
    return `/api/tts/stream?text=${encodeURIComponent(text)}`;
}
async function validateSentence(word, scenario, sentence) {
    const res = await apiFetch('/api/ai/validate-sentence', {
        method: 'POST',
        body: JSON.stringify({ word, scenario, sentence }),
    });
    if (!res.ok)
        throw new Error(`AI validation failed: ${res.status}`);
    return res.json();
}
async function generateSentencePatternTraining(sentence, scenario, documentId) {
    const res = await apiFetch('/api/ai/sentence-pattern-training', {
        method: 'POST',
        body: JSON.stringify({ sentence, scenario, documentId }),
    });
    if (!res.ok)
        throw new Error(`Sentence pattern training failed: ${res.status}`);
    return res.json();
}
async function fetchSentencePatternTrainingHistory(params = {}) {
    const query = new URLSearchParams();
    if (params.documentId)
        query.set('documentId', params.documentId);
    if (params.sentence)
        query.set('sentence', params.sentence);
    if (typeof params.limit === 'number')
        query.set('limit', String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : '';
    const res = await apiFetch(`/api/ai/sentence-pattern-training-history${suffix}`);
    if (!res.ok)
        throw new Error(`Fetch training history failed: ${res.status}`);
    return res.json();
}
async function fetchExercises(documentId) {
    const res = await apiFetch(`/api/exercises/document/${documentId}`, { cache: 'no-store' });
    if (!res.ok)
        throw new Error(`Failed to fetch exercises: ${res.status}`);
    return res.json();
}
async function fetchDocument(id) {
    const res = await apiFetch(`/api/documents/${id}`, { cache: 'no-store' });
    if (!res.ok)
        throw new Error(`Failed to fetch document: ${res.status}`);
    return res.json();
}
async function uploadDocument(file, title) {
    const form = new FormData();
    form.append('file', file);
    if (title)
        form.append('title', title);
    const res = await apiFetch('/api/documents/upload', {
        method: 'POST',
        body: form,
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Upload failed: ${res.status} ${text}`);
    }
    return res.json();
}
async function uploadImages(files, title) {
    const form = new FormData();
    files.forEach((file) => form.append('files', file));
    if (title)
        form.append('title', title);
    const res = await apiFetch('/api/documents/upload-images', {
        method: 'POST',
        body: form,
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Images upload failed: ${res.status} ${text}`);
    }
    return res.json();
}
async function createManualDocument(title, content) {
    const res = await apiFetch('/api/documents/manual', {
        method: 'POST',
        body: JSON.stringify({ title, content }),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Create manual document failed: ${res.status} ${text}`);
    }
    return res.json();
}
async function appendText(id, text) {
    const res = await apiFetch(`/api/documents/${id}/append-text`, {
        method: 'POST',
        body: JSON.stringify({ text }),
    });
    if (!res.ok)
        throw new Error(`Failed to append text: ${res.status}`);
    return res.json();
}
async function appendImages(id, files) {
    const form = new FormData();
    files.forEach((file) => form.append('files', file));
    const res = await apiFetch(`/api/documents/${id}/append-images`, {
        method: 'POST',
        body: form,
    });
    if (!res.ok)
        throw new Error(`Failed to append images: ${res.status}`);
    return res.json();
}
async function generateQuestionBank(id, force = false) {
    const res = await apiFetch(`/api/documents/${id}/questions/generate`, {
        method: 'POST',
        body: JSON.stringify({ force }),
    });
    if (!res.ok) {
        let errorMessage = `Failed to generate question bank: ${res.status}`;
        try {
            const errorData = await res.json();
            errorMessage = errorData.message || errorMessage;
        }
        catch {
        }
        throw new Error(errorMessage);
    }
    return res.json();
}
async function fetchQuestionBank(id, limit = 20) {
    const res = await apiFetch(`/api/documents/${id}/questions?limit=${limit}`);
    if (!res.ok)
        throw new Error(`Failed to fetch questions: ${res.status}`);
    return res.json();
}
async function translateMissingSentences(id) {
    const res = await apiFetch(`/api/documents/${id}/translate/missing`, {
        method: 'POST',
    });
    if (!res.ok)
        throw new Error(`Failed to translate: ${res.status}`);
    return res.json();
}
async function translateAlignRebuild(id) {
    const res = await apiFetch(`/api/documents/${id}/translate/align-rebuild`, {
        method: 'POST',
    });
    if (!res.ok)
        throw new Error(`Failed to align-rebuild translation: ${res.status}`);
    return res.json();
}
async function fetchDocumentTranslation(id) {
    const res = await apiFetch(`/api/documents/${id}/translation`);
    if (!res.ok)
        throw new Error(`Failed to fetch translation: ${res.status}`);
    return res.json();
}
async function extractWordsFromDocument(id) {
    const res = await apiFetch(`/api/documents/${id}/extract-words`, {
        method: 'POST',
    });
    if (!res.ok)
        throw new Error(`Failed to extract words: ${res.status}`);
    return res.json();
}
async function fetchExtractedWords(id, partOfSpeech) {
    const url = new URL(`/api/documents/${id}/extracted-words`, window.location.origin);
    if (partOfSpeech) {
        url.searchParams.set('partOfSpeech', partOfSpeech);
    }
    const res = await apiFetch(url.pathname + url.search);
    if (!res.ok)
        throw new Error(`Failed to fetch extracted words: ${res.status}`);
    return res.json();
}
async function generateWordQuiz(id, force = false) {
    const res = await apiFetch(`/api/documents/${id}/word-quiz/generate`, {
        method: 'POST',
        body: JSON.stringify({ force }),
    });
    if (!res.ok)
        throw new Error(`Failed to generate word quiz: ${res.status}`);
    return res.json();
}
async function fetchWordQuizQuestions(id, limit = 9999) {
    const res = await apiFetch(`/api/documents/${id}/word-quiz?limit=${limit}`);
    if (!res.ok)
        throw new Error(`Failed to fetch word quiz: ${res.status}`);
    return res.json();
}
async function exportDocumentLemmas(id) {
    const res = await apiFetch(`/api/documents/${id}/export-lemmas`);
    if (!res.ok)
        throw new Error(`Failed to export lemmas: ${res.status}`);
    return res.text();
}
async function backfillDocumentLemmas(id) {
    const res = await apiFetch(`/api/documents/${id}/lemmas/backfill`, {
        method: 'POST',
    });
    if (!res.ok)
        throw new Error(`Failed to backfill lemmas: ${res.status}`);
    return res.json();
}
async function uploadConversation(files, title) {
    const formData = new FormData();
    files.forEach((file) => {
        formData.append('files', file);
    });
    if (title) {
        formData.append('title', title);
    }
    const res = await apiFetch('/api/conversations/upload', {
        method: 'POST',
        body: formData,
    });
    if (!res.ok)
        throw new Error(`Failed to upload conversation: ${res.status}`);
    return res.json();
}
async function fetchConversations() {
    const res = await apiFetch('/api/conversations');
    if (!res.ok)
        throw new Error(`Failed to fetch conversations: ${res.status}`);
    return res.json();
}
async function fetchConversation(id) {
    const res = await apiFetch(`/api/conversations/${id}`);
    if (!res.ok)
        throw new Error(`Failed to fetch conversation: ${res.status}`);
    return res.json();
}
async function deleteConversation(id) {
    const res = await apiFetch(`/api/conversations/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok)
        throw new Error(`Failed to delete conversation: ${res.status}`);
}
async function resetDatabase() {
    const res = await apiFetch('/api/admin/reset', {
        method: 'POST',
    });
    if (!res.ok)
        throw new Error(`Failed to reset database: ${res.status}`);
    return res.json();
}
async function importReviewCards(documentId) {
    const res = await apiFetch(`/api/review/import/${documentId}`, {
        method: 'POST',
    });
    if (!res.ok)
        throw new Error(`Failed to import review cards: ${res.status}`);
    return res.json();
}
async function fetchReviewSummary(documentId) {
    const res = await apiFetch(`/api/review/summary?documentId=${encodeURIComponent(documentId)}`, { cache: 'no-store' });
    if (!res.ok)
        throw new Error(`Failed to fetch review summary: ${res.status}`);
    return res.json();
}
async function fetchDueReviewCards(documentId, limit = 50, partOfSpeech, mode = 'due') {
    const params = new URLSearchParams({ documentId, limit: String(limit), mode });
    if (partOfSpeech && partOfSpeech !== 'all') {
        params.set('partOfSpeech', partOfSpeech);
    }
    const res = await apiFetch(`/api/review/due?${params.toString()}`, { cache: 'no-store' });
    if (!res.ok)
        throw new Error(`Failed to fetch due review cards: ${res.status}`);
    return res.json();
}
async function updateAlignedWordPair(pairId, data) {
    const res = await apiFetch(`/api/documents/word-pair/${encodeURIComponent(pairId)}/update`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (!res.ok)
        throw new Error(`Failed to update word pair: ${res.status}`);
    return res.json();
}
async function gradeReviewCard(cardId, result) {
    const res = await apiFetch(`/api/review/${encodeURIComponent(cardId)}/grade`, {
        method: 'POST',
        body: JSON.stringify({ result }),
    });
    if (!res.ok)
        throw new Error(`Failed to grade review card: ${res.status}`);
    return res.json();
}
//# sourceMappingURL=api.js.map