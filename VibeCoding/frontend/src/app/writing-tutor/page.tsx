'use client';

import { useMemo, useState } from 'react';

type LogicType = 'Point' | 'Evidence' | 'Explanation' | 'Link';
type LogicUnit = { id: string; type: LogicType; start: number; end: number; text: string; purposeZh: string };
type BlueprintNode = { step: number; type: LogicType; instructionZh: string };
type AnalyzeResponse = { logicUnits: LogicUnit[]; blueprint: BlueprintNode[] };
type StartSessionResponse = AnalyzeResponse & { sessionId: string; currentStepIndex: number; nextPrompt: string; done: boolean };
type NextStepResponse = { review: { pass: boolean; score: number; feedbackZh: string; hints: string[] }; currentStepIndex: number; nextPrompt: string; done: boolean };

const typeClassMap: Record<LogicType, string> = {
  Point: 'bg-blue-100 text-blue-900 border-blue-300',
  Evidence: 'bg-green-100 text-green-900 border-green-300',
  Explanation: 'bg-amber-100 text-amber-900 border-amber-300',
  Link: 'bg-purple-100 text-purple-900 border-purple-300',
};

export default function WritingTutorPage() {
  const [originalText, setOriginalText] = useState('');
  const [newTheme, setNewTheme] = useState('Artificial Intelligence');
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [nextPrompt, setNextPrompt] = useState('');
  const [done, setDone] = useState(false);
  const [streamingPrompt, setStreamingPrompt] = useState('');
  const [latestFeedback, setLatestFeedback] = useState('');

  const highlightedSegments = useMemo(() => {
    if (!result || !originalText) return [] as Array<{ text: string; type?: LogicType }>;
    const units = [...result.logicUnits].sort((a, b) => a.start - b.start);
    const segs: Array<{ text: string; type?: LogicType }> = [];
    let cursor = 0;
    for (const unit of units) {
      if (unit.start > cursor) segs.push({ text: originalText.slice(cursor, unit.start) });
      segs.push({ text: originalText.slice(unit.start, unit.end), type: unit.type });
      cursor = Math.max(cursor, unit.end);
    }
    if (cursor < originalText.length) segs.push({ text: originalText.slice(cursor) });
    return segs;
  }, [result, originalText]);

  const analyze = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/writing/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ originalText }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || '分析失败');
      setResult(data as AnalyzeResponse);
    } catch (e) { setError(e instanceof Error ? e.message : '分析失败'); }
    finally { setLoading(false); }
  };

  const startSession = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/writing/start-session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ originalText, newTheme }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || '启动会话失败');
      const d = data as StartSessionResponse;
      setSessionId(d.sessionId);
      setResult({ logicUnits: d.logicUnits, blueprint: d.blueprint });
      setCurrentStepIndex(d.currentStepIndex);
      setNextPrompt(d.nextPrompt);
      setDone(d.done);
      setStreamingPrompt('');
      setLatestFeedback('');
    } catch (e) { setError(e instanceof Error ? e.message : '启动会话失败'); }
    finally { setLoading(false); }
  };

  const submitStepBySSE = async () => {
    if (!sessionId) return;
    const text = userInput.trim();
    if (!text) { setError('请先输入本步骤内容'); return; }

    setError(null); setStreamingPrompt(''); setLatestFeedback('');
    const url = `/api/writing/next-step/stream?sessionId=${encodeURIComponent(sessionId)}&userInput=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok || !res.body) throw new Error('SSE 请求失败');

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buf = '';

    const handle = (block: string) => {
      const lines = block.split('\n').map((l) => l.trim());
      const event = lines.find((l) => l.startsWith('event:'))?.replace('event:', '').trim();
      const dataText = lines.find((l) => l.startsWith('data:'))?.replace('data:', '').trim();
      if (!event || !dataText) return;
      let data: any; try { data = JSON.parse(dataText); } catch { return; }
      if (event === 'guidance_token') setStreamingPrompt((p) => p + String(data?.token ?? ''));
      if (event === 'review_result') setLatestFeedback(String(data?.feedbackZh ?? ''));
      if (event === 'step_advanced') { setCurrentStepIndex(Number(data?.currentStepIndex ?? 0)); setDone(Boolean(data?.done)); }
      if (event === 'session_completed') setDone(true);
    };

    while (true) {
      const { done: end, value } = await reader.read();
      if (end) break;
      buf += decoder.decode(value, { stream: true });
      const blocks = buf.split('\n\n');
      buf = blocks.pop() ?? '';
      for (const b of blocks) handle(b);
    }
    if (buf.trim()) handle(buf.trim());
    setUserInput('');
  };

  const submitStepFallback = async () => {
    if (!sessionId) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/writing/next-step', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, userInput }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || '提交失败');
      const d = data as NextStepResponse;
      setCurrentStepIndex(d.currentStepIndex); setNextPrompt(d.nextPrompt); setDone(d.done); setLatestFeedback(d.review.feedbackZh); setUserInput('');
    } catch (e) { setError(e instanceof Error ? e.message : '提交失败'); }
    finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen bg-zinc-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold text-zinc-900">写作导师 - 阶段2&3（会话 + 流式引导）</h1>
          <p className="text-sm text-zinc-600">先分析并启动会话，再逐步提交内容，右侧可看到流式引导反馈。</p>
        </header>

        <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">英文范文</label>
              <textarea value={originalText} onChange={(e) => setOriginalText(e.target.value)} className="h-44 w-full rounded-lg border border-zinc-300 p-3 text-sm" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">迁移主题</label>
              <input value={newTheme} onChange={(e) => setNewTheme(e.target.value)} className="w-full rounded-lg border border-zinc-300 p-3 text-sm" />
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={analyze} disabled={loading} className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-white">仅分析</button>
                <button onClick={startSession} disabled={loading} className="rounded-lg bg-black px-4 py-2 text-sm text-white">启动会话</button>
              </div>
              {sessionId && <p className="mt-3 text-xs text-zinc-500">sessionId: {sessionId}</p>}
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm lg:col-span-2">
            <h2 className="mb-3 text-base font-semibold text-zinc-900">逻辑高亮预览</h2>
            <div className="min-h-40 whitespace-pre-wrap rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm leading-7 text-zinc-800">
              {highlightedSegments.length === 0 ? <span className="text-zinc-400">分析后将在这里展示逻辑高亮</span> : highlightedSegments.map((seg, idx) => seg.type ? <mark key={idx} className={`rounded border px-1 py-0.5 ${typeClassMap[seg.type]}`}>{seg.text}</mark> : <span key={idx}>{seg.text}</span>)}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-base font-semibold text-zinc-900">引导面板</h2>
            <p className="text-xs text-zinc-500">当前步骤：{currentStepIndex + 1}</p>
            <p className="mt-2 rounded bg-zinc-50 p-2 text-sm text-zinc-700">{streamingPrompt || nextPrompt || '等待启动会话...'}</p>
            <label className="mt-3 block text-sm font-medium text-zinc-700">你的本步输入</label>
            <textarea value={userInput} onChange={(e) => setUserInput(e.target.value)} className="mt-1 h-28 w-full rounded-lg border border-zinc-300 p-2 text-sm" />
            <div className="mt-2 flex gap-2">
              <button onClick={submitStepBySSE} disabled={!sessionId || done} className="rounded bg-black px-3 py-2 text-xs text-white disabled:opacity-50">SSE 提交</button>
              <button onClick={submitStepFallback} disabled={!sessionId || done || loading} className="rounded bg-zinc-700 px-3 py-2 text-xs text-white disabled:opacity-50">普通提交</button>
            </div>
            <p className="mt-3 text-sm text-emerald-700">{latestFeedback}</p>
            {done && <p className="mt-2 text-sm font-medium text-purple-700">会话已完成，可开始测试整体体验。</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
