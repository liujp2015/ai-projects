import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { PrismaService } from '../../database/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RebateWebSocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private redis: Redis;
  private connectedUsers = new Map<string, Socket>();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    try {
      this.redis = new Redis({
        host: this.configService.get<string>('REDIS_HOST') || 'localhost',
        port: parseInt(this.configService.get<string>('REDIS_PORT') || '6379'),
        password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
        retryStrategy: () => null,
        lazyConnect: true,
      });
    } catch (error) {
      console.warn('Redis初始化失败，WebSocket功能将受限:', error.message);
      this.redis = null as any;
    }
  }

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // 从在线用户列表中移除
    for (const [userId, socket] of this.connectedUsers.entries()) {
      if (socket.id === client.id) {
        this.connectedUsers.delete(userId);
        if (this.redis) {
          await this.redis.srem('online:users', userId);
        }
        break;
      }
    }
  }

  @SubscribeMessage('auth')
  async handleAuth(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { token: string },
  ) {
    try {
      const payload = this.jwtService.verify(data.token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // 存储用户连接信息
      this.connectedUsers.set(payload.sub, client);
      if (this.redis) {
        await this.redis.sadd('online:users', payload.sub);
      }

      client.emit('auth_success', { userId: payload.sub });
    } catch (error) {
      client.emit('auth_failed', { message: '认证失败' });
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { timestamp: Date.now() });
  }

  // 推送商品到所有在线用户
  async pushProduct(product: any) {
    const productData = {
      id: product.id,
      title: product.title,
      discountPrice: product.discountPrice,
      originalPrice: product.originalPrice,
      link: product.link,
    };

    this.server.emit('product_push', productData);
  }
}
