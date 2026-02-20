'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';

export default function Header() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-indigo-600">
          返利折扣网
        </Link>
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="搜索商品..."
            className="px-4 py-2 border border-gray-300 rounded-md w-64"
          />
          {isAuthenticated ? (
            <>
              <Link href="/profile" className="text-gray-700">
                {user?.nickname || user?.email}
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-200 rounded-md"
              >
                退出
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-700">
                登录
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md"
              >
                注册
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}



