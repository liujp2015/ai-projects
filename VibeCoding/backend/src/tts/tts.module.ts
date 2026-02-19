import { Module } from '@nestjs/common';
import { TTSService } from './tts.service';
import { TTSController } from './tts.controller';

@Module({
  controllers: [TTSController],
  providers: [TTSService],
  exports: [TTSService],
})
export class TTSModule {}

