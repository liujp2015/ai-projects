import { Module } from '@nestjs/common';
import { OCRService } from './ocr.service';
import { AIService } from './ai.service';
import { AIController } from './ai.controller';

@Module({
  controllers: [AIController],
  providers: [OCRService, AIService],
  exports: [OCRService, AIService],
})
export class AIModule {}



