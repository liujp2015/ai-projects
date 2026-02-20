import 'dotenv/config';
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
  if (cachedExpressApp) return cachedExpressApp;

  const expressApp = express();
  const nestApp = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
    logger: ['error', 'warn', 'log'],
  });

  nestApp.enableCors({
    origin: true,
    credentials: true,
  });

  await nestApp.init();

  cachedExpressApp = expressApp;
  return expressApp;
}



