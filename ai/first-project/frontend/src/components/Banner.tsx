"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api/client";

export default function Banner() {
  const [banners, setBanners] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    apiClient
      .get("/banners", { params: { activeOnly: true } })
      .then((response) => {
        const data = response?.data;
        // 后端返回非数组时兜底为空数组，避免 map 报错
        setBanners(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setBanners([]);
      });
  }, []);

  useEffect(() => {
    if (banners.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [banners.length]);

  if (banners.length === 0) return null;

  return (
    <div className="relative w-full h-64 md:h-96 overflow-hidden">
      {(banners || []).map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-500 ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <a href={banner.link || "#"}>
            <img
              src={banner.imageUrl}
              alt={banner.title || ""}
              className="w-full h-full object-cover"
            />
          </a>
        </div>
      ))}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full ${
                index === currentIndex ? "bg-white" : "bg-gray-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
