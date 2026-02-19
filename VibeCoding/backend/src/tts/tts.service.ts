import { Injectable, Logger } from '@nestjs/common';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'edge-tts-node';

@Injectable()
export class TTSService {
  private readonly logger = new Logger(TTSService.name);
  private tts: MsEdgeTTS;

  constructor() {
    this.tts = new MsEdgeTTS({});
  }

  async getAudioStream(text: string, voice: string = 'en-US-AndrewMultilingualNeural') {
    try {
      this.logger.log(`Synthesizing text: "${text.substring(0, 20)}..." with voice: ${voice}`);
      
      // Configure TTS
      await this.tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
      
      // Get audio data as buffer
      const stream = this.tts.toStream(text);

      const buffer: Buffer = await new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });

      return buffer;
    } catch (error) {
      this.logger.error(`TTS synthesis failed: ${error.message}`);
      throw error;
    }
  }
}

