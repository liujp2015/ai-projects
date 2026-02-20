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
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @Public()
  findAll(
    @Query() paginationDto: PaginationDto,
    @Query('brandId') brandId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('platform') platform?: string,
    @Query('isHidden') isHidden?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    return this.productsService.findAll(
      paginationDto.page,
      paginationDto.limit,
      {
        brandId,
        categoryId,
        platform,
        isHidden: isHidden === 'true',
        search,
      },
      sortBy,
    );
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Get(':id/recommendations')
  @Public()
  getRecommendations(@Param('id') id: string, @Query('limit') limit?: string) {
    return this.productsService.getRecommendations(id, limit ? parseInt(limit) : 10);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/push')
  push(@Param('id') id: string) {
    return this.productsService.push(id);
  }
}
