import { Module } from '@nestjs/common';
import { UserWordService } from './user-word.service';
import { UserWordController } from './user-word.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { DictionaryModule } from '../dictionary/dictionary.module';
import { SRSService } from './srs.service';

@Module({
  imports: [PrismaModule, DictionaryModule],
  controllers: [UserWordController],
  providers: [UserWordService, SRSService],
})
export class UserWordModule {}

