'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { wsClient } from '@/lib/websocket/client';

export function useWebSocket() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = typeof window !== 'undefined' 
    ? localStorage.getItem('accessToken') 
    : null;

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      wsClient.connect(accessToken);

      const handleProductPush = (event: CustomEvent) => {
        // 显示通知
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('新商品推送', {
            body: event.detail.title,
            icon: '/icon.png',
          });
        }
      };

      window.addEventListener('productPush', handleProductPush as EventListener);

      return () => {
        window.removeEventListener('productPush', handleProductPush as EventListener);
        wsClient.disconnect();
      };
    }
  }, [isAuthenticated, accessToken]);
}



