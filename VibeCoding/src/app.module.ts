import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { DocumentModule } from './document/document.module';
import { DocumentController } from './document.controller';
import { PrismaModule } from './prisma/prisma.module';
import { DictionaryModule } from './dictionary/dictionary.module';

@Module({
  imports: [DocumentModule, PrismaModule, DictionaryModule],
  controllers: [AppController, DocumentController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
