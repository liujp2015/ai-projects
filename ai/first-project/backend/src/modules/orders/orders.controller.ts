import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.ordersService.findAll(paginationDto.page, paginationDto.limit);
  }

  @Public()
  @Post('sync')
  syncOrder(@Body() data: {
    orderNumber: string;
    clickId?: string;
    platform: string;
    amount: number;
    status: string;
    productId?: string;
  }) {
    return this.ordersService.syncOrder(data);
  }
}
