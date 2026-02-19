import { Controller, Get, Query, Res } from '@nestjs/common';
import { TTSService } from './tts.service';
import type { Response } from 'express';

@Controller('tts')
export class TTSController {
  constructor(private readonly ttsService: TTSService) {}

  @Get('stream')
  async streamAudio(@Query('text') text: string, @Res() res: Response) {
    if (!text) {
      return res.status(400).send('Text is required');
    }

    try {
      const buffer = await this.ttsService.getAudioStream(text);
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length,
      });
      res.send(buffer);
    } catch (error) {
      res.status(500).send('Failed to generate audio');
    }
  }
}

