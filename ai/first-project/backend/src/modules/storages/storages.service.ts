import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class StoragesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.storage.findMany();
  }

  async findOne(id: string) {
    return this.prisma.storage.findUnique({ where: { id } });
  }

  async create(data: any) {
    return this.prisma.storage.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.storage.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.prisma.storage.delete({ where: { id } });
    return { message: '存储配置已删除' };
  }
}
