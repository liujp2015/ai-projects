import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFiles,
  Body,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ConversationService } from './conversation.service';

@Controller('conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadConversation(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('title') title?: string,
  ) {
    if (!files || files.length === 0) {
      throw new Error('No files uploaded');
    }
    return this.conversationService.extractConversationFromImages(
      files,
      title,
    );
  }

  @Get()
  async findAll() {
    return this.conversationService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.conversationService.findOne(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.conversationService.delete(id);
  }
}
