import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SentenceBuilderService } from './sentence-builder.service';
import { SentenceBuilderController } from './sentence-builder.controller';

@Module({
  imports: [PrismaModule],
  providers: [SentenceBuilderService],
  controllers: [SentenceBuilderController],
})
export class SentenceBuilderModule {}


