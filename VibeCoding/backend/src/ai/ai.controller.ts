import { Controller, Post, Body, UseInterceptors, UploadedFiles } from '@nestjs/common';
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
}

