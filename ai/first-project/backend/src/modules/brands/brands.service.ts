import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class BrandsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.brand.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) {
      throw new NotFoundException('品牌不存在');
    }
    return brand;
  }

  async create(data: { name: string; description?: string; logo?: string }) {
    return this.prisma.brand.create({ data });
  }

  async update(id: string, data: { name?: string; description?: string; logo?: string }) {
    return this.prisma.brand.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.prisma.brand.delete({ where: { id } });
    return { message: '品牌已删除' };
  }
}
