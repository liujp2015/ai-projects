import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AIService } from './ai.service';

@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('validate-sentence')
  async validate(
    @Body('word') word: string,
    @Body('scenario') scenario: string,
    @Body('sentence') sentence: string,
  ) {
    return this.aiService.validateSentence(word, scenario, sentence);
  }

  @Post('qwen-images-parse')
  @UseInterceptors(FilesInterceptor('files'))
  async qwenImagesParse(@UploadedFiles() files: Express.Multer.File[]) {
    return this.aiService.parseImagesWithQwenVL(files);
  }

  @Post('sentence-pattern-training')
  async sentencePatternTraining(
    @Body('sentence') sentence: string,
    @Body('scenario') scenario: string,
    @Body('documentId') documentId?: string,
  ) {
    if (!sentence?.trim()) {
      throw new BadRequestException('sentence 不能为空');
    }
    if (!scenario?.trim()) {
      throw new BadRequestException('scenario 不能为空');
    }

    const items = await this.aiService.generateSentencePatternTraining(
      sentence.trim(),
      scenario.trim(),
    );

    await this.aiService.saveSentencePatternTrainingHistory({
      documentId,
      sourceSentence: sentence.trim(),
      scenario: scenario.trim(),
      items,
    });

    return {
      sentence: sentence.trim(),
      scenario: scenario.trim(),
      items,
      count: items.length,
    };
  }

  @Get('sentence-pattern-training-history')
  async sentencePatternTrainingHistory(
    @Query('documentId') documentId?: string,
    @Query('sentence') sentence?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = Number(limit);

    const items = await this.aiService.getSentencePatternTrainingHistory({
      documentId,
      sourceSentence: sentence,
      limit: Number.isFinite(parsedLimit) ? parsedLimit : 20,
    });

    return {
      items,
      count: items.length,
    };
  }
}
