'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = UserWordsPage;
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const api_1 = require("@/lib/api");
const STATUS_LABEL = {
    NEW: '新词',
    LEARNING: '学习中',
    MASTERED: '已掌握',
};
const STATUS_OPTIONS = ['NEW', 'LEARNING', 'MASTERED'];
function UserWordsPage() {
    const [items, setItems] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const [updatingWord, setUpdatingWord] = (0, react_1.useState)(null);
    const [sortBy, setSortBy] = (0, react_1.useState)('time');
    const load = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await (0, api_1.fetchUserWords)();
            setItems(data);
        }
        catch (e) {
            setError('加载生词失败，请确认后端运行在 :3001');
        }
        finally {
            setLoading(false);
        }
    };
    (0, react_1.useEffect)(() => {
        load();
    }, []);
    const sortedItems = (0, react_1.useMemo)(() => {
        const result = [...items];
        if (sortBy === 'alphabet') {
            return result.sort((a, b) => a.word.localeCompare(b.word));
        }
        else {
            return result.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
        }
    }, [items, sortBy]);
    const onChangeStatus = async (word, status) => {
        try {
            setUpdatingWord(word);
            const updated = await (0, api_1.updateUserWordStatus)(word, status);
            setItems((prev) => prev.map((it) => (it.word === word ? { ...it, ...updated } : it)));
        }
        catch (e) {
            alert('更新状态失败');
        }
        finally {
            setUpdatingWord(null);
        }
    };
    const stats = (0, react_1.useMemo)(() => {
        const counts = { NEW: 0, LEARNING: 0, MASTERED: 0 };
        for (const it of items)
            counts[it.status] = (counts[it.status] || 0) + 1;
        return counts;
    }, [items]);
    return (<div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col gap-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <link_1.default href="/documents" className="text-gray-500 hover:text-gray-700">
                返回文档
              </link_1.default>
              <h1 className="text-3xl font-bold text-gray-900">生词本</h1>
            </div>

            <button onClick={async () => {
            const ok = confirm('确定要清空所有数据吗？\n\n该操作会删除所有文档、句子、段落和生词记录，且不可恢复。');
            if (!ok)
                return;
            try {
                setUpdatingWord('__RESET__');
                await (0, api_1.resetDatabase)();
                alert('已清空数据');
                await load();
            }
            catch (e) {
                alert('清空失败，请确认后端已启动且 /admin/reset 可访问');
            }
            finally {
                setUpdatingWord(null);
            }
        }} disabled={updatingWord === '__RESET__'} className="px-4 py-2 rounded-lg text-sm font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
              {updatingWord === '__RESET__' ? '清空中...' : '清除数据'}
            </button>

            <div className="flex gap-2 text-xs">
              <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800">新词 {stats.NEW}</span>
              <span className="px-2 py-1 rounded bg-blue-100 text-blue-800">学习中 {stats.LEARNING}</span>
              <span className="px-2 py-1 rounded bg-gray-100 text-gray-700">已掌握 {stats.MASTERED}</span>
            </div>
          </div>

          
          <div className="flex items-center gap-4 bg-white p-2 rounded-xl shadow-sm border border-gray-100 w-fit">
            <span className="text-xs font-bold text-gray-400 px-2">排序方式:</span>
            <div className="flex gap-1">
              <button onClick={() => setSortBy('time')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${sortBy === 'time' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
                按时间
              </button>
              <button onClick={() => setSortBy('alphabet')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${sortBy === 'alphabet' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
                按字母
              </button>
            </div>
          </div>
        </header>

        {error && (<div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>)}

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {loading ? (<div className="p-8 text-center text-gray-500">加载中...</div>) : sortedItems.length === 0 ? (<div className="p-8 text-center text-gray-500">暂无收藏单词</div>) : (<ul className="divide-y divide-gray-200">
              {sortedItems.map((it) => (<li key={it.id} className="px-4 py-4 sm:px-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <p className="text-lg font-semibold text-gray-900 truncate">{it.word}</p>
                        {it.translation && (<span className="text-sm text-gray-700">{it.translation}</span>)}
                      </div>

                      {it.definition && (<p className="mt-1 text-sm text-gray-500 whitespace-pre-wrap">{it.definition}</p>)}

                      {it.sourceSentenceId && (<p className="mt-2 text-xs text-gray-400 font-mono">
                          sourceSentenceId: {it.sourceSentenceId}
                        </p>)}
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="text-sm text-gray-500">状态</label>
                      <select value={it.status} onChange={(e) => onChangeStatus(it.word, e.target.value)} disabled={updatingWord === it.word} className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white disabled:opacity-50">
                        {STATUS_OPTIONS.map((s) => (<option key={s} value={s}>
                            {STATUS_LABEL[s] ?? s}
                          </option>))}
                      </select>
                      {updatingWord === it.word && (<span className="text-xs text-gray-400">更新中...</span>)}
                    </div>
                  </div>
                </li>))}
            </ul>)}
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=page.js.map