import { Controller, Get, Query, Res, Logger } from '@nestjs/common';
import { TTSService } from './tts.service';
import type { Response } from 'express';

@Controller('tts')
export class TTSController {
  private readonly logger = new Logger(TTSController.name);

  constructor(private readonly ttsService: TTSService) {}

  @Get('stream')
  async streamAudio(@Query('text') text: string, @Res() res: Response) {
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    try {
      this.logger.log(`TTS request for text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
      const buffer = await this.ttsService.getAudioStream(text);
      
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=3600',
      });
      res.send(buffer);
    } catch (error: any) {
      this.logger.error(`TTS generation failed: ${error?.message || error}`, error?.stack);
      res.status(500).json({ 
        error: 'Failed to generate audio',
        message: error?.message || 'Unknown error'
      });
    }
  }
}

