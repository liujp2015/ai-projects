const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

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

export async function fetchDocuments(): Promise<DocumentItem[]> {
  const res = await fetch(`${API_BASE_URL}/documents`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch documents: ${res.status}`);
  return res.json();
}

export type WordDefinition = {
  word: string;
  phonetic?: string;
  phonetics?: Array<{
    text?: string;
    audio?: string;
  }>;
  translation?: string; // 新增中文翻译
  definitionZh?: string; // 新增中文详细释义
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
  translation?: string; // 新增中文翻译
  definition?: string; // 新增详细释义
  status: string;
  category?: string | null; // 单词分类
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

export async function lookupWord(word: string): Promise<WordDefinition> {
  const res = await fetch(`${API_BASE_URL}/dictionary/${encodeURIComponent(word)}`);
  if (!res.ok) throw new Error(`Failed to lookup word: ${res.status}`);
  return res.json();
}

export async function fetchUserWords(): Promise<UserWord[]> {
  const res = await fetch(`${API_BASE_URL}/user-words`);
  if (!res.ok) throw new Error(`Failed to fetch user words: ${res.status}`);
  return res.json();
}

export async function upsertUserWord(
  word: string, 
  status?: string, 
  sourceSentenceId?: string,
  translation?: string,
  definition?: string
): Promise<UserWord> {
  const res = await fetch(`${API_BASE_URL}/user-words`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word, status, sourceSentenceId, translation, definition }),
  });
  if (!res.ok) throw new Error(`Failed to upsert user word: ${res.status}`);
  return res.json();
}

export async function deleteUserWord(word: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/user-words/${encodeURIComponent(word)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete user word: ${res.status}`);
}

export async function updateUserWordStatus(word: string, status: string): Promise<UserWord> {
  const res = await fetch(`${API_BASE_URL}/user-words/${encodeURIComponent(word)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`Failed to update user word status: ${res.status}`);
  return res.json();
}

export async function updateUserWordCategory(word: string, category: string | null): Promise<UserWord> {
  const res = await fetch(`${API_BASE_URL}/user-words/${encodeURIComponent(word)}/category`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category }),
  });
  if (!res.ok) throw new Error(`Failed to update user word category: ${res.status}`);
  return res.json();
}

export async function fillMissingTranslations(): Promise<{ total: number; processed: number }> {
  const res = await fetch(`${API_BASE_URL}/user-words/fill-translations`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Failed to fill translations: ${res.status}`);
  return res.json();
}

export async function fetchReviewQueue(): Promise<UserWord[]> {
  const res = await fetch(`${API_BASE_URL}/user-words/review/queue`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch review queue: ${res.status}`);
  return res.json();
}

export async function submitReview(word: string, quality: number): Promise<UserWord> {
  const res = await fetch(`${API_BASE_URL}/user-words/review/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word, quality }),
  });
  if (!res.ok) throw new Error(`Failed to submit review: ${res.status}`);
  return res.json();
}

export function getTTSUrl(text: string): string {
  return `${API_BASE_URL}/tts/stream?text=${encodeURIComponent(text)}`;
}

export type AIValidationResult = {
  isCorrect: boolean;
  score: number;
  correction: string;
  nativeSuggestion: string;
  explanation: string;
  wordUsage: string;
};

export async function validateSentence(word: string, scenario: string, sentence: string): Promise<AIValidationResult> {
  const res = await fetch(`${API_BASE_URL}/ai/validate-sentence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word, scenario, sentence }),
  });
  if (!res.ok) throw new Error(`AI validation failed: ${res.status}`);
  return res.json();
}

export type Exercise = {
  sentenceId: string;
  originalContent: string;
  blankedContent?: string;
  targetWord?: string;
  translation?: string;
  type: 'fill' | 'scramble';
  scrambledWords?: string[];
};

export async function fetchExercises(documentId: string): Promise<Exercise[]> {
  const res = await fetch(`${API_BASE_URL}/exercises/document/${documentId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch exercises: ${res.status}`);
  return res.json();
}

export async function fetchDocument(id: string): Promise<DocumentDetail> {
  const res = await fetch(`${API_BASE_URL}/documents/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch document: ${res.status}`);
  return res.json();
}

export async function uploadDocument(file: File, title?: string): Promise<DocumentItem> {
  const form = new FormData();
  form.append('file', file);
  if (title) form.append('title', title);

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

export async function uploadImages(files: File[], title?: string): Promise<DocumentItem> {
  const form = new FormData();
  files.forEach((file) => form.append('files', file));
  if (title) form.append('title', title);

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

export async function createManualDocument(title: string, content: string): Promise<DocumentItem> {
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

export async function appendText(id: string, text: string): Promise<DocumentDetail> {
  const res = await fetch(`${API_BASE_URL}/documents/${id}/append-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`Failed to append text: ${res.status}`);
  return res.json();
}

export async function appendImages(id: string, files: File[]): Promise<DocumentDetail> {
  const form = new FormData();
  files.forEach((file) => form.append('files', file));

  const res = await fetch(`${API_BASE_URL}/documents/${id}/append-images`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error(`Failed to append images: ${res.status}`);
  return res.json();
}

export type DocumentTranslation = {
  documentId: string;
  total: number;
  translated: number;
  translationText: string;
  sentenceData: Array<{ id: string; content: string; translationZh: string | null }>;
};

export type ExerciseQuestion = {
  id: string;
  type: 'SCRAMBLE' | 'CHOICE' | 'SENTENCE_COMPLETION' | 'WORD_MATCHING';
  promptZh: string;
  answerEn: string;
  scrambledTokens: string[];
  blankedEn?: string;
  options: string[];
  structuredData?: any; // 用于存储 SENTENCE_COMPLETION 和 WORD_MATCHING 的详细结构
};

export async function generateQuestionBank(id: string, force: boolean = false): Promise<{ total: number; generated: number }> {
  const res = await fetch(`${API_BASE_URL}/documents/${id}/questions/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ force }),
  });
  if (!res.ok) throw new Error(`Failed to generate question bank: ${res.status}`);
  return res.json();
}

export async function fetchQuestionBank(id: string, limit: number = 20): Promise<ExerciseQuestion[]> {
  const res = await fetch(`${API_BASE_URL}/documents/${id}/questions?limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to fetch questions: ${res.status}`);
  return res.json();
}

export async function translateMissingSentences(id: string): Promise<{ total: number; translated: number }> {
  const res = await fetch(`${API_BASE_URL}/documents/${id}/translate/missing`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Failed to translate: ${res.status}`);
  return res.json();
}

export async function translateAlignRebuild(id: string): Promise<{ total: number; status: string }> {
  const res = await fetch(`${API_BASE_URL}/documents/${id}/translate/align-rebuild`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Failed to align-rebuild translation: ${res.status}`);
  return res.json();
}

export async function fetchDocumentTranslation(id: string): Promise<DocumentTranslation> {
  const res = await fetch(`${API_BASE_URL}/documents/${id}/translation`);
  if (!res.ok) throw new Error(`Failed to fetch translation: ${res.status}`);
  return res.json();
}

export async function resetDatabase(): Promise<{ message: string; timestamp: string }> {
  const res = await fetch(`${API_BASE_URL}/admin/reset`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Failed to reset database: ${res.status}`);
  return res.json();
}
