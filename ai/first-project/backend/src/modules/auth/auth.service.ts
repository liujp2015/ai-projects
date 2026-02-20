import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Redis } from 'ioredis';

@Injectable()
export class AuthService {
  private redis: Redis;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
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
      console.warn('Redis初始化失败，验证码功能将不可用:', error.message);
      this.redis = null as any;
    }
  }

  async register(registerDto: RegisterDto) {
    const { email, password, code } = registerDto;

    // 验证验证码
    if (this.redis) {
      try {
        const storedCode = await this.redis.get(`verification:${email}`);
        if (!storedCode || storedCode !== code) {
          throw new BadRequestException('验证码无效或已过期');
        }
      } catch (error) {
        if (error instanceof BadRequestException) throw error;
        console.warn('Redis验证码验证失败:', error.message);
        // 开发环境允许跳过验证码验证
        if (process.env.NODE_ENV === 'production') {
          throw new BadRequestException('验证码服务不可用');
        }
      }
    } else {
      // 开发环境允许跳过验证码验证
      if (process.env.NODE_ENV === 'production') {
        throw new BadRequestException('验证码服务不可用');
      }
      console.warn('Redis未连接，跳过验证码验证（仅开发环境）');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('用户已存在');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    // 删除验证码
    if (this.redis) {
      try {
        await this.redis.del(`verification:${email}`);
      } catch (error) {
        console.warn('Redis删除验证码失败:', error.message);
      }
    }

    // 注册赠送积分
    const registerPoints = parseInt(
      (await this.getConfig('register_points')) || '0',
    );
    if (registerPoints > 0) {
      await this.addPoints(user.id, registerPoints, 'register', '注册赠送');
    }

    const tokens = await this.generateTokens(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
      },
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password, rememberMe } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    const tokens = await this.generateTokens(
      user.id,
      rememberMe ? '7d' : '1d',
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        isAdmin: user.isAdmin,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const tokenRecord = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });

      if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
        throw new UnauthorizedException('刷新令牌无效或已过期');
      }

      const newTokens = await this.generateTokens(payload.sub);

      return newTokens;
    } catch (error) {
      throw new UnauthorizedException('刷新令牌无效');
    }
  }

  async sendVerificationCode(email: string) {
    // 生成6位数字验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    // 存储到Redis，有效期5分钟
    await this.redis.setex(`verification:${email}`, 300, code);
    
    // TODO: 实际发送邮件
    console.log(`验证码已发送到 ${email}: ${code}`);
    
    return { message: '验证码已发送' };
  }

  private async generateTokens(userId: string, refreshExpiresIn?: string) {
    const accessToken = this.jwtService.sign(
      { sub: userId },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '1h',
      },
    );

    const refreshToken = this.jwtService.sign(
      { sub: userId },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn:
          refreshExpiresIn ||
          this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ||
          '7d',
      },
    );

    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '1h';
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    const refreshExpiresAt = new Date();
    if (refreshExpiresIn === '7d') {
      refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7);
    } else {
      refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 1);
    }

    await this.prisma.accessToken.create({
      data: {
        userId,
        token: accessToken,
        expiresAt,
      },
    });

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt: refreshExpiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private async addPoints(
    userId: string,
    points: number,
    type: string,
    description?: string,
  ) {
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
          type,
          description,
        },
      }),
    ]);
  }

  private async getConfig(key: string): Promise<string | null> {
    const config = await this.prisma.siteConfig.findUnique({
      where: { key },
    });
    return config?.value || null;
  }
}
