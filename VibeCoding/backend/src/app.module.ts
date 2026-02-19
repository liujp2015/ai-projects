import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { DocumentModule } from './document/document.module';
import { DictionaryModule } from './dictionary/dictionary.module';
import { UserWordModule } from './user-word/user-word.module';
import { TTSModule } from './tts/tts.module';
import { ExerciseModule } from './exercise/exercise.module';
import { SentenceBuilderModule } from './sentence-builder/sentence-builder.module';

@Module({
  imports: [
    PrismaModule,
    DocumentModule,
    DictionaryModule,
    UserWordModule,
    TTSModule,
    ExerciseModule,
    SentenceBuilderModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
