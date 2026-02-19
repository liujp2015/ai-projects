'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchReviewQueue, submitReview, UserWord, getTTSUrl } from '@/lib/api';

const SCORES = [
  { value: 1, label: '忘记', color: 'bg-red-500 hover:bg-red-600' },
  { value: 3, label: '一般', color: 'bg-blue-500 hover:bg-blue-600' },
  { value: 5, label: '熟练', color: 'bg-green-500 hover:bg-green-600' },
];

export default function ReviewPage() {
  const [queue, setQueue] = useState<UserWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playingText, setPlayingText] = useState<string | null>(null);

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
    const loadQueue = async () => {
      try {
        setLoading(true);
        const data = await fetchReviewQueue();
        setQueue(data);
      } catch (err) {
        setError('加载复习队列失败');
      } finally {
        setLoading(false);
      }
    };
    loadQueue();
  }, []);

  const handleScore = async (quality: number) => {
    if (submitting) return;
    const currentWord = queue[currentIndex];
    
    try {
      setSaving(true);
      await submitReview(currentWord.word, quality);
      
      // Move to next
      setIsFlipped(false);
      if (currentIndex < queue.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // Finished
        setQueue([]);
      }
    } catch (err) {
      alert('提交复习结果失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">加载复习任务中...</div>;
  
  if (error) return <div className="min-h-screen flex flex-col items-center justify-center gap-4">
    <p className="text-red-500">{error}</p>
    <Link href="/documents" className="text-blue-600 underline">返回首页</Link>
  </div>;

  if (queue.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-4xl font-bold mb-4">🎉 复习完成！</h1>
        <p className="text-gray-500 mb-8">今天所有的任务都处理完了，休息一下吧。</p>
        <Link href="/documents" className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
          回到我的书库
        </Link>
      </div>
    );
  }

  const word = queue[currentIndex];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-8">
      <header className="w-full max-w-2xl flex justify-between items-center mb-12">
        <Link href="/documents" className="text-gray-500 hover:text-gray-700 font-medium">退出复习</Link>
        <div className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-1 rounded-full">
          进度: {currentIndex + 1} / {queue.length}
        </div>
      </header>

      <main className="w-full max-w-2xl flex-1 flex flex-col items-center justify-center">
        {/* Flashcard */}
        <div 
          onClick={() => !isFlipped && setIsFlipped(true)}
          className={`w-full min-h-[400px] bg-white rounded-3xl shadow-xl border border-gray-100 p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-500 transform ${isFlipped ? '' : 'hover:scale-[1.02]'}`}
        >
          <div className="flex items-center gap-4">
            <h2 className="text-5xl font-black text-gray-900">{word.word}</h2>
            <button
              onClick={(e) => {
                e.stopPropagation();
                playAudio(word.word);
              }}
              className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${playingText === word.word ? 'text-blue-600 animate-pulse' : 'text-gray-400'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
            </button>
          </div>
          
          {!isFlipped ? (
            <p className="text-gray-400 animate-pulse mt-8">点击卡片查看释义</p>
          ) : (
            <div className="w-full border-t border-gray-100 pt-8 mt-8 space-y-6">
              <div>
                <p className="text-2xl font-bold text-blue-600 mb-2">{word.translation}</p>
                {word.definition && (
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap mb-6">{word.definition}</p>
                )}
                
                {word.sourceSentence && (
                  <div className="mt-6 pt-6 border-t border-gray-50 text-left">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Context from Article</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playAudio(word.sourceSentence!.content);
                        }}
                        className={`p-1.5 rounded-full hover:bg-gray-100 transition-colors ${playingText === word.sourceSentence!.content ? 'text-blue-600 animate-pulse' : 'text-gray-400'}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
                      </button>
                    </div>
                    <p className="text-gray-700 italic leading-relaxed">
                      "{word.sourceSentence.content.split(new RegExp(`(${word.word})`, 'gi')).map((part, i) => 
                        part.toLowerCase() === word.word.toLowerCase() 
                          ? <span key={i} className="bg-yellow-100 font-bold px-1 rounded">{part}</span> 
                          : part
                      )}"
                    </p>
                    <div className="mt-4">
                      <Link 
                        href={`/documents/${word.sourceSentence.paragraph.document.id}?sentenceId=${word.sourceSentence.id}`}
                        className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        查看原文
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className={`mt-12 w-full grid grid-cols-3 gap-4 transition-all duration-300 ${isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {SCORES.map((s) => (
            <button
              key={s.value}
              onClick={() => handleScore(s.value)}
              disabled={submitting}
              className={`py-4 rounded-2xl text-white font-bold text-lg shadow-lg transition-transform active:scale-95 ${s.color}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

