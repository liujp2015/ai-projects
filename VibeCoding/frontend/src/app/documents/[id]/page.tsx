'use client';

import { useMemo, useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { fetchDocument, fetchDocumentTranslation, fetchQuestionBank, generateQuestionBank, DocumentDetail, DocumentTranslation, ExerciseQuestion, lookupWord, WordDefinition, translateMissingSentences, translateAlignRebuild, upsertUserWord, deleteUserWord, fetchUserWords, UserWord, getTTSUrl, validateSentence, AIValidationResult, appendText, appendImages, extractWordsFromDocument, fetchExtractedWords, ExtractedWord, generateWordQuiz, fetchWordQuizQuestions, WordQuizQuestion, importReviewCards, fetchReviewSummary, exportDocumentLemmas, backfillDocumentLemmas } from '@/lib/api';
import Link from 'next/link';

const isWordToken = (token: string) => /^[a-zA-Z0-9'-]+$/.test(token);

const normalizeForCompare = (s: string) =>
  s
    .replace(/[“”"'.,!?;:()\[\]{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const shuffle = <T,>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};


// 简单的分词逻辑：将句子拆分为单词和非单词（标点/空格）
const tokenize = (text: string) => {
  return text.split(/([a-zA-Z0-9'-]+)/g).filter(Boolean);
};

const SCENARIOS = [
  { id: 'daily', label: '日常对话', icon: '💬' },
  { id: 'interview', label: '工作面试', icon: '💼' },
  { id: 'travel', label: '旅游出行', icon: '✈️' },
  { id: 'business', label: '商务会议', icon: '🤝' },
  { id: 'academic', label: '学术写作', icon: '🎓' },
];

export default function DocumentDetailPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const highlightSentenceId = useMemo(() => searchParams.get('sentenceId'), [searchParams]);

  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [userWords, setUserWords] = useState<Record<string, UserWord>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 词卡状态
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [definition, setDefinition] = useState<WordDefinition | null>(null);
  const [defLoading, setDefLoading] = useState(false);
  const [currentSentenceId, setCurrentSentenceId] = useState<string | null>(null);

  // 造句练习状态
  const [activeTab, setActiveTab] = useState<'definition' | 'practice'>('definition');
  const [scenario, setScenario] = useState(SCENARIOS[0].label);
  const [userSentence, setUserSentence] = useState('');
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<AIValidationResult | null>(null);

  // 译文/测试 Tab
  const [viewTab, setViewTab] = useState<'read' | 'translation'>('read');
  const [translationMode, setTranslationMode] = useState<'zhEn'>('zhEn');
  const [docTranslation, setDocTranslation] = useState<DocumentTranslation | null>(null);
  const [translationLoading, setTranslationLoading] = useState(false);
  const [translatingMissing, setTranslatingMissing] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  // 追加内容状态
  const [showAppendPanel, setShowAppendPanel] = useState(false);
  const [appendTextContent, setAppendTextContent] = useState('');
  const [appending, setAppending] = useState(false);

  // 全文测试状态
  const [showTest, setShowTest] = useState(false);
  const [testQuestions, setTestQuestions] = useState<ExerciseQuestion[]>([]);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [testUserAnswer, setTestUserAnswer] = useState<string[]>([]); // 已弃用，改用 testScrambleIndices
  // 用于存储 SCRAMBLE 已选中的原始 token 索引，解决重复单词问题
  const [testScrambleIndices, setTestScrambleIndices] = useState<number[]>([]);
  const [testChoiceSelection, setTestChoiceSelection] = useState<string | null>(null); // For choice
  // 新增：用于存储选词填空的多位答案
  const [testCompletionAnswers, setTestCompletionAnswers] = useState<Record<number, string>>({});
  // 新增：控制当前打开的填空下拉菜单
  const [activeBlankIndex, setActiveBlankIndex] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<{ isCorrect: boolean; message: string } | null>(null);

  // 句子单词测试状态（独立于 showTest）
  const [showWordQuiz, setShowWordQuiz] = useState(false);
  const [wordQuizQuestions, setWordQuizQuestions] = useState<WordQuizQuestion[]>([]);
  const [wordQuizIndex, setWordQuizIndex] = useState(0);
  const [wordQuizSelection, setWordQuizSelection] = useState<string | null>(null);
  const [wordQuizResult, setWordQuizResult] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [generatingWordQuiz, setGeneratingWordQuiz] = useState(false);
  const [loadingWordQuiz, setLoadingWordQuiz] = useState(false);

  // 词性提取状态
  const [extractedWords, setExtractedWords] = useState<ExtractedWord[]>([]);
  const [extractingWords, setExtractingWords] = useState(false);
  const [wordsLoading, setWordsLoading] = useState(false);
  const [selectedPartOfSpeech, setSelectedPartOfSpeech] = useState<string>('all'); // 'all', 'noun', 'verb', 'adjective', 'adverb'
  const [backfilling, setBackfilling] = useState(false);

  // Review cards (independent from old UserWord feature)
  const [reviewSummary, setReviewSummary] = useState<{ dueCount: number; learningCount: number; masteredCount: number; totalCount: number } | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [importingReview, setImportingReview] = useState(false);

  // 业务逻辑函数
  const loadTranslation = async () => {
    if (!id) return;
    try {
      setTranslationLoading(true);
      const data = await fetchDocumentTranslation(id as string);
      setDocTranslation(data);
    } catch (err) {
      setTranslationError('无法加载译文');
    } finally {
      setTranslationLoading(false);
    }
  };

  const handleStartTranslate = async () => {
    if (!id || translatingMissing) return;
    try {
      setTranslatingMissing(true);
      await translateAlignRebuild(id as string);

      // Sentences were rebuilt, refresh document + user words to get new sentence IDs
      const [docData, wordsData] = await Promise.all([
        fetchDocument(id as string),
        fetchUserWords(),
      ]);
      setDoc(docData);
      const wordMap: Record<string, UserWord> = {};
      wordsData.forEach((w) => {
        wordMap[w.word.toLowerCase()] = w;
      });
      setUserWords(wordMap);

      await loadTranslation();
    } catch (err) {
      alert('全文对齐翻译失败，请检查后端配置或 DeepSeek API');
    } finally {
      setTranslatingMissing(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!id || generatingQuestions) return;
    
    // Check if we should force regeneration
    const force = confirm('是否要覆盖现有题库并重新生成？\n\n如果发现题目与答案不匹配，请选择“确定”以应用最新的生成逻辑。');
    
    try {
      setGeneratingQuestions(true);
      const res = await generateQuestionBank(id as string, force);
      alert(`题库生成成功！共处理了 ${res.total} 个句子，生成了 ${res.generated} 道题目。`);
    } catch (err) {
      alert('题库生成失败，请检查后端配置或 DeepSeek API 额度');
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleGenerateWordQuiz = async () => {
    if (!id || generatingWordQuiz) return;
    const force = confirm('是否要覆盖现有单词测试题并重新生成？');
    try {
      setGeneratingWordQuiz(true);
      const res = await generateWordQuiz(id as string, force);
      alert(`单词测试题生成完成！共生成 ${res.total} 道题。`);
    } catch (err) {
      alert('单词测试题生成失败：' + (err as Error).message);
    } finally {
      setGeneratingWordQuiz(false);
    }
  };

  const startWordQuiz = async () => {
    if (!id) return;
    try {
      setLoadingWordQuiz(true);
      const qs = await fetchWordQuizQuestions(id as string);
      if (!qs.length) {
        alert('该文档尚未生成单词测试题，请先点击“生成句子单词测试题（DeepSeek）”。');
        return;
      }
      setWordQuizQuestions(qs);
      setWordQuizIndex(0);
      setWordQuizSelection(null);
      setWordQuizResult(null);
      setShowWordQuiz(true);
    } catch (err) {
      alert('无法获取单词测试题，请检查后端连接');
    } finally {
      setLoadingWordQuiz(false);
    }
  };

  const currentWordQuiz = wordQuizQuestions[wordQuizIndex];

  const checkWordQuizAnswer = () => {
    if (!currentWordQuiz) return;
    const sel = wordQuizSelection;
    if (!sel) return;
    const isCorrect = sel.trim().toLowerCase() === String(currentWordQuiz.answer).trim().toLowerCase();
    setWordQuizResult({
      isCorrect,
      message: isCorrect ? '回答正确！' : `正确答案：${currentWordQuiz.answer}`,
    });
  };

  const startTest = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const questions = await fetchQuestionBank(id as string);
      if (questions.length === 0) {
        alert('该文档尚未生成题库，请先点击“生成题库（DeepSeek）”按钮。');
        return;
      }
      setTestQuestions(questions);
      setCurrentTestIndex(0);
      setTestScrambleIndices([]);
      setTestChoiceSelection(null);
      setTestResult(null);
      setShowTest(true);
    } catch (err) {
      alert('无法获取题库，请检查后端连接');
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = testQuestions[currentTestIndex];

  const checkTestAnswer = () => {
    if (!currentQuestion) return;

    let isCorrect = false;
    let message = '';

    if (currentQuestion.type === 'SCRAMBLE') {
      // 使用索引重构用户答案字符串
      const userStr = testScrambleIndices
        .map(idx => currentQuestion.scrambledTokens[idx])
        .join(' ');
      isCorrect = normalizeForCompare(userStr) === normalizeForCompare(currentQuestion.answerEn);
      message = isCorrect ? '拼写完全正确！' : `标准答案：${currentQuestion.answerEn}`;
    } else if (currentQuestion.type === 'CHOICE' || currentQuestion.type === 'WORD_MATCHING') {
      isCorrect = testChoiceSelection?.toLowerCase() === currentQuestion.answerEn.toLowerCase();
      message = isCorrect ? '选对了！' : `应该是 "${currentQuestion.answerEn}"。`;
    } else if (currentQuestion.type === 'SENTENCE_COMPLETION') {
      const sc = currentQuestion.structuredData;
      if (!sc || !sc.blanks) return;
      
      const allCorrect = sc.blanks.every((blank: any) => {
        const userAns = testCompletionAnswers[blank.blank_index];
        return userAns && userAns.toLowerCase() === blank.correct_answer.toLowerCase();
      });

      isCorrect = allCorrect;
      if (isCorrect) {
        message = '太棒了！所有填空都正确。';
      } else {
        const correctAnswers = sc.blanks.map((b: any) => `[${b.blank_index}] ${b.correct_answer}`).join(', ');
        message = `部分填空有误。参考答案：${correctAnswers}`;
      }
    }

    setTestResult({ isCorrect, message });
  };

  useEffect(() => {
    if (viewTab === 'translation') {
      loadTranslation();
      loadExtractedWords();
      loadReviewSummary();
    }
  }, [viewTab, id]);

  const loadExtractedWords = async () => {
    if (!id) return;
    try {
      setWordsLoading(true);
      const words = await fetchExtractedWords(id as string, selectedPartOfSpeech === 'all' ? undefined : selectedPartOfSpeech);
      setExtractedWords(words);
    } catch (err) {
      console.error('Failed to load extracted words', err);
    } finally {
      setWordsLoading(false);
    }
  };

  const loadReviewSummary = async () => {
    if (!id) return;
    try {
      setReviewLoading(true);
      const summary = await fetchReviewSummary(id as string);
      setReviewSummary(summary);
    } catch (err) {
      console.warn('Failed to load review summary', err);
      setReviewSummary(null);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleImportReviewCards = async () => {
    if (!id || importingReview) return;
    try {
      setImportingReview(true);
      const res = await importReviewCards(id as string);
      await loadReviewSummary();
      alert(
        `导入完成：\n总数 ${res.total}\n新增 ${res.inserted}\n更新 ${res.updated}\n跳过 ${res.skipped}` +
          (res.message ? `\n\n提示：${res.message}` : ''),
      );
    } catch (err) {
      alert('导入失败，请检查后端连接：' + (err as Error).message);
    } finally {
      setImportingReview(false);
    }
  };

  const handleExtractWords = async () => {
    if (!id || extractingWords) return;
    try {
      setExtractingWords(true);
      await extractWordsFromDocument(id as string);
      await loadExtractedWords();
      alert('词性提取完成！');
    } catch (err) {
      alert('词性提取失败：' + (err as Error).message);
    } finally {
      setExtractingWords(false);
    }
  };

  useEffect(() => {
    if (viewTab === 'translation') {
      loadExtractedWords();
    }
  }, [selectedPartOfSpeech, viewTab, id]);

  const handleBackfillLemmas = async () => {
    if (!id || backfilling) return;
    try {
      setBackfilling(true);
      const res = await backfillDocumentLemmas(id as string);
      alert(res.message);
      // 刷新数据展示
      const docData = await fetchDocument(id as string);
      setDoc(docData);
      await loadExtractedWords();
    } catch (err) {
      alert('补全原形失败：' + (err as Error).message);
    } finally {
      setBackfilling(false);
    }
  };

  const handleAppendText = async () => {
    if (!id || !appendTextContent.trim() || appending) return;
    try {
      setAppending(true);
      await appendText(id as string, appendTextContent);
      alert('内容追加成功！正在刷新数据...');
      setAppendTextContent('');
      setShowAppendPanel(false);
      // 重新加载页面数据
      window.location.reload();
    } catch (err) {
      alert('追加文本失败：' + err);
    } finally {
      setAppending(false);
    }
  };

  const handleAppendImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!id || !files || files.length === 0 || appending) return;
    
    try {
      setAppending(true);
      const fileList = Array.from(files);
      await appendImages(id as string, fileList);
      alert('图片追加成功！正在进行 OCR 识别与去重合并，请耐心等待数据刷新...');
      setShowAppendPanel(false);
      window.location.reload();
    } catch (err) {
      alert('追加图片失败：' + err);
    } finally {
      setAppending(false);
    }
  };

  // 播放状态
  const [playingText, setPlayingText] = useState<string | null>(null);

  // 阅读视图优先展示 Document.originalText（千问合并后的原文），避免段落/句子结构未重建导致显示旧内容
  // 注意：Hook 必须在所有 render 中都执行，不能放在 loading/error 的 early return 之后
  const readParagraphs = useMemo(() => {
    const text = String(doc?.originalText ?? '').trim();
    if (!text) return null as null | Array<{ id: string; sentences: Array<{ id: string; content: string }> }>;

    const paragraphTexts = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    return paragraphTexts.map((pText, pIdx) => {
      const sentenceTexts =
        pText.match(/[^.!?]+[.!?]+|\s*[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean) ?? [pText];

      return {
        id: `local-p-${pIdx}`,
        sentences: sentenceTexts.map((s, sIdx) => ({
          id: `local-s-${pIdx}-${sIdx}`,
          content: s,
        })),
      };
    });
  }, [doc?.originalText]);

  // 新增：处理鼠标选词组逻辑
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection) return;
    
    const selectedText = selection.toString().trim();
    // 只有包含空格且长度适中的才认为是词组
    if (selectedText && selectedText.includes(' ') && selectedText.length < 100) {
      // 清洗词组：移除首尾标点
      const cleanPhrase = selectedText.replace(/^[^a-zA-Z0-9']+|[^a-zA-Z0-9']+$/g, '');
      
      if (cleanPhrase.length > 1) {
        setSelectedWord(cleanPhrase);
        setDefLoading(true);
        setDefinition(null);
        setValidationResult(null);
        setUserSentence('');
        
        lookupWord(cleanPhrase.toLowerCase()).then(def => {
          setDefinition(def);
        }).catch(err => {
          console.error('Phrase lookup failed', err);
        }).finally(() => {
          setDefLoading(false);
        });

        // 选中后清除系统默认的蓝色选区高亮
        selection.removeAllRanges();
      }
    }
  };

  const playAudio = (text: string) => {
    if (playingText === text) return;
    
    setPlayingText(text);
    const audio = new Audio(getTTSUrl(text));
    audio.onended = () => setPlayingText(null);
    audio.onerror = () => {
      alert('音频播放失败');
      setPlayingText(null);
    };
    audio.play();
  };

  useEffect(() => {
    if (!id) return;

    const initData = async () => {
      try {
        setLoading(true);
        const [docData, wordsData] = await Promise.all([
          fetchDocument(id as string),
          fetchUserWords(),
        ]);
        setDoc(docData);
        
        // 转为 Map 方便查询高亮
        const wordMap: Record<string, UserWord> = {};
        wordsData.forEach(w => { wordMap[w.word.toLowerCase()] = w; });
        setUserWords(wordMap);
      } catch (err) {
        setError('Failed to load document details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [id]);

  // 处理从复习页面跳转过来的定位逻辑
  useEffect(() => {
    if (highlightSentenceId && !loading && doc) {
      // 给一点延迟确保 DOM 渲染完成
      const timer = setTimeout(() => {
        const element = document.getElementById(`sent-${highlightSentenceId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [highlightSentenceId, loading, doc]);

  const handleWordClick = async (word: string, sentenceId: string) => {
    const cleanWord = word.replace(/[^a-zA-Z0-9'-]/g, '').toLowerCase();
    if (!cleanWord) return;

    setSelectedWord(word);
    setCurrentSentenceId(sentenceId);
    setDefLoading(true);
    setDefinition(null);
    setValidationResult(null);
    setUserSentence('');

    try {
      const def = await lookupWord(cleanWord);
      setDefinition(def);
    } catch (err) {
      console.error('Lookup failed', err);
    } finally {
      setDefLoading(false);
    }
  };

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWord || !userSentence.trim() || validating) return;

    setValidating(true);
    try {
      const result = await validateSentence(selectedWord, scenario, userSentence);
      setValidationResult(result);
    } catch (err) {
      alert('AI 评估失败，请检查后端连接或 DeepSeek 配置');
    } finally {
      setValidating(false);
    }
  };

  const toggleCollection = async () => {
    if (!selectedWord) return;
    const wordKey = selectedWord.toLowerCase();
    const isCollected = !!userWords[wordKey];

    try {
      if (isCollected) {
        await deleteUserWord(wordKey);
        const newWords = { ...userWords };
        delete newWords[wordKey];
        setUserWords(newWords);
      } else {
        const saved = await upsertUserWord(
          wordKey, 
          'NEW', 
          currentSentenceId || undefined,
          definition?.translation,
          definition?.definitionZh
        );
        setUserWords({ ...userWords, [wordKey]: saved });
      }
    } catch (err) {
      alert('Failed to update word status');
    }
  };

  const getHighlightClass = (word: string) => {
    const wordKey = word.toLowerCase();
    const status = userWords[wordKey]?.status;
    if (status === 'NEW') return 'bg-yellow-200 dark:bg-yellow-900/50 border-b-2 border-yellow-400';
    if (status === 'LEARNING') return 'bg-blue-100 dark:bg-blue-900/30 border-b-2 border-blue-400';
    if (status === 'MASTERED') return 'text-gray-400';
    return '';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-lg animate-pulse">Loading document...</p>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <p className="text-red-600 text-lg">{error || 'Document not found'}</p>
        <Link href="/documents" className="text-blue-600 hover:underline">Back to Library</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      {/* Main Content */}
      <div className="flex-1 overflow-auto border-r border-gray-100">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
            <Link href="/documents" className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </Link>
            <div className="flex flex-col overflow-hidden">
              <h1 className="text-base md:text-lg font-medium text-gray-900 truncate">
                {doc.title}
              </h1>
              <div className="flex gap-4 mt-1">
                <button 
                  onClick={() => setViewTab('read')}
                  className={`text-[10px] md:text-xs font-bold uppercase tracking-wider transition-colors ${viewTab === 'read' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  阅读
                </button>
                <button 
                  onClick={() => setViewTab('translation')}
                  className={`text-[10px] md:text-xs font-bold uppercase tracking-wider transition-colors ${viewTab === 'translation' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  对照
                </button>
              </div>
            </div>
          </div>
          <div className="text-[10px] font-mono text-gray-400 px-2 py-0.5 bg-gray-50 rounded-full flex-shrink-0">
            {doc.mimeType.split('/')[1].toUpperCase()}
          </div>
        </header>

        <main 
          className="max-w-3xl mx-auto px-8 py-12"
          onMouseUp={handleTextSelection}
        >
          {viewTab === 'read' ? (
          <div className="space-y-10">
            {(readParagraphs ?? doc.paragraphs).map((para: any) => (
              <div key={para.id} className="paragraph-container">
                <div className="text-[1.15rem] leading-[1.8] text-gray-800 tracking-wide">
                  {para.sentences.map((sent: any) => (
                    <span 
                      key={sent.id} 
                      id={`sent-${sent.id}`}
                      className={`group sentence-block inline mr-1 transition-all duration-1000 p-1 rounded ${
                        highlightSentenceId === sent.id 
                          ? 'bg-blue-100 ring-2 ring-blue-400 ring-opacity-50 shadow-sm scale-[1.02]' 
                          : ''
                      }`}
                    >
                      {tokenize(sent.content).map((token, idx) => {
                          const isWord = isWordToken(token);
                        return isWord ? (
                          <span
                            key={`${sent.id}-${idx}`}
                            onClick={() => handleWordClick(token, readParagraphs ? '' : sent.id)}
                            className={`cursor-pointer px-0.5 rounded transition-all hover:bg-blue-100 dark:hover:bg-blue-900/40 ${getHighlightClass(token)}`}
                          >
                            {token}
                          </span>
                        ) : (
                          <span key={`${sent.id}-${idx}`}>{token}</span>
                        );
                      })}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playAudio(sent.content);
                        }}
                        className={`ml-1 p-1 rounded-full hover:bg-blue-200 transition-all opacity-0 group-hover:opacity-100 ${playingText === sent.content ? 'opacity-100 bg-blue-100 text-blue-600 animate-pulse' : 'text-gray-400'}`}
                        title="朗读句子"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {/* 追加内容控制区域 */}
            <div className="pt-10 border-t border-gray-100">
              {!showAppendPanel ? (
                <button
                  onClick={() => setShowAppendPanel(true)}
                  className="w-full py-4 border-2 border-dashed border-gray-200 rounded-3xl text-gray-400 font-medium hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/30 transition-all flex items-center justify-center gap-2 group"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform"><path d="M12 5v14M5 12h14"/></svg>
                  追加新内容 (图片或文本)
                </button>
              ) : (
                <div className="bg-gray-50 rounded-3xl p-6 border border-gray-200 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-900">追加学习内容</h3>
                    <button 
                      onClick={() => setShowAppendPanel(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* 图片追加 */}
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">上传新截图</label>
                      <div className="relative group">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleAppendImages}
                          disabled={appending}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                        />
                        <div className="py-8 border-2 border-dashed border-gray-300 rounded-2xl bg-white text-center group-hover:border-blue-400 transition-colors">
                          <p className="text-sm text-gray-500">
                            {appending ? '处理中，请稍候...' : '点击或拖拽新图片到此处追加'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 py-2">
                      <div className="flex-1 h-px bg-gray-200"></div>
                      <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">或者</span>
                      <div className="flex-1 h-px bg-gray-200"></div>
                    </div>

                    {/* 文本追加 */}
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">手动输入文本</label>
                      <textarea
                        rows={4}
                        value={appendTextContent}
                        onChange={(e) => setAppendTextContent(e.target.value)}
                        placeholder="在此粘贴新的英文内容..."
                        className="w-full p-4 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={handleAppendText}
                          disabled={appending || !appendTextContent.trim()}
                          className="px-8 py-2 bg-blue-600 text-white rounded-full text-sm font-bold shadow-md hover:bg-blue-700 transition-all disabled:opacity-50"
                        >
                          {appending ? '正在合并内容...' : '确认追加文本'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          ) : (
            <div className="space-y-8">
              {(!showTest && !showWordQuiz) ? (
                <>
                  <div className="flex flex-col gap-4 bg-blue-50 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-blue-100">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h2 className="text-blue-800 font-bold">学习内容对照</h2>
                        <p className="text-xs md:text-sm text-blue-600 mt-1">
                          基于图片识别的结构化对照数据
                        </p>
                      </div>
                      <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 md:gap-3">
                        <button
                          onClick={handleGenerateQuestions}
                          disabled={generatingQuestions}
                          className="px-3 md:px-6 py-2 bg-indigo-600 text-white rounded-full text-xs md:text-sm font-bold shadow-md hover:bg-indigo-700 transition-all disabled:opacity-50"
                        >
                          {generatingQuestions ? '...' : '生成题库'}
                        </button>
                        <button
                          onClick={handleGenerateWordQuiz}
                          disabled={generatingWordQuiz}
                          className="px-3 md:px-6 py-2 bg-purple-600 text-white rounded-full text-xs md:text-sm font-bold shadow-md hover:bg-purple-700 transition-all disabled:opacity-50"
                        >
                          {generatingWordQuiz ? '...' : '生成单词题'}
                        </button>
                        <button
                          onClick={startTest}
                          className="px-3 md:px-6 py-2 bg-black text-white rounded-full text-xs md:text-sm font-bold shadow-md hover:scale-105 transition-all"
                        >
                          综合测试
                        </button>
                        <button
                          onClick={async () => {
                            if (!id) return;
                            try {
                              const txt = await exportDocumentLemmas(id as string);
                              const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${doc.title || 'lemmas'}.txt`;
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                              URL.revokeObjectURL(url);
                            } catch (e: any) {
                              alert('导出失败：' + (e?.message || e));
                            }
                          }}
                          className="px-3 md:px-6 py-2 bg-emerald-600 text-white rounded-full text-xs md:text-sm font-bold shadow-md hover:bg-emerald-700 transition-all"
                        >
                          导出原形
                        </button>
                        <button
                          onClick={handleBackfillLemmas}
                          disabled={backfilling}
                          className="px-3 md:px-6 py-2 bg-orange-500 text-white rounded-full text-xs md:text-sm font-bold shadow-md hover:bg-orange-600 transition-all disabled:opacity-50"
                        >
                          {backfilling ? '同步中...' : '同步旧原形'}
                        </button>
                        <button
                          onClick={startWordQuiz}
                          disabled={loadingWordQuiz}
                          className="px-3 md:px-6 py-2 bg-gray-900 text-white rounded-full text-xs md:text-sm font-bold shadow-md hover:bg-gray-800 transition-all disabled:opacity-50"
                        >
                          {loadingWordQuiz ? '...' : '单词测试'}
                        </button>
                      </div>
                    </div>

                    {/* 新增：复习单词功能区域 */}
                    <div className="pt-4 border-t border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">复习进度</span>
                          {reviewLoading ? (
                            <div className="h-5 w-24 bg-blue-100 animate-pulse rounded mt-1"></div>
                          ) : reviewSummary ? (
                            <div className="flex items-center gap-3 mt-1">
                              <div className="flex items-center gap-1" title="今日待复习">
                                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                <span className="text-sm font-bold text-gray-700">{reviewSummary.dueCount}</span>
                              </div>
                              <div className="flex items-center gap-1" title="正在学习中">
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                <span className="text-sm font-bold text-gray-700">{reviewSummary.learningCount}</span>
                              </div>
                              <div className="flex items-center gap-1" title="已掌握">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                <span className="text-sm font-bold text-gray-700">{reviewSummary.masteredCount}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-blue-400 mt-1 italic">未导入复习卡片</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={handleImportReviewCards}
                          disabled={importingReview}
                          className="flex-1 sm:flex-none px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          {importingReview ? '导入中...' : '导入到复习'}
                        </button>
                        {reviewSummary && reviewSummary.totalCount > 0 && (
                          <Link
                            href={`/documents/${id}/review-cards`}
                            className="flex-1 sm:flex-none px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                            开始刷词 ({reviewSummary.dueCount})
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  {translationLoading ? (
                    <div className="py-20 text-center text-gray-400 animate-pulse">加载对照中...</div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* 左侧：中英对照 */}
                      <div className="lg:col-span-2 space-y-6">
                        {/* 句子对照部分 */}
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                          <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                              核心句子对照
                            </h3>
                          </div>
                          <div className="grid grid-cols-2 gap-0 border-b border-gray-100 bg-gray-50/50">
                            <div className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">中文句子</div>
                            <div className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">English Sentence</div>
                          </div>
                          <div className="divide-y divide-gray-100">
                            {(() => {
                              const zhLines = (doc.chineseText || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
                              const enLines = (doc.englishText || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
                              
                              // 启发式区分句子和单词：包含空格且长度大于 15 的通常是句子
                              const sentences = zhLines.map((zh, i) => ({ zh, en: enLines[i] }))
                                .filter(item => item.en && (item.en.includes(' ') && item.en.length > 15));

                              if (sentences.length === 0) return <div className="p-8 text-center text-gray-400 text-sm italic">未检测到完整句子对照</div>;

                              return sentences.map((item, idx) => (
                                <div key={idx} className="grid grid-cols-2 gap-0 hover:bg-gray-50 transition-colors">
                                  <div className="p-4 text-sm text-gray-800 leading-relaxed border-r border-gray-100 whitespace-pre-wrap">{item.zh}</div>
                                  <div className="p-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap font-medium">{item.en}</div>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>

                        {/* 单词对照部分 */}
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                          <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              词汇对照表
                            </h3>
                          </div>
                          <div className="grid grid-cols-3 gap-0 border-b border-gray-100 bg-gray-50/50">
                            <div className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">中文单词</div>
                            <div className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">English Word</div>
                            <div className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lemma</div>
                          </div>
                          <div className="divide-y divide-gray-100">
                            {(() => {
                              const aligned = (doc as any).alignedWordPairs as Array<{ zh: string; en: string; lemma?: string | null }> | undefined;

                              if (aligned && aligned.length > 0) {
                                return aligned.map((item, idx) => (
                                  <div key={idx} className="grid grid-cols-3 gap-0 hover:bg-gray-50 transition-colors">
                                    <div className="p-4 text-sm text-gray-800 border-r border-gray-100">{item.zh}</div>
                                    <div className="p-4 text-sm text-gray-900 font-bold border-r border-gray-100">{item.en}</div>
                                    <div className="p-4 text-sm text-gray-700 font-mono">{item.lemma || '-'}</div>
                                  </div>
                                ));
                              }

                              // 兼容旧数据：回退到按行解析（无 lemma）
                              const zhLines = (doc.chineseText || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
                              const enLines = (doc.englishText || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
                              const words = zhLines.map((zh, i) => ({ zh, en: enLines[i] }))
                                .filter(item => item.en && !(item.en.includes(' ') && item.en.length > 15));

                              if (words.length === 0) return <div className="p-8 text-center text-gray-400 text-sm italic">未检测到单词对照</div>;

                              return words.map((item, idx) => (
                                <div key={idx} className="grid grid-cols-3 gap-0 hover:bg-gray-50 transition-colors">
                                  <div className="p-4 text-sm text-gray-800 border-r border-gray-100">{item.zh}</div>
                                  <div className="p-4 text-sm text-gray-900 font-bold border-r border-gray-100">{item.en}</div>
                                  <div className="p-4 text-sm text-gray-700 font-mono">-</div>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* 右侧：词性列表 */}
                      <div className="lg:col-span-1">
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden sticky top-24">
                          <div className="p-4 bg-gray-50 border-b border-gray-100">
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                                句子学习
                              </h3>
                              <button
                                onClick={handleExtractWords}
                                disabled={extractingWords}
                                className="px-3 py-1.5 text-xs font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all disabled:opacity-50"
                              >
                                {extractingWords ? '提取中...' : '提取词性'}
                              </button>
                            </div>
                            
                            {/* Tab 切换 */}
                            <div className="flex gap-2 flex-wrap">
                              {[
                                { key: 'all', label: '全部' },
                                { key: 'noun', label: '名词' },
                                { key: 'verb', label: '动词' },
                                { key: 'adjective', label: '形容词' },
                                { key: 'adverb', label: '副词' },
                              ].map((tab) => (
                                <button
                                  key={tab.key}
                                  onClick={() => setSelectedPartOfSpeech(tab.key)}
                                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                                    selectedPartOfSpeech === tab.key
                                      ? 'bg-purple-600 text-white'
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                                >
                                  {tab.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 词性列表 */}
                          <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                            {wordsLoading ? (
                              <div className="p-8 text-center text-gray-400 animate-pulse">加载中...</div>
                            ) : extractedWords.length === 0 ? (
                              <div className="p-8 text-center text-gray-400 text-sm">
                                {extractingWords ? '正在提取词性...' : '点击"提取词性"按钮开始学习'}
                              </div>
                            ) : (
                              <div className="divide-y divide-gray-100">
                                {extractedWords.map((word) => (
                                  <div
                                    key={word.id}
                                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                                    onClick={() => handleWordClick(word.word, '')}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                          <span className="text-sm font-bold text-gray-900">{word.word}</span>
                                          {word.lemma && (
                                            <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-mono">
                                              {word.lemma}
                                            </span>
                                          )}
                                          <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full uppercase">
                                            {word.partOfSpeech}
                                          </span>
                                        </div>
                                        {word.translation && (
                                          <p className="text-xs text-gray-600 mb-2">{word.translation}</p>
                                        )}
                                        <p className="text-xs text-gray-400 italic line-clamp-2">{word.sentence}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : showWordQuiz ? (
                <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-xl">
                  <header className="flex justify-between items-center mb-10">
                    <button
                      onClick={() => setShowWordQuiz(false)}
                      className="text-gray-400 hover:text-gray-600 font-bold text-sm uppercase tracking-widest"
                    >
                      退出单词测试
                    </button>
                    <span className="text-purple-600 font-bold">
                      进度: {wordQuizIndex + 1} / {wordQuizQuestions.length}
                    </span>
                  </header>

                  <div className="space-y-8">
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                        {currentWordQuiz?.type === 'ZH_TO_EN' ? '中文提示（选英文单词）' : '英文提示（选中文意思）'}
                      </h3>
                      <p className="text-2xl font-medium text-gray-900 leading-relaxed">
                        {currentWordQuiz?.prompt}
                      </p>
                      {currentWordQuiz?.sentenceContext && (
                        <p className="mt-4 text-sm text-gray-500 italic bg-gray-50 p-4 rounded-2xl border border-gray-100 whitespace-pre-wrap">
                          {currentWordQuiz.sentenceContext}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {currentWordQuiz?.options?.map((opt: string, i: number) => (
                        <button
                          key={i}
                          disabled={!!wordQuizResult}
                          onClick={() => setWordQuizSelection(opt)}
                          className={`p-6 rounded-2xl border-2 text-left transition-all font-bold text-lg ${
                            wordQuizSelection === opt
                              ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-md scale-[1.02]'
                              : 'border-gray-100 hover:border-purple-200 hover:bg-gray-50/50'
                          }`}
                        >
                          <span className={`inline-block w-10 h-10 rounded-full text-center leading-10 mr-4 text-sm font-black ${
                            wordQuizSelection === opt ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-400'
                          }`}>
                            {String.fromCharCode(65 + i)}
                          </span>
                          {opt}
                        </button>
                      ))}
                    </div>

                    {wordQuizResult && (
                      <div className={`p-6 rounded-2xl ${wordQuizResult.isCorrect ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                        <p className="font-bold mb-1">{wordQuizResult.isCorrect ? '回答正确！' : '回答错误'}</p>
                        <p className="text-sm opacity-80">{wordQuizResult.message}</p>
                      </div>
                    )}

                    <div className="pt-6 border-t border-gray-100 flex gap-4">
                      {!wordQuizResult ? (
                        <button
                          onClick={checkWordQuizAnswer}
                          disabled={!wordQuizSelection}
                          className="flex-1 py-4 bg-purple-600 text-white rounded-2xl font-bold shadow-lg hover:bg-purple-700 disabled:opacity-50 transition-all"
                        >
                          提交判定
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (wordQuizIndex < wordQuizQuestions.length - 1) {
                              setWordQuizIndex(prev => prev + 1);
                              setWordQuizSelection(null);
                              setWordQuizResult(null);
                            } else {
                              alert('单词测试完成！');
                              setShowWordQuiz(false);
                            }
                          }}
                          className="flex-1 py-4 bg-black text-white rounded-2xl font-bold shadow-lg hover:bg-gray-800 transition-all"
                        >
                          {wordQuizIndex < wordQuizQuestions.length - 1 ? '下一题' : '完成测试'}
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setWordQuizSelection(null);
                          setWordQuizResult(null);
                        }}
                        className="px-8 py-4 border border-gray-200 rounded-2xl font-bold text-gray-500 hover:bg-gray-50"
                      >
                        重置
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-xl">
                  <header className="flex justify-between items-center mb-10">
                    <button onClick={() => setShowTest(false)} className="text-gray-400 hover:text-gray-600 font-bold text-sm uppercase tracking-widest">退出测试</button>
                    <span className="text-blue-600 font-bold">进度: {currentTestIndex + 1} / {testQuestions.length}</span>
                  </header>

                  <div className="space-y-10">
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">中文提示</h3>
                      <p className="text-2xl font-medium text-gray-900 leading-relaxed">{currentQuestion?.promptZh}</p>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">你的组合</h3>
                      {currentQuestion.type === 'SCRAMBLE' ? (
                        <div className="min-h-[80px] p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-wrap gap-2 text-xl">
                          {testScrambleIndices.map((tokenIdx, displayIdx) => (
                            <span 
                              key={`${tokenIdx}-${displayIdx}`}
                              onClick={() => setTestScrambleIndices(prev => prev.filter((_, idx) => idx !== displayIdx))}
                              className="bg-white px-3 py-1 rounded-lg shadow-sm cursor-pointer hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                              {currentQuestion.scrambledTokens[tokenIdx]}
                            </span>
                          ))}
                          {testScrambleIndices.length === 0 && <span className="text-gray-300">请点击下方单词...</span>}
                        </div>
                      ) : currentQuestion.type === 'SENTENCE_COMPLETION' ? (
                        <div className="p-8 bg-blue-50/30 rounded-3xl border border-blue-100/50">
                          <div className="text-2xl leading-[2] text-gray-800 flex flex-wrap gap-x-2 gap-y-4">
                            {currentQuestion.blankedEn?.split(/(____)/).map((part, i) => {
                              if (part === '____') {
                                const blankIndex = Math.floor(i / 2) + 1;
                                const currentAnswer = testCompletionAnswers[blankIndex];
                                return (
                                  <div key={i} className="relative inline-block">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveBlankIndex(activeBlankIndex === blankIndex ? null : blankIndex);
                                      }}
                                      className={`min-w-[100px] px-4 py-1 border-b-2 transition-all font-bold ${
                                        currentAnswer 
                                          ? 'border-blue-500 text-blue-600 bg-blue-50/50' 
                                          : 'border-gray-300 text-gray-300 hover:border-blue-400'
                                      }`}
                                    >
                                      {currentAnswer || `(${blankIndex})`}
                                    </button>
                                    {activeBlankIndex === blankIndex && (
                                      <div 
                                        className="absolute top-full left-0 mt-2 z-20 bg-white shadow-2xl rounded-2xl border border-gray-100 p-2 min-w-[160px]"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {currentQuestion.structuredData?.blanks?.find((b: any) => b.blank_index === blankIndex)?.options.map((opt: string) => (
                                          <button
                                            key={opt}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setTestCompletionAnswers(prev => ({ ...prev, [blankIndex]: opt }));
                                              setActiveBlankIndex(null);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 rounded-xl transition-colors whitespace-nowrap text-gray-700"
                                          >
                                            {opt}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                              return <span key={i}>{part}</span>;
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {(currentQuestion.blankedEn || currentQuestion.type === 'WORD_MATCHING') && (
                            <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 text-xl text-gray-700 leading-relaxed">
                              {currentQuestion.type === 'WORD_MATCHING' 
                                ? `“${currentQuestion.promptZh}” 对应的英文单词是？`
                                : currentQuestion.blankedEn}
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {currentQuestion.options.map((option: string, i: number) => (
                              <button
                                key={i}
                                disabled={!!testResult}
                                onClick={() => setTestChoiceSelection(option)}
                                className={`p-6 rounded-2xl border-2 text-left transition-all font-bold text-lg ${
                                  testChoiceSelection === option
                                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md scale-[1.02]'
                                    : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50/50'
                                }`}
                              >
                                <span className={`inline-block w-10 h-10 rounded-full text-center leading-10 mr-4 text-sm font-black ${
                                  testChoiceSelection === option ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'
                                }`}>
                                  {String.fromCharCode(65 + i)}
                                </span>
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {!testResult ? (
                      currentQuestion.type === 'SCRAMBLE' && (
                        <div className="flex flex-wrap gap-2">
                          {currentQuestion.scrambledTokens.map((word: string, tokenIdx: number) => {
                            const isSelected = testScrambleIndices.includes(tokenIdx);
                            return (
                              <button
                                key={tokenIdx}
                                onClick={() => {
                                  if (isSelected) {
                                    // 移除：找到第一个匹配的索引并删除
                                    setTestScrambleIndices(prev => {
                                      const idx = prev.indexOf(tokenIdx);
                                      if (idx === -1) return prev;
                                      return prev.filter((_, i) => i !== idx);
                                    });
                                  } else {
                                    // 添加：追加索引
                                    setTestScrambleIndices(prev => [...prev, tokenIdx]);
                                  }
                                }}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm ${
                                  isSelected
                                    ? 'bg-blue-100 border-2 border-blue-500 text-blue-700'
                                    : 'bg-white border border-gray-200 hover:border-blue-500 hover:text-blue-600'
                                }`}
                              >
                                {word}
                              </button>
                            );
                          })}
                        </div>
                      )
                    ) : (
                      <div className={`p-6 rounded-2xl ${testResult.isCorrect ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                        <p className="font-bold mb-1">{testResult.isCorrect ? '回答正确！' : '回答错误'}</p>
                        <p className="text-sm opacity-80">{testResult.message}</p>
                      </div>
                    )}

                    <div className="pt-6 border-t border-gray-100 flex gap-4">
                      {!testResult ? (
                        <button
                          onClick={checkTestAnswer}
                          disabled={(() => {
                            if (currentQuestion.type === 'SCRAMBLE') return testScrambleIndices.length === 0;
                            if (currentQuestion.type === 'SENTENCE_COMPLETION') {
                              const numBlanks = currentQuestion.blankedEn?.match(/____/g)?.length || 0;
                              return Object.keys(testCompletionAnswers).length < numBlanks;
                            }
                            return !testChoiceSelection;
                          })()}
                          className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg hover:bg-blue-700 disabled:opacity-50 transition-all"
                        >
                          提交判定
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (currentTestIndex < testQuestions.length - 1) {
                              setCurrentTestIndex(prev => prev + 1);
                              setTestScrambleIndices([]);
                              setTestChoiceSelection(null);
                              setTestCompletionAnswers({}); // 重置选词填空状态
                              setTestResult(null);
                            } else {
                              alert('测试完成！');
                              setShowTest(false);
                            }
                          }}
                          className="flex-1 py-4 bg-black text-white rounded-2xl font-bold shadow-lg hover:bg-gray-800 transition-all"
                        >
                          {currentTestIndex < testQuestions.length - 1 ? '下一题' : '完成测试'}
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          setTestScrambleIndices([]);
                          setTestChoiceSelection(null);
                          setTestCompletionAnswers({}); // 重置选词填空状态
                        }} 
                        className="px-8 py-4 border border-gray-200 rounded-2xl font-bold text-gray-500 hover:bg-gray-50"
                      >
                        重置
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Side Panel: Word Card */}
      <aside className={`w-full md:w-[380px] bg-gray-50/50 p-6 transition-all border-t md:border-t-0 ${selectedWord ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none md:translate-y-0'}`}>
        {selectedWord ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-24">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">{selectedWord}</h2>
                {definition?.phonetic && (
                  <p className="text-blue-600 font-mono mt-1">{definition.phonetic}</p>
                )}
                {definition?.translation && (
                  <p className="text-gray-700 mt-2">{definition.translation}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab(activeTab === 'definition' ? 'practice' : 'definition')}
                  className={`p-3 rounded-full transition-colors ${activeTab === 'practice' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}
                  title="造句练习"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </button>
                <button
                  onClick={toggleCollection}
                  className={`p-3 rounded-full transition-colors ${userWords[selectedWord.toLowerCase()] ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                  title={userWords[selectedWord.toLowerCase()] ? 'Remove from Collection' : 'Add to Collection'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={userWords[selectedWord.toLowerCase()] ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                </button>
              </div>
            </div>

            {activeTab === 'definition' ? (
              defLoading ? (
                <div className="space-y-3 py-4">
                  <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-gray-100 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse"></div>
                </div>
              ) : (
                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {definition?.definitionZh && (
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
                      <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                        AI 详细释义
                      </h3>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {definition.definitionZh}
                      </p>
                    </div>
                  )}

                  {definition?.meanings?.length ? (
                    definition.meanings.map((m, idx) => (
                      <div key={idx} className="border-t border-gray-50 pt-4 first:border-0 first:pt-0">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                          {m.partOfSpeech}
                        </span>
                        <ul className="mt-3 space-y-3">
                          {m.definitions.map((d, dIdx) => (
                            <li key={dIdx} className="text-sm text-gray-700 leading-relaxed">
                              <p className="font-medium">• {d.definition}</p>
                              {d.example && (
                                <p className="mt-1.5 text-gray-500 italic border-l-2 border-gray-100 pl-3">"{d.example}"</p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))
                  ) : !definition?.definitionZh && (
                    <p className="py-10 text-center text-gray-400 italic">No definitions found for this word.</p>
                  )}
                </div>
              )
            ) : (
              <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                {!validationResult ? (
                  <form onSubmit={handleValidate} className="space-y-6">
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">选择使用场景</label>
                      <div className="grid grid-cols-3 gap-2">
                        {SCENARIOS.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setScenario(s.label)}
                            className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${scenario === s.label ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-100 bg-white text-gray-500 hover:border-blue-200'}`}
                          >
                            <span className="text-lg">{s.icon}</span>
                            <span className="text-[10px] font-medium">{s.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">你的句子</label>
                      <textarea
                        required
                        rows={4}
                        value={userSentence}
                        onChange={(e) => setUserSentence(e.target.value)}
                        className="w-full p-4 bg-gray-50 border-0 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                        placeholder={`使用 "${selectedWord}" 造一个关于 ${scenario} 的句子...`}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={validating || !userSentence.trim()}
                      className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold text-sm shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {validating ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          AI 评估中...
                        </span>
                      ) : '提交评估'}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-6">
                    {/* Score Circle */}
                    <div className="flex flex-col items-center py-4 bg-gray-50 rounded-3xl border border-gray-100">
                      <div className="relative w-20 h-20 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-200" />
                          <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={226} strokeDashoffset={226 - (226 * validationResult.score) / 100} className={`${validationResult.score >= 80 ? 'text-green-500' : validationResult.score >= 60 ? 'text-blue-500' : 'text-orange-500'} transition-all duration-1000`} strokeLinecap="round" />
                        </svg>
                        <span className="absolute text-xl font-black">{validationResult.score}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-400 mt-2 tracking-widest uppercase">AI 评分</span>
                    </div>

                    {/* Correction */}
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-red-50 border border-red-100">
                        <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">你的原文</h4>
                        <p className="text-sm text-red-700 line-through opacity-60">{userSentence}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-green-50 border border-green-100">
                        <h4 className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-1">AI 修正</h4>
                        <p className="text-sm text-green-700 font-medium">{validationResult.correction}</p>
                      </div>
                    </div>

                    {/* Suggestions */}
                    <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100">
                      <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-3">更地道的表达</h4>
                      <p className="text-sm text-blue-800 font-bold mb-3 italic">"{validationResult.nativeSuggestion}"</p>
                      <div className="space-y-3 pt-3 border-t border-blue-100/50">
                        <div>
                          <p className="text-[10px] font-bold text-blue-300 uppercase tracking-tight mb-1">解析</p>
                          <p className="text-xs text-blue-700 leading-relaxed">{validationResult.explanation}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-blue-300 uppercase tracking-tight mb-1">用法反馈</p>
                          <p className="text-xs text-blue-700 leading-relaxed">{validationResult.wordUsage}</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setValidationResult(null);
                        setUserSentence('');
                      }}
                      className="w-full py-3 text-sm text-gray-500 hover:text-gray-700 font-medium border-t border-gray-100"
                    >
                      重新练习
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <button 
              onClick={() => setSelectedWord(null)}
              className="mt-8 w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 font-medium border-t border-gray-100"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center px-10">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Click on any word in the text to see its definition and add it to your collection.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}



