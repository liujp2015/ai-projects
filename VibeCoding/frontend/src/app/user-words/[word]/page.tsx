'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { lookupWord, WordDefinition } from '@/lib/api';

export default function WordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const word = (params?.word as string) || '';
  const decodedWord = decodeURIComponent(word);

  const [definition, setDefinition] = useState<WordDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!decodedWord) {
      setError('单词参数无效');
      setLoading(false);
      return;
    }

    const loadDefinition = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await lookupWord(decodedWord);
        setDefinition(data);
      } catch (e: any) {
        setError(e.message || '查询单词失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    loadDefinition();
  }, [decodedWord]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* 头部导航 */}
        <header className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/user-words"
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              ← 返回生词本
            </Link>
            <Link
              href={`/scene-builder?word=${encodeURIComponent(decodedWord)}`}
              className="px-4 py-2 rounded-lg text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700"
            >
              去场景造句
            </Link>
          </div>
          <h1 className="text-4xl font-bold text-gray-900">{decodedWord}</h1>
          {definition?.phonetic && (
            <p className="text-lg text-gray-600 mt-2">/{definition.phonetic}/</p>
          )}
        </header>

        {/* 加载状态 */}
        {loading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">正在查询单词信息...</p>
          </div>
        )}

        {/* 错误状态 */}
        {error && !loading && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* 单词详情 */}
        {definition && !loading && (
          <div className="space-y-6">
            {/* 中文翻译和释义 */}
            {(definition.translation || definition.definitionZh) && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">中文释义</h2>
                {definition.translation && (
                  <p className="text-lg text-gray-800 mb-2">
                    <span className="font-semibold">翻译：</span>
                    {definition.translation}
                  </p>
                )}
                {definition.definitionZh && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2 font-semibold">详细解释：</p>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {definition.definitionZh}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 英文释义 */}
            {definition.meanings && definition.meanings.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">英文释义</h2>
                <div className="space-y-6">
                  {definition.meanings.map((meaning, idx) => (
                    <div key={idx} className="border-l-4 border-blue-500 pl-4">
                      <h3 className="text-lg font-semibold text-blue-700 mb-2">
                        {meaning.partOfSpeech}
                      </h3>
                      <ul className="space-y-3">
                        {meaning.definitions.map((def, defIdx) => (
                          <li key={defIdx} className="text-gray-700">
                            <p className="mb-1">{def.definition}</p>
                            {def.example && (
                              <p className="text-sm text-gray-500 italic mt-1">
                                Example: "{def.example}"
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 音标信息 */}
            {definition.phonetics && definition.phonetics.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">发音</h2>
                <div className="space-y-2">
                  {definition.phonetics.map((phonetic: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      {phonetic.text && (
                        <span className="text-lg text-gray-700">/{phonetic.text}/</span>
                      )}
                      {phonetic.audio && (
                        <audio controls className="h-8">
                          <source src={phonetic.audio} type="audio/mpeg" />
                          您的浏览器不支持音频播放
                        </audio>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 如果没有找到任何信息 */}
            {!definition.translation &&
              !definition.definitionZh &&
              (!definition.meanings || definition.meanings.length === 0) && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                  <p className="text-yellow-700">
                    未找到该单词的详细信息，请检查拼写是否正确。
                  </p>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}

