import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => QueueService))
    private queueService: QueueService,
  ) {}

  async create(createProductDto: CreateProductDto) {
    return this.prisma.product.create({
      data: createProductDto,
      include: {
        brand: true,
        category: true,
      },
    });
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: {
      brandId?: string;
      categoryId?: string;
      platform?: string;
      isHidden?: boolean;
      search?: string;
    },
    sortBy?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters?.brandId) where.brandId = filters.brandId;
    if (filters?.categoryId) where.categoryId = filters.categoryId;
    if (filters?.platform) where.platform = filters.platform;
    if (filters?.isHidden !== undefined) where.isHidden = filters.isHidden;
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { keywords: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    if (sortBy === 'price') {
      orderBy.discountPrice = 'asc';
    } else if (sortBy === 'time') {
      orderBy.createdAt = 'desc';
    } else {
      orderBy.isTop = 'desc';
      orderBy.sortOrder = 'asc';
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          brand: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        brand: true,
        category: true,
      },
    });

    if (!product) {
      throw new NotFoundException('商品不存在');
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('商品不存在');
    }

    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
      include: {
        brand: true,
        category: true,
      },
    });
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('商品不存在');
    }

    await this.prisma.product.delete({ where: { id } });
    return { message: '商品已删除' };
  }

  async push(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('商品不存在');
    }

    // 添加到推送队列
    await this.queueService.addToQueue(id);
    return { message: '商品已添加到推送队列' };
  }

  async getRecommendations(productId: string, limit: number = 10) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('商品不存在');
    }

    return this.prisma.product.findMany({
      where: {
        AND: [
          { id: { not: productId } },
          { isHidden: false },
          {
            OR: [
              { categoryId: product.categoryId },
              { brandId: product.brandId },
            ],
          },
        ],
      },
      take: limit,
      include: {
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        isTop: 'desc',
      },
    });
  }
}
