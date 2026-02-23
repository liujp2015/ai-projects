import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ReviewService } from './review.service';

type GradeBody = {
  result: 'GOOD' | 'AGAIN';
};

@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  /**
   * 将指定 documentId 的 ExtractedWord 全量导入 ReviewCard（按 word + partOfSpeech 去重）
   */
  @Post('import/:documentId')
  async import(@Param('documentId') documentId: string) {
    return this.reviewService.importFromExtractedWords(documentId);
  }

  /**
   * 获取到期需要复习的卡片
   */
  @Get('due')
  async due(
    @Query('documentId') documentId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.reviewService.getDueCards(documentId, limit ?? 50);
  }

  /**
   * 复习判定（按 cardId）
   */
  @Post(':cardId/grade')
  async grade(@Param('cardId') cardId: string, @Body() body: GradeBody) {
    return this.reviewService.gradeCard(cardId, body.result);
  }

  /**
   * 获取复习摘要统计
   */
  @Get('summary')
  async summary(@Query('documentId') documentId: string) {
    return this.reviewService.getSummary(documentId);
  }
}
