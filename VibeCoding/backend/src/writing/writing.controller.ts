import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AnalyzeDto } from './dto/analyze.dto';
import { StartSessionDto } from './dto/start-session.dto';
import { NextStepDto } from './dto/next-step.dto';
import { WritingService } from './writing.service';

@Controller('writing')
export class WritingController {
  constructor(private readonly writingService: WritingService) {}

  @Post('analyze')
  async analyze(@Body() body: AnalyzeDto) {
    const originalText = String(body?.originalText ?? '').trim();
    if (!originalText) throw new BadRequestException('originalText 不能为空');
    if (originalText.length < 20) throw new BadRequestException('originalText 太短，请至少输入一个完整段落');
    if (originalText.length > 6000) throw new BadRequestException('originalText 过长，请控制在 6000 字符以内');

    return this.writingService.analyze(originalText);
  }

  @Post('start-session')
  async startSession(@Body() body: StartSessionDto) {
    const originalText = String(body?.originalText ?? '').trim();
    const newTheme = String(body?.newTheme ?? '').trim();

    if (!originalText) throw new BadRequestException('originalText 不能为空');
    if (!newTheme) throw new BadRequestException('newTheme 不能为空');

    return this.writingService.startSession(originalText, newTheme);
  }

  @Post('next-step')
  async nextStep(@Body() body: NextStepDto) {
    const sessionId = String(body?.sessionId ?? '').trim();
    const userInput = String(body?.userInput ?? '').trim();

    if (!sessionId) throw new BadRequestException('sessionId 不能为空');
    if (!userInput) throw new BadRequestException('userInput 不能为空');

    return this.writingService.nextStep(sessionId, userInput);
  }

  @Get('next-step/stream')
  async nextStepStream(
    @Query('sessionId') sessionId: string,
    @Query('userInput') userInput: string,
    @Res() res: Response,
  ) {
    const sid = String(sessionId ?? '').trim();
    const input = String(userInput ?? '').trim();

    if (!sid || !input) {
      throw new BadRequestException('sessionId 和 userInput 不能为空');
    }

    const result = this.writingService.nextStep(sid, input);

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    const emit = (event: string, data: unknown) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const prompt = String(result.nextPrompt ?? '');
    for (const ch of prompt) {
      emit('guidance_token', { token: ch });
    }

    emit('review_result', result.review);
    emit('step_advanced', {
      currentStepIndex: result.currentStepIndex,
      done: result.done,
    });

    if (result.done) {
      emit('session_completed', { done: true });
    }

    res.end();
  }

  @Get('session/:id')
  async getSession(@Param('id') id: string) {
    const sessionId = String(id ?? '').trim();
    if (!sessionId) throw new BadRequestException('session id 不能为空');
    return this.writingService.getSession(sessionId);
  }
}
