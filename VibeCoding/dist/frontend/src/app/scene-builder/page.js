'use client';
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SceneBuilderPage;
const react_1 = __importStar(require("react"));
function buildSentence(selected) {
    const parts = [
        selected.subject?.text,
        selected.verb?.text,
        selected.object?.text,
        selected.modifier?.text,
    ].filter(Boolean);
    if (!parts.length)
        return '';
    const raw = parts.join(' ');
    return /[.!?]$/.test(raw) ? raw : raw + '.';
}
function SceneBuilderPage() {
    const [scene, setScene] = (0, react_1.useState)('机场值机');
    const [loadingScene, setLoadingScene] = (0, react_1.useState)(false);
    const [lexicon, setLexicon] = (0, react_1.useState)(null);
    const [selected, setSelected] = (0, react_1.useState)({});
    const [activeTab, setActiveTab] = (0, react_1.useState)('subjects');
    const [evaluating, setEvaluating] = (0, react_1.useState)(false);
    const [evaluation, setEvaluation] = (0, react_1.useState)(null);
    const sentence = (0, react_1.useMemo)(() => buildSentence(selected), [selected]);
    const loadScene = async () => {
        setLoadingScene(true);
        setEvaluation(null);
        setSelected({});
        try {
            const res = await fetch('/api/sentence-builder/scene', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scene }),
            });
            if (!res.ok) {
                throw new Error(`Failed to generate scene lexicon: ${res.status}`);
            }
            const data = await res.json();
            setLexicon(data);
            setActiveTab('subjects');
        }
        catch (err) {
            console.error(err);
            alert('生成场景词库失败，请稍后重试。');
        }
        finally {
            setLoadingScene(false);
        }
    };
    const onPickToken = (cat, token) => {
        setSelected((prev) => {
            const next = { ...prev, [cat]: token };
            if (cat === 'subject') {
                next.verb = undefined;
                next.object = undefined;
                next.modifier = undefined;
                setActiveTab('verbs');
            }
            else if (cat === 'verb') {
                next.object = undefined;
                next.modifier = undefined;
                setActiveTab('objects');
            }
            else if (cat === 'object') {
                next.modifier = undefined;
                setActiveTab('modifiers');
            }
            return next;
        });
    };
    const onRemoveToken = (cat) => {
        setSelected((prev) => {
            const next = { ...prev, [cat]: undefined };
            if (cat === 'subject') {
                next.verb = undefined;
                next.object = undefined;
                next.modifier = undefined;
                setActiveTab('subjects');
            }
            else if (cat === 'verb') {
                next.object = undefined;
                next.modifier = undefined;
                setActiveTab('verbs');
            }
            else if (cat === 'object') {
                next.modifier = undefined;
                setActiveTab('objects');
            }
            return next;
        });
    };
    const onEvaluate = async () => {
        if (!sentence.trim())
            return;
        setEvaluating(true);
        try {
            const res = await fetch('/api/sentence-builder/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scene, sentence, userLevel: 'A2' }),
            });
            if (!res.ok) {
                throw new Error(`Failed to evaluate sentence: ${res.status}`);
            }
            const data = await res.json();
            setEvaluation(data);
        }
        catch (err) {
            console.error(err);
            alert('分析句子失败，请稍后重试。');
        }
        finally {
            setEvaluating(false);
        }
    };
    const currentTokens = (lexicon && lexicon[activeTab]) || [];
    return (<div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-4">
      <h1 className="text-2xl font-bold mb-2">场景造句（LLM 驱动）</h1>

      
      <div className="flex items-center gap-2">
        <input className="border rounded px-2 py-1 flex-1" value={scene} onChange={(e) => setScene(e.target.value)} placeholder="输入场景，如：机场值机、医院看病…"/>
        <button onClick={loadScene} disabled={loadingScene} className="px-3 py-1 rounded bg-blue-600 text-white text-sm disabled:opacity-50">
          {loadingScene ? '生成中…' : '生成词库'}
        </button>
      </div>

      
      <div className="border rounded p-3 bg-slate-50 flex flex-col gap-2">
        <div className="text-sm text-slate-500">造句区</div>
        <div className="flex flex-wrap gap-2 min-h-[40px]">
          {['subject', 'verb', 'object', 'modifier'].map((cat) => {
            const token = selected[cat];
            if (!token)
                return null;
            const color = cat === 'subject'
                ? 'bg-blue-100 text-blue-800'
                : cat === 'verb'
                    ? 'bg-green-100 text-green-800'
                    : cat === 'object'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-slate-100 text-slate-800';
            return (<button key={cat} onClick={() => onRemoveToken(cat)} className={`px-2 py-1 rounded text-sm ${color}`}>
                  {token.text} ✕
                </button>);
        })}
        </div>
        <div className="text-lg font-semibold mt-1">
          {sentence || '点击下方词块开始造句…'}
        </div>
        <div className="mt-2 flex gap-2">
          <button onClick={onEvaluate} disabled={!sentence.trim() || evaluating} className="px-3 py-1 rounded bg-emerald-600 text-white text-sm disabled:opacity-50">
            {evaluating ? '分析中…' : '开始研究'}
          </button>
        </div>
      </div>

      
      {lexicon && (<div className="border rounded p-3 flex flex-col gap-2">
          <div className="flex gap-2 mb-2">
            {['subjects', 'verbs', 'objects', 'modifiers'].map((k) => (<button key={k} onClick={() => setActiveTab(k)} className={`px-3 py-1 rounded text-sm ${activeTab === k ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                {k === 'subjects'
                    ? '主语'
                    : k === 'verbs'
                        ? '动作'
                        : k === 'objects'
                            ? '宾语'
                            : '修饰语'}
              </button>))}
          </div>
          <div className="flex flex-wrap gap-2">
            {currentTokens.map((t) => {
                const cat = activeTab === 'subjects'
                    ? 'subject'
                    : activeTab === 'verbs'
                        ? 'verb'
                        : activeTab === 'objects'
                            ? 'object'
                            : 'modifier';
                const color = activeTab === 'subjects'
                    ? 'bg-blue-100 text-blue-800'
                    : activeTab === 'verbs'
                        ? 'bg-green-100 text-green-800'
                        : activeTab === 'objects'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-slate-100 text-slate-800';
                return (<button key={t.id} onClick={() => onPickToken(cat, t)} className={`px-2 py-1 rounded text-sm ${color}`}>
                  {t.text}
                </button>);
            })}
            {!currentTokens.length && (<div className="text-sm text-slate-400">暂无该类词块</div>)}
          </div>
        </div>)}

      
      {evaluation && (<div className="border rounded p-3 flex flex-col gap-2">
          <div className="font-semibold mb-1">研究结果</div>
          <div className="text-sm">
            语法：
            {evaluation.isGrammaticallyCorrect ? '✔ 正确' : '✘ 有问题'}，地道程度：
            {evaluation.isNatural ? '自然' : '不太自然'}
          </div>
          {evaluation.corrections?.length > 0 && (<div className="text-sm">
              <div className="font-medium">修改建议：</div>
              <ul className="list-disc ml-5">
                {evaluation.corrections.map((c, i) => (<li key={i}>
                    {c.original} → <b>{c.suggested}</b>：{c.reasonZh}
                  </li>))}
              </ul>
            </div>)}
          {evaluation.explanations?.grammarPoints && (<div className="text-sm">
              <div className="font-medium">语法点：</div>
              <ul className="list-disc ml-5">
                {evaluation.explanations.grammarPoints.map((g, i) => (<li key={i}>
                    <b>{g.title}</b>：{g.detailZh}
                  </li>))}
              </ul>
            </div>)}
          {evaluation.explanations?.cultureTips && (<div className="text-sm">
              <div className="font-medium">文化提示：</div>
              <ul className="list-disc ml-5">
                {evaluation.explanations.cultureTips.map((t, i) => (<li key={i}>{t}</li>))}
              </ul>
            </div>)}
        </div>)}
    </div>);
}
//# sourceMappingURL=page.js.map