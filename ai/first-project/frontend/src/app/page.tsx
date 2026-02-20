"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Banner from "@/components/Banner";
import ProductCard from "@/components/ProductCard";
import apiClient from "@/lib/api/client";

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadProducts();
  }, [page]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/products", {
        params: { page, limit: 12, isHidden: false },
      });
      // 后端有统一响应包装 { code, message, data }
      const list =
        response?.data?.data ?? // 兼容 { data: { data: [...] } }
        response?.data ?? // 兼容 { data: [...] }
        [];
      setProducts(list);
    } catch (error) {
      console.error("加载商品失败", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <Banner />
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">热门商品</h2>
        {loading ? (
          <div className="text-center py-8">加载中...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        <div className="mt-8 text-center">
          <button
            onClick={() => setPage(page + 1)}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            加载更多
          </button>
        </div>
      </main>
    </div>
  );
}
