import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class BannersService {
  constructor(private prisma: PrismaService) {}

  async findAll(activeOnly: boolean = false) {
    const where = activeOnly ? { isActive: true } : {};
    return this.prisma.banner.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });
  }

  async create(data: { title?: string; imageUrl: string; link?: string; sortOrder?: number }) {
    return this.prisma.banner.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.banner.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.prisma.banner.delete({ where: { id } });
    return { message: 'Banner已删除' };
  }
}
