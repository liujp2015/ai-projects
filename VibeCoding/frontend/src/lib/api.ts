const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

// 简化的 fetch 包装函数，通过 Next.js API Route 代理（同源请求，不需要 CORS）
async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const mergedOptions: RequestInit = {
    ...options,
  };
  
  // 处理 headers：FormData 不应该设置 Content-Type（浏览器会自动设置）
  const isFormData = options.body instanceof FormData;
  const hasContentType = options.headers && (
    'Content-Type' in options.headers || 
    'content-type' in options.headers
  );
  
  if (isFormData) {
    // FormData：不设置 Content-Type，让浏览器自动设置（包括 boundary）
    mergedOptions.headers = {
      ...options.headers,
    };
    if (mergedOptions.headers) {
      delete (mergedOptions.headers as any)['Content-Type'];
      delete (mergedOptions.headers as any)['content-type'];
    }
  } else if (!hasContentType) {
    // 非 FormData 且没有 Content-Type：默认设置为 application/json
    mergedOptions.headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
  } else {
    mergedOptions.headers = {
      ...options.headers,
    };
  }
  
  return fetch(url, mergedOptions);
}

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
  const res = await apiFetch('/api/documents', { cache: 'no-store' });
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
  createdAt?: string;
  updatedAt?: string;
};

export async function lookupWord(word: string): Promise<WordDefinition> {
  const res = await apiFetch(`/api/dictionary/${encodeURIComponent(word)}`);
  if (!res.ok) throw new Error(`Failed to lookup word: ${res.status}`);
  return res.json();
}

export async function fetchUserWords(): Promise<UserWord[]> {
  const res = await apiFetch('/api/user-words');
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
  const res = await apiFetch('/api/user-words', {
    method: 'POST',
    body: JSON.stringify({ word, status, sourceSentenceId, translation, definition }),
  });
  if (!res.ok) throw new Error(`Failed to upsert user word: ${res.status}`);
  return res.json();
}

export async function deleteUserWord(word: string): Promise<void> {
  const res = await apiFetch(`/api/user-words/${encodeURIComponent(word)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete user word: ${res.status}`);
}

export async function updateUserWordStatus(word: string, status: string): Promise<UserWord> {
  const res = await apiFetch(`/api/user-words/${encodeURIComponent(word)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`Failed to update user word status: ${res.status}`);
  return res.json();
}

export async function updateUserWordCategory(word: string, category: string | null): Promise<UserWord> {
  const res = await apiFetch(`/api/user-words/${encodeURIComponent(word)}/category`, {
    method: 'PATCH',
    body: JSON.stringify({ category }),
  });
  if (!res.ok) throw new Error(`Failed to update user word category: ${res.status}`);
  return res.json();
}

export async function fillMissingTranslations(): Promise<{ total: number; processed: number }> {
  const res = await apiFetch('/api/user-words/fill-translations', {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Failed to fill translations: ${res.status}`);
  return res.json();
}

export async function fetchReviewQueue(): Promise<UserWord[]> {
  const res = await apiFetch('/api/user-words/review/queue', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch review queue: ${res.status}`);
  return res.json();
}

export async function submitReview(word: string, quality: number): Promise<UserWord> {
  const res = await apiFetch('/api/user-words/review/submit', {
    method: 'POST',
    body: JSON.stringify({ word, quality }),
  });
  if (!res.ok) throw new Error(`Failed to submit review: ${res.status}`);
  return res.json();
}

export function getTTSUrl(text: string): string {
  // TTS 流式响应，直接使用后端 URL（或通过代理）
  return `/api/tts/stream?text=${encodeURIComponent(text)}`;
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
  const res = await apiFetch('/api/ai/validate-sentence', {
    method: 'POST',
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
  const res = await apiFetch(`/api/exercises/document/${documentId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch exercises: ${res.status}`);
  return res.json();
}

export async function fetchDocument(id: string): Promise<DocumentDetail> {
  const res = await apiFetch(`/api/documents/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch document: ${res.status}`);
  return res.json();
}

export async function uploadDocument(file: File, title?: string): Promise<DocumentItem> {
  const form = new FormData();
  form.append('file', file);
  if (title) form.append('title', title);

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

export async function uploadImages(files: File[], title?: string): Promise<DocumentItem> {
  const form = new FormData();
  files.forEach((file) => form.append('files', file));
  if (title) form.append('title', title);

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

export async function createManualDocument(title: string, content: string): Promise<DocumentItem> {
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

export async function appendText(id: string, text: string): Promise<DocumentDetail> {
  const res = await apiFetch(`/api/documents/${id}/append-text`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`Failed to append text: ${res.status}`);
  return res.json();
}

export async function appendImages(id: string, files: File[]): Promise<DocumentDetail> {
  const form = new FormData();
  files.forEach((file) => form.append('files', file));

  const res = await apiFetch(`/api/documents/${id}/append-images`, {
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
  const res = await apiFetch(`/api/documents/${id}/questions/generate`, {
    method: 'POST',
    body: JSON.stringify({ force }),
  });
  if (!res.ok) throw new Error(`Failed to generate question bank: ${res.status}`);
  return res.json();
}

export async function fetchQuestionBank(id: string, limit: number = 20): Promise<ExerciseQuestion[]> {
  const res = await apiFetch(`/api/documents/${id}/questions?limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to fetch questions: ${res.status}`);
  return res.json();
}

export async function translateMissingSentences(id: string): Promise<{ total: number; translated: number }> {
  const res = await apiFetch(`/api/documents/${id}/translate/missing`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Failed to translate: ${res.status}`);
  return res.json();
}

export async function translateAlignRebuild(id: string): Promise<{ total: number; status: string }> {
  const res = await apiFetch(`/api/documents/${id}/translate/align-rebuild`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Failed to align-rebuild translation: ${res.status}`);
  return res.json();
}

export async function fetchDocumentTranslation(id: string): Promise<DocumentTranslation> {
  const res = await apiFetch(`/api/documents/${id}/translation`);
  if (!res.ok) throw new Error(`Failed to fetch translation: ${res.status}`);
  return res.json();
}

export type ExtractedWord = {
  id: string;
  word: string;
  partOfSpeech: string;
  translation: string | null;
  sentence: string;
  documentId: string;
  createdAt: string;
  updatedAt: string;
};

export async function extractWordsFromDocument(id: string): Promise<{ extracted: number; message: string }> {
  const res = await apiFetch(`/api/documents/${id}/extract-words`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Failed to extract words: ${res.status}`);
  return res.json();
}

export async function fetchExtractedWords(id: string, partOfSpeech?: string): Promise<ExtractedWord[]> {
  const url = new URL(`/api/documents/${id}/extracted-words`, window.location.origin);
  if (partOfSpeech) {
    url.searchParams.set('partOfSpeech', partOfSpeech);
  }
  const res = await apiFetch(url.pathname + url.search);
  if (!res.ok) throw new Error(`Failed to fetch extracted words: ${res.status}`);
  return res.json();
}

// 句子单词测试题（独立于现有 ExerciseQuestion）
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

export async function generateWordQuiz(id: string, force: boolean = false): Promise<{ total: number; generated: number }> {
  const res = await apiFetch(`/api/documents/${id}/word-quiz/generate`, {
    method: 'POST',
    body: JSON.stringify({ force }),
  });
  if (!res.ok) throw new Error(`Failed to generate word quiz: ${res.status}`);
  return res.json();
}

export async function fetchWordQuizQuestions(id: string, limit: number = 9999): Promise<WordQuizQuestion[]> {
  const res = await apiFetch(`/api/documents/${id}/word-quiz?limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to fetch word quiz: ${res.status}`);
  return res.json();
}

// 对话相关类型和 API
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

export async function uploadConversation(files: File[], title?: string): Promise<Conversation> {
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
  if (!res.ok) throw new Error(`Failed to upload conversation: ${res.status}`);
  return res.json();
}

export async function fetchConversations(): Promise<Conversation[]> {
  const res = await apiFetch('/api/conversations');
  if (!res.ok) throw new Error(`Failed to fetch conversations: ${res.status}`);
  return res.json();
}

export async function fetchConversation(id: string): Promise<Conversation> {
  const res = await apiFetch(`/api/conversations/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch conversation: ${res.status}`);
  return res.json();
}

export async function deleteConversation(id: string): Promise<void> {
  const res = await apiFetch(`/api/conversations/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete conversation: ${res.status}`);
}

export async function resetDatabase(): Promise<{ message: string; timestamp: string }> {
  const res = await apiFetch('/api/admin/reset', {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Failed to reset database: ${res.status}`);
  return res.json();
}
