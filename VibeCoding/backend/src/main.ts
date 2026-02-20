import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true, // 允许所有来源
    credentials: true, // 允许携带凭证
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // 允许的 HTTP 方法
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'], // 允许的请求头
    exposedHeaders: ['Content-Type', 'Content-Length'], // 暴露的响应头
    maxAge: 86400, // 预检请求缓存时间（24小时）
  });

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
