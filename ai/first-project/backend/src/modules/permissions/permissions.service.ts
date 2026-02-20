import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.permission.findMany();
  }

  async create(data: { name: string; code: string; module: string; description?: string }) {
    return this.prisma.permission.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.permission.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.prisma.permission.delete({ where: { id } });
    return { message: '权限已删除' };
  }
}
