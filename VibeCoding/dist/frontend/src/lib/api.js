"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchDocuments = fetchDocuments;
exports.lookupWord = lookupWord;
exports.fetchUserWords = fetchUserWords;
exports.upsertUserWord = upsertUserWord;
exports.deleteUserWord = deleteUserWord;
exports.updateUserWordStatus = updateUserWordStatus;
exports.fillMissingTranslations = fillMissingTranslations;
exports.fetchReviewQueue = fetchReviewQueue;
exports.submitReview = submitReview;
exports.getTTSUrl = getTTSUrl;
exports.validateSentence = validateSentence;
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
exports.resetDatabase = resetDatabase;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';
async function fetchDocuments() {
    const res = await fetch(`${API_BASE_URL}/documents`, { cache: 'no-store' });
    if (!res.ok)
        throw new Error(`Failed to fetch documents: ${res.status}`);
    return res.json();
}
async function lookupWord(word) {
    const res = await fetch(`${API_BASE_URL}/dictionary/${encodeURIComponent(word)}`);
    if (!res.ok)
        throw new Error(`Failed to lookup word: ${res.status}`);
    return res.json();
}
async function fetchUserWords() {
    const res = await fetch(`${API_BASE_URL}/user-words`);
    if (!res.ok)
        throw new Error(`Failed to fetch user words: ${res.status}`);
    return res.json();
}
async function upsertUserWord(word, status, sourceSentenceId, translation, definition) {
    const res = await fetch(`${API_BASE_URL}/user-words`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, status, sourceSentenceId, translation, definition }),
    });
    if (!res.ok)
        throw new Error(`Failed to upsert user word: ${res.status}`);
    return res.json();
}
async function deleteUserWord(word) {
    const res = await fetch(`${API_BASE_URL}/user-words/${encodeURIComponent(word)}`, {
        method: 'DELETE',
    });
    if (!res.ok)
        throw new Error(`Failed to delete user word: ${res.status}`);
}
async function updateUserWordStatus(word, status) {
    const res = await fetch(`${API_BASE_URL}/user-words/${encodeURIComponent(word)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
    });
    if (!res.ok)
        throw new Error(`Failed to update user word status: ${res.status}`);
    return res.json();
}
async function fillMissingTranslations() {
    const res = await fetch(`${API_BASE_URL}/user-words/fill-translations`, {
        method: 'POST',
    });
    if (!res.ok)
        throw new Error(`Failed to fill translations: ${res.status}`);
    return res.json();
}
async function fetchReviewQueue() {
    const res = await fetch(`${API_BASE_URL}/user-words/review/queue`, { cache: 'no-store' });
    if (!res.ok)
        throw new Error(`Failed to fetch review queue: ${res.status}`);
    return res.json();
}
async function submitReview(word, quality) {
    const res = await fetch(`${API_BASE_URL}/user-words/review/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, quality }),
    });
    if (!res.ok)
        throw new Error(`Failed to submit review: ${res.status}`);
    return res.json();
}
function getTTSUrl(text) {
    return `${API_BASE_URL}/tts/stream?text=${encodeURIComponent(text)}`;
}
async function validateSentence(word, scenario, sentence) {
    const res = await fetch(`${API_BASE_URL}/ai/validate-sentence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, scenario, sentence }),
    });
    if (!res.ok)
        throw new Error(`AI validation failed: ${res.status}`);
    return res.json();
}
async function fetchExercises(documentId) {
    const res = await fetch(`${API_BASE_URL}/exercises/document/${documentId}`, { cache: 'no-store' });
    if (!res.ok)
        throw new Error(`Failed to fetch exercises: ${res.status}`);
    return res.json();
}
async function fetchDocument(id) {
    const res = await fetch(`${API_BASE_URL}/documents/${id}`, { cache: 'no-store' });
    if (!res.ok)
        throw new Error(`Failed to fetch document: ${res.status}`);
    return res.json();
}
async function uploadDocument(file, title) {
    const form = new FormData();
    form.append('file', file);
    if (title)
        form.append('title', title);
    const res = await fetch(`${API_BASE_URL}/documents/upload`, {
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
    const res = await fetch(`${API_BASE_URL}/documents/upload-images`, {
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
    const res = await fetch(`${API_BASE_URL}/documents/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Create manual document failed: ${res.status} ${text}`);
    }
    return res.json();
}
async function appendText(id, text) {
    const res = await fetch(`${API_BASE_URL}/documents/${id}/append-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
    });
    if (!res.ok)
        throw new Error(`Failed to append text: ${res.status}`);
    return res.json();
}
async function appendImages(id, files) {
    const form = new FormData();
    files.forEach((file) => form.append('files', file));
    const res = await fetch(`${API_BASE_URL}/documents/${id}/append-images`, {
        method: 'POST',
        body: form,
    });
    if (!res.ok)
        throw new Error(`Failed to append images: ${res.status}`);
    return res.json();
}
async function generateQuestionBank(id, force = false) {
    const res = await fetch(`${API_BASE_URL}/documents/${id}/questions/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force }),
    });
    if (!res.ok)
        throw new Error(`Failed to generate question bank: ${res.status}`);
    return res.json();
}
async function fetchQuestionBank(id, limit = 20) {
    const res = await fetch(`${API_BASE_URL}/documents/${id}/questions?limit=${limit}`);
    if (!res.ok)
        throw new Error(`Failed to fetch questions: ${res.status}`);
    return res.json();
}
async function translateMissingSentences(id) {
    const res = await fetch(`${API_BASE_URL}/documents/${id}/translate/missing`, {
        method: 'POST',
    });
    if (!res.ok)
        throw new Error(`Failed to translate: ${res.status}`);
    return res.json();
}
async function translateAlignRebuild(id) {
    const res = await fetch(`${API_BASE_URL}/documents/${id}/translate/align-rebuild`, {
        method: 'POST',
    });
    if (!res.ok)
        throw new Error(`Failed to align-rebuild translation: ${res.status}`);
    return res.json();
}
async function fetchDocumentTranslation(id) {
    const res = await fetch(`${API_BASE_URL}/documents/${id}/translation`);
    if (!res.ok)
        throw new Error(`Failed to fetch translation: ${res.status}`);
    return res.json();
}
async function resetDatabase() {
    const res = await fetch(`${API_BASE_URL}/admin/reset`, {
        method: 'POST',
    });
    if (!res.ok)
        throw new Error(`Failed to reset database: ${res.status}`);
    return res.json();
}
//# sourceMappingURL=api.js.map