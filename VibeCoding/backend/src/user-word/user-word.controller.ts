import { Controller, Post, Get, Patch, Delete, Body, Param } from '@nestjs/common';
import { UserWordService } from './user-word.service';

@Controller('user-words')
export class UserWordController {
  constructor(private readonly userWordService: UserWordService) {}

  @Post()
  async upsert(
    @Body('word') word: string,
    @Body('status') status?: string,
    @Body('sourceSentenceId') sourceSentenceId?: string,
    @Body('translation') translation?: string,
    @Body('definition') definition?: string,
  ) {
    return this.userWordService.upsert(word, status, sourceSentenceId, translation, definition);
  }

  @Get()
  async findAll() {
    return this.userWordService.findAll();
  }

  @Get(':word')
  async findByWord(@Param('word') word: string) {
    return this.userWordService.findByWord(word);
  }

  @Post('fill-translations')
  async fillMissing() {
    return this.userWordService.fillMissingTranslations();
  }

  @Get('review/queue')
  async getReviewQueue() {
    return this.userWordService.getReviewQueue();
  }

  @Post('review/submit')
  async submitReview(
    @Body('word') word: string,
    @Body('quality') quality: number,
  ) {
    return this.userWordService.submitReview(word, quality);
  }

  @Patch(':word/status')
  async updateStatus(
    @Param('word') word: string,
    @Body('status') status: string,
  ) {
    return this.userWordService.updateStatus(word, status);
  }

  @Patch(':word/category')
  async updateCategory(
    @Param('word') word: string,
    @Body('category') category: string | null,
  ) {
    return this.userWordService.updateCategory(word, category);
  }

  @Delete(':word')
  async remove(@Param('word') word: string) {
    return this.userWordService.remove(word);
  }
}

