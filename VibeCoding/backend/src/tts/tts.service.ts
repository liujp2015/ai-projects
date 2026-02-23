import { Injectable, Logger } from '@nestjs/common';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'edge-tts-node';

@Injectable()
export class TTSService {
  private readonly logger = new Logger(TTSService.name);
  private tts: MsEdgeTTS | null = null;
  private initialized = false;
  private initializing = false;
  private initAttempts = 0;
  private readonly maxInitAttempts = 3;

  constructor() {
    // 延迟初始化，不在构造函数中创建 TTS 实例
    // 这样可以避免阻塞应用启动
  }

  /**
   * 延迟初始化 TTS 服务（在第一次使用时初始化）
   */
  private async ensureInitialized(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }

    if (this.initializing) {
      // 如果正在初始化，等待完成
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.initialized || (!this.initializing && this.initAttempts >= this.maxInitAttempts)) {
            clearInterval(checkInterval);
            resolve(this.initialized);
          }
        }, 100);
      });
    }

    if (this.initAttempts >= this.maxInitAttempts) {
      this.logger.warn('TTS initialization failed after multiple attempts, giving up');
      return false;
    }

    this.initializing = true;
    this.initAttempts++;

    try {
      // 创建 TTS 实例
      if (!this.tts) {
        this.tts = new MsEdgeTTS({});
      }

      // 测试初始化
      const testVoice = 'en-US-AndrewMultilingualNeural';
      await this.tts.setMetadata(testVoice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
      
      this.initialized = true;
      this.initializing = false;
      this.logger.log('TTS service initialized successfully');
      return true;
    } catch (error: any) {
      this.initializing = false;
      const errorMsg = error?.message || String(error);
      
      // 检查是否是连接错误
      if (errorMsg.includes('Connect') || errorMsg.includes('network') || errorMsg.includes('ECONNREFUSED')) {
        this.logger.warn(
          `TTS initialization failed (attempt ${this.initAttempts}/${this.maxInitAttempts}): Network connection issue. ` +
          `This may be due to firewall, proxy, or network restrictions. ` +
          `TTS will be retried on next request.`
        );
      } else {
        this.logger.error(`TTS initialization failed (attempt ${this.initAttempts}/${this.maxInitAttempts}): ${errorMsg}`, error?.stack);
      }
      
      // 如果失败，清理实例以便下次重试
      this.tts = null;
      return false;
    }
  }

  async getAudioStream(text: string, voice: string = 'en-US-AndrewMultilingualNeural') {
    if (!text || !text.trim()) {
      throw new Error('Text is required and cannot be empty');
    }

    // 尝试初始化（如果尚未初始化）
    const isReady = await this.ensureInitialized();
    if (!isReady || !this.tts) {
      throw new Error(
        'TTS service is not available. This may be due to network connectivity issues. ' +
        'Please check your internet connection and firewall settings.'
      );
    }

    try {
      this.logger.log(`Synthesizing text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}" with voice: ${voice}`);
      
      // Configure TTS
      await this.tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
      
      // Get audio data as buffer
      const stream = this.tts.toStream(text);

      const buffer: Buffer = await new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        let hasError = false;

        stream.on('data', (chunk: Buffer) => {
          if (!hasError) {
            chunks.push(Buffer.from(chunk));
          }
        });

        stream.on('end', () => {
          if (!hasError) {
            resolve(Buffer.concat(chunks));
          }
        });

        stream.on('error', (err: Error) => {
          hasError = true;
          this.logger.error(`TTS stream error: ${err.message}`, err.stack);
          reject(err);
        });

        // Add timeout to prevent hanging
        setTimeout(() => {
          if (!hasError) {
            hasError = true;
            reject(new Error('TTS stream timeout'));
          }
        }, 30000); // 30 seconds timeout
      });

      if (buffer.length === 0) {
        throw new Error('Generated audio buffer is empty');
      }

      this.logger.log(`TTS synthesis successful, buffer size: ${buffer.length} bytes`);
      return buffer;
    } catch (error: any) {
      this.logger.error(`TTS synthesis failed: ${error?.message || error}`, error?.stack);
      throw error;
    }
  }
}

