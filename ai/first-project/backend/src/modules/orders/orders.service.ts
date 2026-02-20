import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ClickRecordsService } from '../click-records/click-records.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private clickRecordsService: ClickRecordsService,
  ) {}

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              nickname: true,
            },
          },
          product: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async syncOrder(data: {
    orderNumber: string;
    clickId?: string;
    platform: string;
    amount: number;
    status: string;
    productId?: string;
  }) {
    let userId = null;
    if (data.clickId) {
      const clickRecord = await this.clickRecordsService.findByClickId(data.clickId);
      if (clickRecord) {
        userId = clickRecord.userId;
        // 如果订单成功，赠送积分
        if (data.status === 'completed' && userId) {
          await this.addOrderPoints(userId, data.amount);
        }
      }
    }

    return this.prisma.order.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  private async addOrderPoints(userId: string, amount: number) {
    // 获取订单积分配置
    const config = await this.prisma.siteConfig.findUnique({
      where: { key: 'order_points' },
    });
    const pointsPerYuan = parseInt(config?.value || '0');
    const points = Math.floor(amount * pointsPerYuan);

    if (points > 0) {
      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: userId },
          data: {
            totalPoints: { increment: points },
            remainingPoints: { increment: points },
          },
        }),
        this.prisma.pointRecord.create({
          data: {
            userId,
            points,
            type: 'order',
            description: `订单奖励积分`,
          },
        }),
      ]);
    }
  }
}
