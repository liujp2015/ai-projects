import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.usersService.findAll(
      paginationDto.page,
      paginationDto.limit,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post(':id/roles')
  assignRole(@Param('id') userId: string, @Body('roleId') roleId: string) {
    return this.usersService.assignRole(userId, roleId);
  }

  // 个人中心相关接口
  @Get('user/profile')
  getProfile(@CurrentUser() user: any) {
    return this.usersService.getProfile(user.id);
  }

  @Put('user/profile')
  updateProfile(
    @CurrentUser() user: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, updateProfileDto);
  }

  @Get('user/orders')
  getUserOrders(@CurrentUser() user: any, @Query() paginationDto: PaginationDto) {
    return this.usersService.getUserOrders(
      user.id,
      paginationDto.page,
      paginationDto.limit,
    );
  }

  @Get('user/orders/:id')
  getUserOrder(@CurrentUser() user: any, @Param('id') orderId: string) {
    // TODO: 实现获取单个订单详情
    return { message: '获取订单详情' };
  }
}
