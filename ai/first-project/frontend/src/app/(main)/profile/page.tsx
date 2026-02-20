'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import apiClient from '@/lib/api/client';
import { useAuthStore } from '@/store/auth-store';

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadProfile();
    loadOrders();
  }, [isAuthenticated, router]);

  const loadProfile = async () => {
    try {
      const response = await apiClient.get('/user/profile');
      setProfile(response.data);
    } catch (error) {
      console.error('加载个人信息失败', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await apiClient.get('/user/orders', {
        params: { page: 1, limit: 10 },
      });
      setOrders(response.data?.data || []);
    } catch (error) {
      console.error('加载订单失败', error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await apiClient.put('/user/profile', {
        nickname: formData.get('nickname'),
      });
      alert('更新成功');
      loadProfile();
    } catch (error) {
      alert('更新失败');
    }
  };

  if (!isAuthenticated || loading) {
    return (
      <div>
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          加载中...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">个人中心</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center mb-4">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold">
                  {profile?.nickname || profile?.email}
                </h2>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>总积分：</span>
                  <span className="font-semibold">
                    {profile?.totalPoints || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>剩余积分：</span>
                  <span className="font-semibold">
                    {profile?.remainingPoints || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>余额：</span>
                  <span className="font-semibold">
                    ¥{profile?.balance?.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">个人信息</h2>
              <form onSubmit={handleUpdateProfile}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    昵称
                  </label>
                  <input
                    type="text"
                    name="nickname"
                    defaultValue={profile?.nickname || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  更新
                </button>
              </form>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">我的订单</h2>
              {orders.length === 0 ? (
                <p className="text-gray-500">暂无订单</p>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-gray-200 rounded p-4"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">
                            订单号：{order.orderNumber}
                          </p>
                          <p className="text-sm text-gray-600">
                            {order.product?.title || '-'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            ¥{order.amount.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-600">{order.status}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}



