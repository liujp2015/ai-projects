"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import apiClient from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";

// 生成UUID的简单函数
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [product, setProduct] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadProduct();
      loadRecommendations();
    }
  }, [params.id]);

  const loadProduct = async () => {
    try {
      const response = await apiClient.get(`/products/${params.id}`);
      setProduct(response.data);
    } catch (error) {
      console.error("加载商品失败", error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      const response = await apiClient.get(
        `/products/${params.id}/recommendations`
      );
      setRecommendations(response.data || []);
    } catch (error) {
      console.error("加载推荐商品失败", error);
    }
  };

  const handleBuy = async () => {
    if (!product) return;
    
    // 生成clickId
    const clickId = generateUUID();
    
    // 如果用户已登录，保存clickId到数据库
    if (isAuthenticated) {
      try {
        await apiClient.post("/click-records", {
          productId: product.id,
          clickId,
        });
      } catch (error) {
        console.error("保存clickId失败", error);
      }
    }
    
    // 跳转到商品链接，附加clickId参数
    const url = new URL(product.link);
    url.searchParams.set("clickId", clickId);
    window.open(url.toString(), "_blank");
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">加载中...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div>
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          商品不存在
        </div>
      </div>
    );
  }

  const discount = Math.round(
    ((product.originalPrice - product.discountPrice) / product.originalPrice) *
      100
  );

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-200 aspect-square rounded-lg">
            {/* 商品图片占位 */}
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-4">{product.title}</h1>
            {product.brand && (
              <p className="text-gray-600 mb-4">品牌：{product.brand.name}</p>
            )}
            {product.category && (
              <p className="text-gray-600 mb-4">
                分类：{product.category.name}
              </p>
            )}
            <div className="mb-4">
              <span className="text-4xl font-bold text-red-600">
                ¥{product.discountPrice.toFixed(2)}
              </span>
              <span className="text-xl text-gray-400 line-through ml-4">
                ¥{product.originalPrice.toFixed(2)}
              </span>
              <span className="ml-4 px-3 py-1 bg-red-100 text-red-600 rounded">
                {discount}% OFF
              </span>
            </div>
            {product.description && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">商品描述</h3>
                <p className="text-gray-700">{product.description}</p>
              </div>
            )}
            <button
              onClick={handleBuy}
              className="w-full py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-lg font-semibold"
            >
              去购买
            </button>
          </div>
        </div>

        {recommendations.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">推荐商品</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendations.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
