import { PrismaService } from './prisma/prisma.service';
export declare class AppService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getHello(): string;
    resetDatabase(): Promise<{
        message: string;
        timestamp: string;
    }>;
}
