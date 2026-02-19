'use client';

import { useState } from 'react';
import Image from "next/image";

export default function Home() {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/health');
      const data = await res.json();
      setHealthStatus(data);
    } catch (error) {
      setHealthStatus({ status: 'error', message: '无法连接到后端 (请确保后端已启动在 3000 端口)' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-12 py-32 px-16 bg-white dark:bg-black">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-black dark:text-zinc-50">
            英语学习系统 Phase 0
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            前后端联调测试：点击下方按钮检查后端健康状况。
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 w-full max-w-sm p-6 border rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold mb-2">后端健康检查</h2>
          <button
            onClick={checkHealth}
            disabled={loading}
            className="w-full h-12 bg-black dark:bg-white text-white dark:text-black rounded-full font-medium transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? '检查中...' : '开始测试'}
          </button>
          
          {healthStatus && (
            <div className={`mt-4 w-full p-4 rounded-xl text-sm font-mono overflow-auto ${healthStatus.status === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              <pre className="whitespace-pre-wrap">{JSON.stringify(healthStatus, null, 2)}</pre>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
