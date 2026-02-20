// Only load dotenv in non-production environments (Vercel provides env vars automatically)
if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv/config');
  } catch (e) {
    // dotenv not available, skip
  }
}

import express, { type Express } from 'express';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';

let cachedExpressApp: Express | null = null;

/**
 * Create (and cache) a NestJS app mounted on an Express instance.
 * This is used for serverless runtimes (e.g. Vercel) where we must NOT call app.listen().
 */
export async function getServerlessExpressApp(): Promise<Express> {
  if (cachedExpressApp) {
    return cachedExpressApp;
  }

  try {
    console.log('Initializing NestJS app for serverless...');
    const expressApp = express();
    const nestApp = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
      logger: ['error', 'warn', 'log'],
    });

    nestApp.enableCors({
      origin: true, // 允许所有来源
      credentials: true, // 允许携带凭证
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // 允许的 HTTP 方法
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'], // 允许的请求头
      exposedHeaders: ['Content-Type', 'Content-Length'], // 暴露的响应头
      maxAge: 86400, // 预检请求缓存时间（24小时）
    });

    await nestApp.init();
    console.log('NestJS app initialized successfully');

    cachedExpressApp = expressApp;
    return expressApp;
  } catch (error: any) {
    console.error('Failed to initialize NestJS app:', error);
    throw error;
  }
}



