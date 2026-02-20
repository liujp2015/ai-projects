import { Injectable, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { RebateWebSocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class QueueService implements OnModuleInit {
  private redis: Redis;
  private readonly queueKey = 'product:push:queue';

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    @Inject(forwardRef(() => RebateWebSocketGateway))
    private webSocketGateway: RebateWebSocketGateway,
  ) {
    try {
      this.redis = new Redis({
        host: this.configService.get<string>('REDIS_HOST') || 'localhost',
        port: parseInt(this.configService.get<string>('REDIS_PORT') || '6379'),
        password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
        retryStrategy: () => null, // 禁用自动重连，避免启动阻塞
        lazyConnect: true, // 延迟连接
      });
    } catch (error) {
      console.warn('Redis初始化失败，队列功能将不可用:', error.message);
      this.redis = null as any;
    }
  }

  async onModuleInit() {
    // 尝试连接Redis
    if (this.redis) {
      try {
        await this.redis.connect();
        this.processQueue();
      } catch (error) {
        console.warn('Redis连接失败，队列功能将不可用:', error.message);
      }
    }
  }

  async addToQueue(productId: string, targetUsers?: string[]) {
    if (!this.redis) {
      console.warn('Redis未连接，无法添加到队列');
      return;
    }
    const task = {
      productId,
      pushTime: Date.now(),
      targetUsers,
    };
    await this.redis.lpush(this.queueKey, JSON.stringify(task));
  }

  private async processQueue() {
    if (!this.redis) {
      console.warn('Redis未连接，队列处理功能不可用');
      return;
    }
    setInterval(async () => {
      try {
        if (!this.redis) return;
        const taskStr = await this.redis.rpop(this.queueKey);
        if (taskStr) {
          const task = JSON.parse(taskStr);
          await this.handlePushTask(task);
        }
      } catch (error) {
        console.error('处理队列任务失败:', error);
      }
    }, 1000);
  }

  private async handlePushTask(task: any) {
    try {
      // 获取商品信息
      const product = await this.prisma.product.findUnique({
        where: { id: task.productId },
        include: {
          brand: true,
          category: true,
        },
      });

      if (!product || product.isHidden) {
        return;
      }

      // 如果指定了目标用户，只推送给这些用户
      if (task.targetUsers && task.targetUsers.length > 0) {
        // TODO: 推送给指定用户
      } else {
        // 推送给所有在线用户
        await this.webSocketGateway.pushProduct(product);
      }
    } catch (error) {
      console.error('处理推送任务失败:', error);
    }
  }
}
