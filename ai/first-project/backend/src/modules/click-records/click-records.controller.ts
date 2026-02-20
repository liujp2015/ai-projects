import { Controller, Post, Body, UseGuards, Get, Param } from '@nestjs/common';
import { ClickRecordsService } from './click-records.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('click-records')
export class ClickRecordsController {
  constructor(private readonly clickRecordsService: ClickRecordsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser() user: any,
    @Body() body: { productId: string; clickId: string },
  ) {
    return this.clickRecordsService.create(
      user.id,
      body.productId,
      body.clickId,
    );
  }

  @Get(':clickId')
  @Public()
  async findByClickId(@Param('clickId') clickId: string) {
    return this.clickRecordsService.findByClickId(clickId);
  }
}

