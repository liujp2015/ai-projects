'use client';

import './globals.css';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useWebSocket();

  return (
    <html lang="zh-CN">
      <head>
        <title>返利折扣网</title>
        <meta name="description" content="返利折扣网 - 精选优惠商品" />
      </head>
      <body>{children}</body>
    </html>
  );
}

