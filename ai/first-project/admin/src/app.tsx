import { RequestConfig } from '@umijs/max';

export const request: RequestConfig = {
  timeout: 10000,
  baseURL: process.env.API_BASE_URL || 'http://localhost:3000/api',
  errorConfig: {
    errorHandler: (error: any) => {
      console.error('Request error:', error);
    },
  },
  requestInterceptors: [
    (config: any) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
  ],
};



