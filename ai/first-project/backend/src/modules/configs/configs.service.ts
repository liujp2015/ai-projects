import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ConfigsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.siteConfig.findMany();
  }

  async findOne(key: string) {
    return this.prisma.siteConfig.findUnique({ where: { key } });
  }

  async update(key: string, value: string) {
    return this.prisma.siteConfig.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }
}
