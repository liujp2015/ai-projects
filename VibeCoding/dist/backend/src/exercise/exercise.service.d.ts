import { PrismaService } from '../prisma/prisma.service';
export type Exercise = {
    type: 'fill';
    sentenceId: string;
    originalContent: string;
    blankedContent: string;
    targetWord: string;
    translation?: string;
} | {
    type: 'scramble';
    sentenceId: string;
    originalContent: string;
    scrambledWords: string[];
    translation?: string;
};
export declare class ExerciseService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    generateExercises(documentId: string): Promise<Exercise[]>;
}
