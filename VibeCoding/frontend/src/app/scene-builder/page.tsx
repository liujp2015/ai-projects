'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type Token = { id: string; text: string };

type SceneLexicon = {
  scene: string;
  requiredWord?: string;
  subjects: Token[];
  verbs: Token[];
  objects: Token[];
  modifiers: Token[];
  suggestedSentences?: string[];
  corePhrases?: Token[];
};

type Selected = {
  subject?: Token;
  verb?: Token;
  object?: Token;
  modifier?: Token;
};

type SavedSentenceItem = {
  id: string;
  word: string;
  scene: string;
  sentence: string;
  source: 'USER' | 'SUGGESTED' | 'EVAL';
  createdAt: string;
};

function buildSentence(selected: Selected): string {
  const parts = [
    selected.subject?.text,
    selected.verb?.text,
    selected.object?.text,
    selected.modifier?.text,
  ].filter(Boolean);
  if (!parts.length) return '';
  const raw = parts.join(' ');
  return /[.!?]$/.test(raw) ? raw : raw + '.';
}

export default function SceneBuilderPage() {
  const searchParams = useSearchParams();
  const [scene, setScene] = useState('机场值机');
  const [word, setWord] = useState('');
  const [loadingScene, setLoadingScene] = useState(false);
  const [lexicon, setLexicon] = useState<SceneLexicon | null>(null);
  const [selected, setSelected] = useState<Selected>({});
  const [activeTab, setActiveTab] = useState<'subjects' | 'verbs' | 'objects' | 'modifiers'>(
    'subjects',
  );
  const [savedSentences, setSavedSentences] = useState<SavedSentenceItem[]>([]);
  const [savingSentence, setSavingSentence] = useState<string | null>(null);
  const [nextSuggestion, setNextSuggestion] = useState<{
    nextCategory: 'subjects' | 'verbs' | 'objects' | 'modifiers' | 'done';
    recommendedIds: string[];
    recommendations?: Array<{ id: string; reasonZh: string }>;
  } | null>(null);
  const [loadingNext, setLoadingNext] = useState(false);

  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [rightTab, setRightTab] = useState<'analysis' | 'saved'>('analysis');

  const sentence = useMemo(() => buildSentence(selected), [selected]);
  const requiredWord = (lexicon?.requiredWord || word).trim();
  const hasRequiredWord =
    !requiredWord ||
    sentence.toLowerCase().includes(requiredWord.toLowerCase());

  const needsCorePhrase = !!requiredWord;
  const coreChosen = !!selected.object; // we treat object as the "core phrase" when word is set

  const stepText = useMemo(() => {
    if (!lexicon) return '先生成词库';
    if (needsCorePhrase && !coreChosen) return 'Step 1：先选一个「高频搭配」（包含目标词）';
    if (!selected.subject) return 'Step 2：选择主语';
    if (!selected.verb) return 'Step 3：选择动作/动词短语';
    if (!selected.modifier) return 'Step 4：选择修饰语（可选）';
    return '完成：可以开始研究或保存为一句';
  }, [lexicon, needsCorePhrase, coreChosen, selected.subject, selected.verb, selected.modifier]);

  useEffect(() => {
    const w = (searchParams?.get('word') ?? '').trim();
    if (w) setWord(w);
  }, [searchParams]);

  const loadScene = async () => {
    setLoadingScene(true);
    setEvaluation(null);
    setSelected({});
    setSavedSentences([]);
    try {
      const res = await fetch('/api/sentence-builder/scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scene, word: word.trim() || undefined, targetUserLevel: 'A2' }),
      });
      if (!res.ok) {
        throw new Error(`Failed to generate scene lexicon: ${res.status}`);
      }
      const data = await res.json();
      setLexicon(data);
      setActiveTab(needsCorePhrase ? 'objects' : 'subjects');
    } catch (err) {
      console.error(err);
      alert('生成场景词库失败，请稍后重试。');
    } finally {
      setLoadingScene(false);
    }
  };

  const onPickToken = (cat: keyof Selected, token: Token) => {
    setSelected((prev) => {
      const next: Selected = { ...prev, [cat]: token };
      if (cat === 'object') {
        // object is treated as "core phrase" when requiredWord is set
        next.subject = undefined;
        next.verb = undefined;
        next.modifier = undefined;
        setActiveTab('subjects');
      } else if (cat === 'subject') {
        next.verb = undefined;
        next.modifier = undefined;
        setActiveTab('verbs');
      } else if (cat === 'verb') {
        next.modifier = undefined;
        setActiveTab('modifiers');
      }
      return next;
    });
  };

  const onRemoveToken = (cat: keyof Selected) => {
    setSelected((prev) => {
      const next: Selected = { ...prev, [cat]: undefined };
      if (cat === 'object') {
        next.subject = undefined;
        next.verb = undefined;
        next.modifier = undefined;
        setActiveTab('objects');
      } else if (cat === 'subject') {
        next.verb = undefined;
        next.modifier = undefined;
        setActiveTab('subjects');
      } else if (cat === 'verb') {
        next.modifier = undefined;
        setActiveTab('verbs');
      }
      return next;
    });
  };

  const onEvaluate = async () => {
    if (!sentence.trim()) return;
    if (!hasRequiredWord) {
      alert(`你的句子还没包含目标单词：${requiredWord}`);
      return;
    }
    setEvaluating(true);
    try {
      const res = await fetch('/api/sentence-builder/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scene, word: word.trim() || undefined, sentence, userLevel: 'A2' }),
      });
      if (!res.ok) {
        throw new Error(`Failed to evaluate sentence: ${res.status}`);
      }
      const data = await res.json();
      setEvaluation(data);
    } catch (err) {
      console.error(err);
      alert('分析句子失败，请稍后重试。');
    } finally {
      setEvaluating(false);
    }
  };

  const currentTokens: Token[] =
    (lexicon && (lexicon[activeTab] as Token[])) || [];

  const coreTokens: Token[] = lexicon?.corePhrases ?? [];

  const tabDisabled = {
    subjects: needsCorePhrase ? !coreChosen : false,
    verbs: needsCorePhrase ? !coreChosen || !selected.subject : !selected.subject,
    objects: false,
    modifiers: needsCorePhrase
      ? !coreChosen || !selected.subject || !selected.verb
      : !selected.subject || !selected.verb,
  };

  const orderedSelectedTexts = useMemo(() => {
    // Order matters for the prompt: core/object -> subject -> verb -> modifier
    const parts = [
      selected.object?.text,
      selected.subject?.text,
      selected.verb?.text,
      selected.modifier?.text,
    ].filter(Boolean) as string[];
    return parts;
  }, [selected.object, selected.subject, selected.verb, selected.modifier]);

  const orderedSelectedTokens = useMemo(() => {
    const parts: Array<{ category: 'core' | 'subject' | 'verb' | 'modifier' | 'object'; id: string; text: string }> = [];
    if (selected.object) {
      parts.push({ category: needsCorePhrase ? 'core' : 'object', id: selected.object.id, text: selected.object.text });
    }
    if (selected.subject) parts.push({ category: 'subject', id: selected.subject.id, text: selected.subject.text });
    if (selected.verb) parts.push({ category: 'verb', id: selected.verb.id, text: selected.verb.text });
    if (selected.modifier) parts.push({ category: 'modifier', id: selected.modifier.id, text: selected.modifier.text });
    return parts;
  }, [needsCorePhrase, selected.object, selected.subject, selected.verb, selected.modifier]);

  useEffect(() => {
    if (!lexicon) return;

    const controller = new AbortController();
    const run = async () => {
      try {
        setLoadingNext(true);
        const res = await fetch('/api/sentence-builder/next-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scene,
            currentTokens: orderedSelectedTokens,
            allOptions: lexicon,
          }),
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!data?.nextCategory) return;

        const normalized = {
          nextCategory: data.nextCategory as
            | 'subjects'
            | 'verbs'
            | 'objects'
            | 'modifiers'
            | 'done',
          recommendedIds: Array.isArray(data.recommendedIds)
            ? data.recommendedIds.map(String)
            : [],
          recommendations: Array.isArray(data.recommendations)
            ? data.recommendations
                .map((r: any) => ({
                  id: String(r?.id ?? ''),
                  reasonZh: String(r?.reasonZh ?? ''),
                }))
                .filter((r: any) => r.id)
            : undefined,
        };
        setNextSuggestion(normalized);

        // Optional: auto jump to suggested category if it is not locked by step rules
        if (normalized.nextCategory !== 'done') {
          const suggestedTab = normalized.nextCategory as
            | 'subjects'
            | 'verbs'
            | 'objects'
            | 'modifiers';
          if (!(tabDisabled as any)[suggestedTab]) {
            setActiveTab(suggestedTab);
          }
        }
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
      } finally {
        setLoadingNext(false);
      }
    };

    run();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    lexicon,
    scene,
    orderedSelectedTokens.map((x) => `${x.category}:${x.id}`).join('|'),
    tabDisabled.subjects,
    tabDisabled.verbs,
    tabDisabled.modifiers,
  ]);

  const recommendedIdSet = useMemo(() => {
    return new Set(nextSuggestion?.recommendedIds ?? []);
  }, [nextSuggestion?.recommendedIds]);

  const recommendedReasonById = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of nextSuggestion?.recommendations ?? []) {
      if (!r?.id) continue;
      const raw = String(r.reasonZh || '');
      // keep only CJK chars, trim to 12 chars (defensive, model may output extra)
      const cleaned = raw.replace(/[^\u4e00-\u9fff]/g, '').slice(0, 12);
      map.set(r.id, cleaned);
    }
    return map;
  }, [nextSuggestion?.recommendations]);

  const getTokensByCategory = (
    category: 'subjects' | 'verbs' | 'objects' | 'modifiers',
  ): Token[] => {
    if (!lexicon) return [];
    const base = (lexicon[category] as Token[]) ?? [];
    // If the model recommends core_* ids while asking for objects, include corePhrases for display
    if (category === 'objects' && (lexicon.corePhrases?.length ?? 0) > 0) {
      return [...(lexicon.corePhrases ?? []), ...base];
    }
    return base;
  };

  const pinnedCurrentTokens = useMemo(() => {
    // Auto-pin recommended tokens to the top of current tab list
    if (!lexicon) return [];
    const tokens = getTokensByCategory(activeTab);
    if (!recommendedIdSet.size) return tokens;
    const rec: Token[] = [];
    const rest: Token[] = [];
    for (const t of tokens) {
      (recommendedIdSet.has(t.id) ? rec : rest).push(t);
    }
    return [...rec, ...rest];
  }, [lexicon, activeTab, recommendedIdSet]);

  const recommendedTokens = useMemo(() => {
    if (!lexicon || !nextSuggestion || nextSuggestion.nextCategory === 'done') return [];
    const tokens = getTokensByCategory(nextSuggestion.nextCategory);
    return tokens.filter((t) => recommendedIdSet.has(t.id)).slice(0, 3);
  }, [lexicon, nextSuggestion, recommendedIdSet]);

  const refreshSaved = async (w: string, sc: string) => {
    const ww = (w ?? '').trim();
    const ss = (sc ?? '').trim();
    if (!ww || !ss) return;
    const res = await fetch(`/api/sentence-builder/saved?word=${encodeURIComponent(ww)}&scene=${encodeURIComponent(ss)}`, {
      method: 'GET',
    });
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) {
      setSavedSentences(
        data.map((x: any) => ({
          id: String(x?.id ?? ''),
          word: String(x?.word ?? ''),
          scene: String(x?.scene ?? ''),
          sentence: String(x?.sentence ?? ''),
          source: (String(x?.source ?? 'USER').toUpperCase() as any) ?? 'USER',
          createdAt: String(x?.createdAt ?? ''),
        })).filter((x: any) => x.id && x.sentence),
      );
    }
  };

  useEffect(() => {
    if (!lexicon) return;
    const w = (requiredWord || '').trim();
    const sc = (scene || '').trim();
    if (!w || !sc) return;
    refreshSaved(w, sc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lexicon, requiredWord, scene]);

  const saveSentenceToDb = async (s: string, source: SavedSentenceItem['source']) => {
    const w = (requiredWord || word).trim();
    const sc = (scene || '').trim();
    const sent = String(s ?? '').trim();
    if (!w) {
      alert('请先填写目标单词（来自生词本）');
      return;
    }
    if (!sc) {
      alert('请先填写场景');
      return;
    }
    if (!sent) return;
    if (!sent.toLowerCase().includes(w.toLowerCase())) {
      alert(`该句子未包含目标单词：${w}`);
      return;
    }

    setSavingSentence(sent);
    try {
      const res = await fetch('/api/sentence-builder/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: w, scene: sc, sentence: sent, source }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `HTTP ${res.status}`);
      }
      await refreshSaved(w, sc);
    } catch (e) {
      console.error(e);
      alert('保存失败，请稍后重试');
    } finally {
      setSavingSentence(null);
    }
  };

  const saveCurrentSentence = () => {
    if (!sentence.trim()) return;
    if (!hasRequiredWord) {
      alert(`你的句子还没包含目标单词：${requiredWord}`);
      return;
    }
    saveSentenceToDb(sentence, 'USER');
  };

  const newSentenceSameLexicon = () => {
    setEvaluation(null);
    setSelected((prev) => ({
      object: prev.object, // keep the core phrase (for multi-sentence practice)
      subject: undefined,
      verb: undefined,
      modifier: undefined,
    }));
    setActiveTab('subjects');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6 flex flex-col gap-3">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300">
            <span className="px-2 py-0.5 rounded-full bg-slate-800/70 border border-slate-700">
              场景造句 · 实验功能
            </span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                场景造句工作台
              </h1>
              <p className="mt-1 text-sm text-slate-300">
                选一个生词 + 场景，AI 帮你推荐高频搭配，一步一步拼出多句地道例句。
              </p>
            </div>
            {requiredWord && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">当前生词</span>
                <span className="px-3 py-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-400/60 text-emerald-200 text-sm font-semibold">
                  {requiredWord}
                </span>
              </div>
            )}
          </div>
        </header>

        <main className="rounded-3xl bg-white/95 shadow-2xl border border-slate-200 p-6 lg:p-8 space-y-6">
          {/* 顶部：生词 + 场景选择 */}
          <section className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500">目标单词</label>
                <input
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500 bg-slate-50"
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                  placeholder="例如：luggage（从生词本自动带入）"
                />
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500">练习场景</label>
                <input
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500 bg-slate-50"
                  value={scene}
                  onChange={(e) => setScene(e.target.value)}
                  placeholder="例如：机场值机、医院看病、咖啡厅点单…"
                />
              </div>
            </div>
            <button
              onClick={loadScene}
              disabled={loadingScene}
              className="inline-flex items-center justify-center px-4 py-2 rounded-2xl bg-blue-600 text-white text-sm font-semibold shadow-md hover:bg-blue-700 disabled:opacity-50 disabled:shadow-none transition"
            >
              {loadingScene ? '生成中…' : '生成场景词库'}
            </button>
          </section>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.1fr)]">
            {/* 左侧：造句流程 */}
            <div className="space-y-5">
              {/* 造句区 */}
              <section className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-slate-700">造句区</div>
                  <div className="inline-flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
                      {stepText}
                    </span>
                    {nextSuggestion && nextSuggestion.nextCategory !== 'done' && (
                      <span className="inline-flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                        AI 建议：{nextSuggestion.nextCategory}
                        {loadingNext ? '（更新中…）' : ''}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 min-h-[40px]">
                  {(['subject', 'verb', 'object', 'modifier'] as (keyof Selected)[]).map(
                    (cat) => {
                      const token = selected[cat];
                      if (!token) return null;
                      const color =
                        cat === 'subject'
                          ? 'bg-blue-100 text-blue-800'
                          : cat === 'verb'
                          ? 'bg-green-100 text-green-800'
                          : cat === 'object'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-slate-100 text-slate-800';
                      return (
                        <button
                          key={cat}
                          onClick={() => onRemoveToken(cat)}
                          className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}
                        >
                          {token.text} ✕
                        </button>
                      );
                    },
                  )}
                  {!selected.subject && !selected.verb && !selected.object && !selected.modifier && (
                    <span className="text-xs text-slate-400">
                      先从下方词块中点选，句子会自动拼在这里…
                    </span>
                  )}
                </div>

                <div className="mt-1 rounded-xl bg-white px-3 py-2 border border-slate-200 text-sm min-h-[40px] flex items-center">
                  <span className="text-slate-400 mr-2">句子：</span>
                  <span className="font-medium text-slate-800">
                    {sentence || '（还没有内容）'}
                  </span>
                </div>

                {!!requiredWord && (
                  <div className={`text-xs mt-1 ${hasRequiredWord ? 'text-emerald-700' : 'text-rose-700'}`}>
                    目标单词：<b>{requiredWord}</b>（{hasRequiredWord ? '已包含' : '未包含'}）
                  </div>
                )}

                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    onClick={onEvaluate}
                    disabled={!sentence.trim() || evaluating || !hasRequiredWord}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold disabled:opacity-50"
                  >
                    {evaluating ? '分析中…' : '开始研究'}
                  </button>
                  <button
                    onClick={saveCurrentSentence}
                    disabled={!sentence.trim() || !hasRequiredWord}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold disabled:opacity-50"
                  >
                    保存为一句
                  </button>
                  <button
                    onClick={newSentenceSameLexicon}
                    disabled={!selected.object}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold disabled:opacity-40 bg-white"
                  >
                    再来一句（保留核心搭配）
                  </button>
                </div>
              </section>

              {/* 高频搭配（目标词驱动） */}
              {!!requiredWord && lexicon && (
                <section className="rounded-2xl border border-slate-200 bg-white px-4 py-3 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-slate-800">
                      高频搭配 · 核心短语
                    </div>
                    <span className="text-[11px] text-slate-500">
                      先选一个，必须包含 <b>{requiredWord}</b>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {coreTokens.length > 0 ? (
                      coreTokens.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => onPickToken('object', t)}
                          className={`px-2 py-1 rounded-full text-xs border ${
                            selected.object?.id === t.id
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : recommendedIdSet.has(t.id)
                              ? 'border-amber-400 bg-amber-50 text-amber-900'
                              : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-blue-300'
                          }`}
                        >
                          {t.text}
                        </button>
                      ))
                    ) : (
                      <div className="text-sm text-slate-500">
                        暂无核心短语，你可以在下方「核心短语/宾语」里直接选带有目标词的短语。
                      </div>
                    )}
                  </div>
                  {lexicon.suggestedSentences?.length ? (
                    <div className="mt-1 text-xs text-slate-600 space-y-1.5">
                      <div className="font-medium">同场景多句参考（都包含目标词）：</div>
                      <ul className="space-y-1">
                        {lexicon.suggestedSentences.map((s, i) => (
                          <li key={i} className="flex items-start justify-between gap-2">
                            <span className="flex-1">{s}</span>
                            <button
                              className="shrink-0 px-2 py-0.5 rounded-full border text-[10px] text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                              onClick={() => saveSentenceToDb(s, 'SUGGESTED')}
                              disabled={savingSentence === s}
                              title="保存到该生词的句子库"
                            >
                              {savingSentence === s ? '保存中…' : '保存'}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </section>
              )}

              {/* 词块选择区 */}
              {lexicon && (
                <section className="rounded-2xl border border-slate-200 bg-white px-4 py-3 flex flex-col gap-3">
                  <div className="flex gap-2 mb-1">
                    {(['subjects', 'verbs', 'objects', 'modifiers'] as const).map((k) => (
                      <button
                        key={k}
                        onClick={() => setActiveTab(k)}
                        disabled={(tabDisabled as any)[k]}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                          (tabDisabled as any)[k]
                            ? 'bg-slate-50 text-slate-300'
                            : activeTab === k
                            ? 'bg-blue-600 text-white shadow'
                            : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                        }`}
                      >
                        {k === 'subjects'
                          ? '主语'
                          : k === 'verbs'
                          ? '动作'
                          : k === 'objects'
                          ? '核心短语/宾语'
                          : '修饰语'}
                      </button>
                    ))}
                  </div>

                  {/* 推荐区（1~3 个） */}
                  {recommendedTokens.length > 0 && (
                    <div className="mb-1">
                      <div className="text-xs font-semibold text-amber-700 mb-1">
                        推荐（点一下就行）
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recommendedTokens.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => {
                              const cat =
                                nextSuggestion?.nextCategory === 'subjects'
                                  ? 'subject'
                                  : nextSuggestion?.nextCategory === 'verbs'
                                  ? 'verb'
                                  : nextSuggestion?.nextCategory === 'objects'
                                  ? 'object'
                                  : 'modifier';
                              onPickToken(cat as any, t);
                            }}
                            title={recommendedReasonById.get(t.id) || ''}
                            className="px-2 py-1 rounded-full text-xs border border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100"
                          >
                            <span className="font-medium">{t.text}</span>
                            {recommendedReasonById.get(t.id) ? (
                              <span className="ml-2 text-[10px] text-amber-700">
                                {recommendedReasonById.get(t.id)}
                              </span>
                            ) : null}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {pinnedCurrentTokens.map((t) => {
                      const cat =
                        activeTab === 'subjects'
                          ? 'subject'
                          : activeTab === 'verbs'
                          ? 'verb'
                          : activeTab === 'objects'
                          ? 'object'
                          : 'modifier';
                      const color =
                        activeTab === 'subjects'
                          ? 'bg-blue-100 text-blue-800'
                          : activeTab === 'verbs'
                          ? 'bg-green-100 text-green-800'
                          : activeTab === 'objects'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-slate-100 text-slate-800';
                      return (
                        <button
                          key={t.id}
                          onClick={() => onPickToken(cat as any, t)}
                          className={`px-2 py-1 rounded-full text-xs ${color} ${
                            recommendedIdSet.has(t.id) ? 'ring-2 ring-amber-400' : ''
                          }`}
                          title={recommendedReasonById.get(t.id) || ''}
                        >
                          {t.text}
                        </button>
                      );
                    })}
                    {!currentTokens.length && (
                      <div className="text-sm text-slate-400">暂无该类词块</div>
                    )}
                  </div>
                </section>
              )}
            </div>

            {/* 右侧：研究结果 + 已保存句子 */}
            <div className="space-y-5">
              {/* 右侧 Tab 切换 */}
              <section className="rounded-2xl border border-slate-200 bg-white px-4 py-3 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="inline-flex rounded-full bg-slate-100 p-1 text-xs">
                    <button
                      onClick={() => setRightTab('analysis')}
                      className={`px-3 py-1 rounded-full font-semibold ${
                        rightTab === 'analysis'
                          ? 'bg-white text-slate-900 shadow'
                          : 'text-slate-500'
                      }`}
                    >
                      研究结果
                    </button>
                    <button
                      onClick={() => setRightTab('saved')}
                      className={`px-3 py-1 rounded-full font-semibold ${
                        rightTab === 'saved'
                          ? 'bg-white text-slate-900 shadow'
                          : 'text-slate-500'
                      }`}
                    >
                      已保存句子
                    </button>
                  </div>
                  {rightTab === 'saved' && (
                    <div className="text-[11px] text-slate-500">
                      共 {savedSentences.length} 句
                    </div>
                  )}
                </div>

                {rightTab === 'analysis' ? (
                  evaluation ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold text-slate-800">研究结果</div>
                        <div className="text-xs text-slate-500">
                          语法：
                          {evaluation.isGrammaticallyCorrect ? '✔ 正确' : '✘ 有问题'} · 地道：
                          {evaluation.isNatural ? '自然' : '不太自然'}
                        </div>
                      </div>
                      {evaluation.corrections?.length > 0 && (
                        <div className="text-sm space-y-1.5">
                          <div className="text-xs font-semibold text-slate-600">修改建议</div>
                          <ul className="list-disc ml-5">
                            {evaluation.corrections.map((c: any, i: number) => (
                              <li key={i}>
                                {c.original} → <b>{c.suggested}</b>：{c.reasonZh}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {evaluation.explanations?.grammarPoints && (
                        <div className="text-sm space-y-1.5">
                          <div className="text-xs font-semibold text-slate-600">语法点</div>
                          <ul className="list-disc ml-5">
                            {evaluation.explanations.grammarPoints.map((g: any, i: number) => (
                              <li key={i}>
                                <b>{g.title}</b>：{g.detailZh}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {evaluation.explanations?.cultureTips && (
                        <div className="text-sm space-y-1.5">
                          <div className="text-xs font-semibold text-slate-600">文化提示</div>
                          <ul className="list-disc ml-5">
                            {evaluation.explanations.cultureTips.map((t: string, i: number) => (
                              <li key={i}>{t}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {evaluation.suggestedExamples?.length > 0 && (
                        <div className="text-sm space-y-1.5">
                          <div className="text-xs font-semibold text-slate-600">
                            同场景更多例句（都包含目标词）
                          </div>
                          <ul className="space-y-1">
                            {evaluation.suggestedExamples.map((t: string, i: number) => (
                              <li key={i} className="flex items-start justify-between gap-2">
                                <span className="flex-1">{t}</span>
                                <button
                                  className="shrink-0 px-2 py-0.5 rounded-full border text-[10px] text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                  onClick={() => saveSentenceToDb(t, 'EVAL')}
                                  disabled={savingSentence === t}
                                  title="保存到该生词的句子库"
                                >
                                  {savingSentence === t ? '保存中…' : '保存'}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400">还没有研究结果，先在左侧造一句并点击“开始研究”。</div>
                  )
                ) : savedSentences.length > 0 ? (
                  <ul className="text-sm space-y-1.5 max-h-64 overflow-auto pr-1">
                    {savedSentences.map((it) => (
                      <li key={it.id} className="flex items-start justify-between gap-2">
                        <span className="flex-1">
                          {it.sentence}{' '}
                          <span className="ml-2 text-[10px] text-slate-400">
                            ({it.source})
                          </span>
                        </span>
                        <button
                          className="shrink-0 px-2 py-0.5 rounded-full border text-[10px] text-rose-700 hover:bg-rose-50"
                          onClick={async () => {
                            const ok = confirm('确定删除这句吗？');
                            if (!ok) return;
                            const res = await fetch(
                              `/api/sentence-builder/saved/${encodeURIComponent(it.id)}`,
                              {
                                method: 'DELETE',
                              },
                            );
                            if (res.ok) {
                              const w = (requiredWord || word).trim();
                              const sc = (scene || '').trim();
                              await refreshSaved(w, sc);
                            } else {
                              alert('删除失败');
                            }
                          }}
                        >
                          删除
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-slate-400">
                    还没有为这个生词保存句子，可以从左侧“保存为一句”或研究结果里的推荐例句添加。
                  </div>
                )}
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


