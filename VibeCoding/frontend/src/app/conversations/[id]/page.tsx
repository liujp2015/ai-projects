'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchConversation, deleteConversation, Conversation, getTTSUrl } from '@/lib/api';
import Link from 'next/link';

export default function ConversationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadConversation = async () => {
      try {
        setLoading(true);
        const data = await fetchConversation(id as string);
        setConversation(data);
      } catch (err) {
        setError('Failed to load conversation');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, [id]);

  const handleDelete = async () => {
    if (!conversation || !confirm('确定要删除这个对话吗？')) return;
    try {
      await deleteConversation(conversation.id);
      router.push('/conversations');
    } catch (err) {
      alert('删除失败：' + (err as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-lg animate-pulse">Loading conversation...</p>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <p className="text-red-600 text-lg">{error || 'Conversation not found'}</p>
        <Link href="/conversations" className="text-blue-600 hover:underline">
          Back to Conversations
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-8 py-12">
        <header className="mb-8">
          <Link
            href="/conversations"
            className="text-blue-600 hover:underline mb-4 inline-block"
          >
            ← 返回对话列表
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{conversation.title}</h1>
              <p className="text-gray-600 mt-2">
                {conversation.messages.length} 条消息 ·{' '}
                {new Date(conversation.createdAt).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-red-600 hover:text-red-800 border border-red-300 rounded-md hover:bg-red-50"
            >
              删除对话
            </button>
          </div>
        </header>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            <div className="space-y-4">
              {conversation.messages
                .slice()
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((message, index) => {
                  // 将同一说话者固定在同一侧：根据 speaker 名称做一个稳定映射
                  const isLeft = (() => {
                    const s = message.speaker.trim().toLowerCase();
                    if (s === 'a' || s === 'speaker1' || s === 'person1') return true;
                    if (s === 'b' || s === 'speaker2' || s === 'person2') return false;
                    // 其他情况：按 hash 稍微分布一下，但保证同一个 speaker 不变
                    let hash = 0;
                    for (let i = 0; i < s.length; i++) {
                      hash = (hash * 31 + s.charCodeAt(i)) | 0;
                    }
                    return hash % 2 === 0;
                  })();

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isLeft ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`flex items-start max-w-[80%] gap-3 ${
                          isLeft ? '' : 'flex-row-reverse'
                        }`}
                      >
                        <div
                          className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shadow ${
                            isLeft ? 'bg-blue-500' : 'bg-green-500'
                          }`}
                        >
                          {message.speaker.charAt(0).toUpperCase()}
                        </div>
                        <div
                          className={`rounded-2xl px-4 py-2 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                            isLeft
                              ? 'bg-gray-100 text-gray-900 rounded-tl-none'
                              : 'bg-blue-600 text-white rounded-tr-none'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-xs opacity-80">
                              {message.speaker}
                            </span>
                            <span className="text-[10px] opacity-60">
                              #{message.orderIndex + 1}
                            </span>
                          </div>
                          <p>{message.content}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {conversation.messages.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500">这个对话还没有消息</p>
          </div>
        )}
      </div>
    </div>
  );
}
