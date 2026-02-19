import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      this.logger.log('Connecting to database...');
    await this.$connect();
      this.logger.log('Database connection established successfully.');
    } catch (error) {
      this.logger.error('Failed to connect to database:', error.message);
      if (process.env.DATABASE_URL?.startsWith('prisma://')) {
        this.logger.warn('Detected prisma:// protocol. Ensure Prisma Accelerate is configured correctly or use a direct PostgreSQL URL.');
      }
      // 不要在初始化时直接 crash 进程，允许服务启动以观察更多日志
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}



