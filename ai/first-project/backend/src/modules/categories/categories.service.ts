import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const categories = await this.prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: true,
      },
      orderBy: { sortOrder: 'asc' },
    });
    return categories;
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { parent: true, children: true },
    });
    if (!category) {
      throw new NotFoundException('分类不存在');
    }
    return category;
  }

  async create(data: { name: string; description?: string; parentId?: string; sortOrder?: number }) {
    return this.prisma.category.create({ data });
  }

  async update(id: string, data: { name?: string; description?: string; parentId?: string; sortOrder?: number }) {
    return this.prisma.category.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.prisma.category.delete({ where: { id } });
    return { message: '分类已删除' };
  }
}
