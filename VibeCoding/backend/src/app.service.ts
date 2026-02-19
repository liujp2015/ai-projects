import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  constructor(private prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async resetDatabase() {
    this.logger.warn('Resetting database: deleting all records...');

    // Ensure new OCR columns exist on Document table (for environments where Prisma migrations/db push are not available)
    // This prevents runtime errors when Prisma Client selects these fields.
    await this.prisma.$executeRawUnsafe(`
      ALTER TABLE "Document"
        ADD COLUMN IF NOT EXISTS "originalText" TEXT,
        ADD COLUMN IF NOT EXISTS "chineseText"  TEXT,
        ADD COLUMN IF NOT EXISTS "englishText"  TEXT;
    `);
    
    // 按顺序删除以处理外键约束（由于启用了 Cascade，删除 Document 会级联删除 Paragraph/Sentence）
    // UserWord 与 Sentence 是可选关系，但也建议先清空
    await this.prisma.$transaction([
      this.prisma.userWord.deleteMany(),
      this.prisma.document.deleteMany(),
    ]);

    this.logger.log('Database reset successful.');
    return { message: 'Database reset successful', timestamp: new Date().toISOString() };
  }
}
