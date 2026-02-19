import { PrismaService } from '../prisma/prisma.service';
export declare class DictionaryService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    lookup(word: string): Promise<import("@prisma/client/runtime/library").JsonValue | {
        word: string;
        phonetic: any;
        phonetics: any;
        translation: string;
        definitionZh: string;
        meanings: any;
    }>;
}
