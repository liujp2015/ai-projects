import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
  Query,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { DocumentService } from './document.service';

@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title?: string,
  ) {
    return this.documentService.parseAndSaveDocument(file, title ?? file.originalname);
  }

  @Post('upload-images')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('title') title?: string,
  ) {
    return this.documentService.parseAndSaveImages(files, title || `Image Group ${new Date().toLocaleDateString()}`);
  }

  @Post('manual')
  async createManual(
    @Body('title') title: string,
    @Body('content') content: string,
  ) {
    return this.documentService.saveRawText(content, title || 'Untitled Text');
  }

  @Get()
  async findAll() {
    return this.documentService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.documentService.findOne(id);
  }

  @Post(':id/translate/missing')
  async translateMissing(@Param('id') id: string) {
    return this.documentService.translateMissingSentences(id);
  }

  @Post(':id/translate/align-rebuild')
  async translateAlignRebuild(@Param('id') id: string) {
    return this.documentService.translateAlignRebuild(id);
  }

  @Get(':id/translation')
  async getTranslation(@Param('id') id: string) {
    return this.documentService.getDocumentTranslation(id);
  }

  @Post(':id/questions/generate')
  async generateQuestions(
    @Param('id') id: string,
    @Body('force') force?: boolean,
  ) {
    return this.documentService.generateQuestions(id, force);
  }

  @Post(':id/append-text')
  async appendText(
    @Param('id') id: string,
    @Body('text') text: string,
  ) {
    return this.documentService.appendText(id, text);
  }

  @Post(':id/append-images')
  @UseInterceptors(FilesInterceptor('files'))
  async appendImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.documentService.appendImages(id, files);
  }

  @Get(':id/questions')
  async getQuestions(
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    return this.documentService.getQuestions(id, limit ? parseInt(limit) : 20);
  }
}

