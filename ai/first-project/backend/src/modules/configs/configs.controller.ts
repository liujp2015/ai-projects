import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ConfigsService } from './configs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('configs')
@UseGuards(JwtAuthGuard)
export class ConfigsController {
  constructor(private readonly configsService: ConfigsService) {}

  @Get()
  findAll() {
    return this.configsService.findAll();
  }

  @Get(':key')
  findOne(@Param('key') key: string) {
    return this.configsService.findOne(key);
  }

  @Put(':key')
  update(@Param('key') key: string, @Body('value') value: string) {
    return this.configsService.update(key, value);
  }
}



