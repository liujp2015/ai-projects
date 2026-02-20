import { Body, Controller, Delete, Get, Post, Query, Param } from '@nestjs/common';
import { SentenceBuilderService, SceneLexicon } from './sentence-builder.service';

@Controller('sentence-builder')
export class SentenceBuilderController {
  constructor(private readonly service: SentenceBuilderService) {}

  @Post('scene')
  async getSceneLexicon(
    @Body()
    body: { scene: string; word?: string; language?: string; targetUserLevel?: string },
  ): Promise<SceneLexicon> {
    const { scene, word, targetUserLevel = 'A2' } = body;
    return this.service.generateSceneLexicon(scene, targetUserLevel, word);
  }

  @Post('evaluate')
  async evaluate(
    @Body()
    body: {
      scene: string;
      word?: string;
      sentence: string;
      userLevel?: string;
    },
  ) {
    const { scene, word, sentence, userLevel = 'A2' } = body;
    return this.service.evaluateSentence({ scene, word, sentence, userLevel });
  }

  @Post('next-token')
  async nextToken(
    @Body()
    body: {
      scene: string;
      currentTokens: any[];
      allOptions: SceneLexicon;
    },
  ) {
    return this.service.suggestNextTokens(body);
  }

  @Post('saved')
  async save(
    @Body()
    body: { word: string; scene: string; sentence: string; source?: 'USER' | 'SUGGESTED' | 'EVAL' | string },
  ) {
    return this.service.saveSentence(body);
  }

  @Get('saved')
  async list(@Query('word') word: string, @Query('scene') scene?: string) {
    return this.service.listSavedSentences({ word, scene });
  }

  @Delete('saved/:id')
  async remove(@Param('id') id: string) {
    return this.service.deleteSavedSentence(id);
  }
}


