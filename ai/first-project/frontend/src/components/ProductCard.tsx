'use client';

import Link from 'next/link';

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    originalPrice: number;
    discountPrice: number;
    brand?: { name: string };
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const discount = Math.round(
    ((product.originalPrice - product.discountPrice) / product.originalPrice) *
      100
  );

  return (
    <Link href={`/products/${product.id}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        <div className="aspect-w-16 aspect-h-9 bg-gray-200">
          {/* 商品图片占位 */}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">
            {product.title}
          </h3>
          {product.brand && (
            <p className="text-sm text-gray-500 mb-2">{product.brand.name}</p>
          )}
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-red-600">
              ¥{product.discountPrice.toFixed(2)}
            </span>
            <span className="text-sm text-gray-400 line-through">
              ¥{product.originalPrice.toFixed(2)}
            </span>
            <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded">
              {discount}% OFF
            </span>
          </div>
          <button className="mt-4 w-full py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            去购买
          </button>
        </div>
      </div>
    </Link>
  );
}



