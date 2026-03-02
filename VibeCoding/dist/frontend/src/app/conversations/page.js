'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ConversationsPage;
const react_1 = require("react");
const api_1 = require("@/lib/api");
const link_1 = __importDefault(require("next/link"));
function ConversationsPage() {
    const [conversations, setConversations] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const loadConversations = async () => {
        try {
            setLoading(true);
            const data = await (0, api_1.fetchConversations)();
            setConversations(data);
        }
        catch (err) {
            setError('Failed to load conversations');
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };
    (0, react_1.useEffect)(() => {
        loadConversations();
    }, []);
    const handleDelete = async (id) => {
        if (!confirm('确定要删除这个对话吗？'))
            return;
        try {
            await (0, api_1.deleteConversation)(id);
            await loadConversations();
        }
        catch (err) {
            alert('删除失败：' + err.message);
        }
    };
    return (<div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">对话列表</h1>
          <link_1.default href="/conversations/upload" className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition-colors">
            上传对话图片
          </link_1.default>
        </header>

        {error && (<div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
            <p className="text-red-700">{error}</p>
          </div>)}

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {loading ? (<div className="p-8 text-center text-gray-500">Loading conversations...</div>) : conversations.length === 0 ? (<div className="p-8 text-center text-gray-500">
              <p className="mb-4">还没有对话记录</p>
              <link_1.default href="/conversations/upload" className="text-blue-600 hover:underline">
                上传第一组对话图片
              </link_1.default>
            </div>) : (<ul className="divide-y divide-gray-200">
              {conversations.map((conv) => (<li key={conv.id}>
                  <link_1.default href={`/conversations/${conv.id}`} className="block hover:bg-gray-50">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-blue-600 truncate">
                          {conv.title}
                        </p>
                        <button onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDelete(conv.id);
                }} className="ml-2 p-1 text-red-600 hover:text-red-800">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            {conv.messages.length} 条消息
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <p>
                            {new Date(conv.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {conv.messages.length > 0 && (<div className="mt-2 text-sm text-gray-600 line-clamp-2">
                          <span className="font-medium">{conv.messages[0].speaker}:</span>{' '}
                          {conv.messages[0].content}
                        </div>)}
                    </div>
                  </link_1.default>
                </li>))}
            </ul>)}
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=page.js.map