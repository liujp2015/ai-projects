import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ClickRecordsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, productId: string, clickId: string) {
    return this.prisma.clickRecord.create({
      data: {
        userId,
        productId,
        clickId,
      },
    });
  }

  async findByClickId(clickId: string) {
    return this.prisma.clickRecord.findUnique({
      where: { clickId },
      include: {
        user: true,
        product: true,
      },
    });
  }
}

