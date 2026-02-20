import type { IncomingMessage, ServerResponse } from 'http';
import { getServerlessExpressApp } from '../src/server';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    const app = await getServerlessExpressApp();
    // Express instance is a function (req, res) => void
    return app(req, res);
  } catch (error: any) {
    console.error('Serverless Function Error:', error);
    if (!res.headersSent) {
      // 确保错误响应也包含 CORS 头
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: 'Internal Server Error',
        message: error?.message || 'Unknown error',
      }));
    }
  }
}



