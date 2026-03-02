'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ReviewCardsPage;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const api_1 = require("@/lib/api");
const link_1 = __importDefault(require("next/link"));
function ReviewCardsPage() {
    const { id } = (0, navigation_1.useParams)();
    const [cards, setCards] = (0, react_1.useState)([]);
    const [currentIndex, setCurrentIndex] = (0, react_1.useState)(0);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [showTranslation, setShowTranslation] = (0, react_1.useState)(false);
    const [grading, setGrading] = (0, react_1.useState)(false);
    const [playingText, setPlayingText] = (0, react_1.useState)(null);
    const [partOfSpeechFilter, setPartOfSpeechFilter] = (0, react_1.useState)('all');
    const [reviewMode, setReviewMode] = (0, react_1.useState)('due');
    const loadCards = (0, react_1.useCallback)(async () => {
        if (!id)
            return;
        try {
            setLoading(true);
            const data = await (0, api_1.fetchDueReviewCards)(id, 50, partOfSpeechFilter, reviewMode);
            setCards(data);
            setCurrentIndex(0);
            setShowTranslation(false);
        }
        catch (err) {
            console.error('Failed to load review cards', err);
        }
        finally {
            setLoading(false);
        }
    }, [id, partOfSpeechFilter, reviewMode]);
    (0, react_1.useEffect)(() => {
        loadCards();
    }, [loadCards]);
    const playAudio = async (text) => {
        if (playingText === text)
            return;
        if (!text || !text.trim())
            return;
        setPlayingText(text);
        try {
            const url = (0, api_1.getTTSUrl)(text);
            const audio = new Audio(url);
            let fallbackUsed = false;
            audio.onerror = async (e) => {
                if (fallbackUsed)
                    return;
                fallbackUsed = true;
                console.warn('Backend TTS failed, trying browser Speech Synthesis API...');
                try {
                    if ('speechSynthesis' in window) {
                        window.speechSynthesis.cancel();
                        const utterance = new SpeechSynthesisUtterance(text);
                        utterance.lang = 'en-US';
                        utterance.onend = () => setPlayingText(null);
                        utterance.onerror = () => setPlayingText(null);
                        window.speechSynthesis.speak(utterance);
                    }
                    else {
                        setPlayingText(null);
                    }
                }
                catch (fallbackErr) {
                    console.error('Fallback TTS also failed:', fallbackErr);
                    setPlayingText(null);
                }
            };
            audio.onended = () => {
                if (!fallbackUsed) {
                    setPlayingText(null);
                }
            };
            const timeout = setTimeout(() => {
                if (audio.readyState === 0 && !fallbackUsed) {
                    fallbackUsed = true;
                    audio.load();
                    console.warn('Backend TTS timeout, trying browser Speech Synthesis API...');
                    try {
                        if ('speechSynthesis' in window) {
                            window.speechSynthesis.cancel();
                            const utterance = new SpeechSynthesisUtterance(text);
                            utterance.lang = 'en-US';
                            utterance.onend = () => setPlayingText(null);
                            utterance.onerror = () => setPlayingText(null);
                            window.speechSynthesis.speak(utterance);
                        }
                        else {
                            setPlayingText(null);
                        }
                    }
                    catch (fallbackErr) {
                        console.error('Fallback TTS also failed:', fallbackErr);
                        setPlayingText(null);
                    }
                }
            }, 5000);
            audio.addEventListener('canplay', () => {
                clearTimeout(timeout);
            }, { once: true });
            await audio.play().catch(async (err) => {
                clearTimeout(timeout);
                if (fallbackUsed)
                    return;
                fallbackUsed = true;
                try {
                    if ('speechSynthesis' in window) {
                        window.speechSynthesis.cancel();
                        const utterance = new SpeechSynthesisUtterance(text);
                        utterance.lang = 'en-US';
                        utterance.onend = () => setPlayingText(null);
                        utterance.onerror = () => setPlayingText(null);
                        window.speechSynthesis.speak(utterance);
                    }
                    else {
                        setPlayingText(null);
                    }
                }
                catch (fallbackErr) {
                    console.error('Fallback TTS also failed:', fallbackErr);
                    setPlayingText(null);
                }
            });
        }
        catch (err) {
            console.error('Failed to create audio:', err);
            try {
                if ('speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.lang = 'en-US';
                    utterance.onend = () => setPlayingText(null);
                    utterance.onerror = () => setPlayingText(null);
                    window.speechSynthesis.speak(utterance);
                }
                else {
                    setPlayingText(null);
                }
            }
            catch (fallbackErr) {
                console.error('Fallback TTS also failed:', fallbackErr);
                setPlayingText(null);
            }
        }
    };
    const handleGrade = async (result) => {
        if (grading || cards.length === 0)
            return;
        const currentCard = cards[currentIndex];
        try {
            setGrading(true);
            await (0, api_1.gradeReviewCard)(currentCard.id, result);
            if (currentIndex < cards.length - 1) {
                setCurrentIndex((prev) => prev + 1);
                setShowTranslation(false);
            }
            else {
                setCards([]);
            }
        }
        catch (err) {
            alert('提交失败，请检查网络');
        }
        finally {
            setGrading(false);
        }
    };
    if (loading) {
        return (<div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-500 font-medium">正在加载复习卡片...</p>
        </div>
      </div>);
    }
    if (cards.length === 0) {
        return (<div className="min-h-screen flex flex-col bg-zinc-50">
        
        <div className="px-4 py-3 bg-white border-b border-zinc-200 flex flex-wrap gap-2 justify-center">
          {[{ key: 'due', label: '仅到期' }, { key: 'all', label: '全部复习' }].map((m) => (<button key={m.key} onClick={() => setReviewMode(m.key)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${reviewMode === m.key
                    ? 'bg-black text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}>
              {m.label}
            </button>))}
        </div>

        
        <div className="px-4 py-3 bg-white border-b border-zinc-200 flex flex-wrap gap-2 justify-center">
          {[
                { key: 'all', label: '全部' },
                { key: 'noun', label: '名词' },
                { key: 'verb', label: '动词' },
                { key: 'adjective', label: '形容词' },
                { key: 'adverb', label: '副词' },
                { key: 'unknown', label: 'Unknown' },
            ].map((tab) => (<button key={tab.key} onClick={() => setPartOfSpeechFilter(tab.key)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${partOfSpeechFilter === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}>
              {tab.label}
            </button>))}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="bg-white p-10 rounded-3xl shadow-sm border border-zinc-200 text-center max-w-md w-full">
            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">复习完成！</h2>
            <p className="text-zinc-500 mb-8">
              {partOfSpeechFilter === 'all' ? '今日待复习内容已全部扫清。' : '当前词性分类下暂无待复习，可切换其他分类或返回文档。'}
            </p>
            <link_1.default href={`/documents/${id}`} className="block w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all">
              返回文档
            </link_1.default>
          </div>
        </div>
      </div>);
    }
    const currentCard = cards[currentIndex];
    return (<div className="min-h-screen bg-zinc-50 flex flex-col">
      
      <header className="px-6 py-4 flex items-center justify-between bg-white border-b border-zinc-200 sticky top-0 z-10">
        <link_1.default href={`/documents/${id}`} className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </link_1.default>
        <div className="flex flex-col items-center">
          <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">
            正在复习
          </span>
          <span className="text-sm font-bold text-blue-600">
            {currentIndex + 1} / {cards.length}
          </span>
          <span className="text-[10px] text-zinc-400 mt-0.5">
            剩余 {Math.max(cards.length - currentIndex - 1, 0)}
          </span>
        </div>
        <button onClick={loadCards} className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-500" title="刷新待复习列表">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><polyline points="21 3 21 9 15 9"/></svg>
        </button>
      </header>

      
      <div className="px-4 py-3 bg-white border-b border-zinc-100 flex flex-wrap gap-2 justify-center">
        {[{ key: 'due', label: '仅到期' }, { key: 'all', label: '全部复习' }].map((m) => (<button key={m.key} onClick={() => setReviewMode(m.key)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${reviewMode === m.key
                ? 'bg-black text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}>
            {m.label}
          </button>))}
      </div>

      
      <div className="px-4 py-3 bg-white border-b border-zinc-100 flex flex-wrap gap-2 justify-center">
        {[
            { key: 'all', label: '全部' },
            { key: 'noun', label: '名词' },
            { key: 'verb', label: '动词' },
            { key: 'adjective', label: '形容词' },
            { key: 'adverb', label: '副词' },
            { key: 'unknown', label: 'Unknown' },
        ].map((tab) => (<button key={tab.key} onClick={() => setPartOfSpeechFilter(tab.key)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${partOfSpeechFilter === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}>
            {tab.label}
          </button>))}
      </div>

      
      <div className="h-1.5 bg-zinc-200 w-full">
        <div className="h-full bg-blue-500 transition-all duration-500 ease-out" style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}></div>
      </div>

      
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-xl py-4">
          <div className="bg-white rounded-4xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-zinc-100 p-6 sm:p-12 flex flex-col items-center min-h-[400px] sm:min-h-[450px]">
            
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-3xl sm:text-5xl font-black text-zinc-900 mb-3 tracking-tight break-words px-2">
                {currentCard.word}
              </h1>
              <span className="px-3 py-1 bg-zinc-100 text-zinc-500 text-[10px] sm:text-xs font-bold rounded-full uppercase tracking-wider">
                {currentCard.partOfSpeech}
              </span>
            </div>

            
            <div className="flex gap-4 mb-8 sm:mb-12">
              <button onClick={() => playAudio(currentCard.word)} className={`p-3 sm:p-4 rounded-full transition-all ${playingText === currentCard.word
            ? 'bg-blue-100 text-blue-600 animate-pulse'
            : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                </svg>
              </button>
            </div>

            
            <div className="w-full flex-1 flex flex-col items-center justify-center">
              {!showTranslation ? (<button onClick={() => setShowTranslation(true)} className="px-6 sm:px-8 py-3 bg-zinc-50 text-zinc-400 text-sm sm:text-base font-bold rounded-2xl border-2 border-dashed border-zinc-200 hover:border-zinc-300 hover:text-zinc-500 transition-all">
                  点击显示释义
                </button>) : (<div className="w-full animate-in fade-in zoom-in-95 duration-300">
                  <div className="text-center mb-6 sm:mb-8">
                    <p className="text-xl sm:text-2xl font-bold text-blue-600 leading-tight">
                      {currentCard.translation}
                    </p>
                  </div>
                  {currentCard.sentence && (<div className="p-4 sm:p-6 bg-zinc-50 rounded-2xl sm:rounded-3xl border border-zinc-100 relative group">
                      <p className="text-zinc-600 text-xs sm:text-sm leading-relaxed italic pr-8">
                        "{currentCard.sentence}"
                      </p>
                      <button onClick={() => playAudio(currentCard.sentence)} className="absolute top-4 right-4 text-zinc-300 hover:text-zinc-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                        </svg>
                      </button>
                    </div>)}
                </div>)}
            </div>
          </div>
        </div>
      </main>

      
      <footer className="p-4 sm:p-8 bg-white border-t border-zinc-200 sticky bottom-0 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-8">
        <div className="max-w-xl mx-auto flex gap-3 sm:gap-4">
          {!showTranslation ? (<button onClick={() => setShowTranslation(true)} className="flex-1 py-4 sm:py-5 bg-zinc-900 text-white rounded-3xl sm:rounded-4xl font-bold text-base sm:text-lg shadow-xl shadow-zinc-200 active:scale-[0.98] transition-all">
              显示答案
            </button>) : (<>
              <button onClick={() => handleGrade('AGAIN')} disabled={grading} className="flex-1 py-4 sm:py-5 bg-white border-2 border-red-100 text-red-500 rounded-3xl sm:rounded-4xl font-bold text-base sm:text-lg hover:bg-red-50 active:scale-[0.98] transition-all disabled:opacity-50">
                忘记了
              </button>
              <button onClick={() => handleGrade('GOOD')} disabled={grading} className="flex-1 py-4 sm:py-5 bg-green-500 text-white rounded-3xl sm:rounded-4xl font-bold text-base sm:text-lg shadow-xl shadow-green-100 hover:bg-green-600 active:scale-[0.98] transition-all disabled:opacity-50">
                认识
              </button>
            </>)}
        </div>
      </footer>
    </div>);
}
//# sourceMappingURL=page.js.map