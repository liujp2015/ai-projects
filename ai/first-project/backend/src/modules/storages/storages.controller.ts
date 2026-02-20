import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { StoragesService } from './storages.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('storages')
@UseGuards(JwtAuthGuard)
export class StoragesController {
  constructor(private readonly storagesService: StoragesService) {}

  @Get()
  findAll() {
    return this.storagesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.storagesService.findOne(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.storagesService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.storagesService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.storagesService.remove(id);
  }
}



