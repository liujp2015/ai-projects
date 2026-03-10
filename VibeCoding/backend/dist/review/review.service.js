"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ReviewService = class ReviewService {
    prisma;
    INTERVAL_SEQUENCE = [1, 2, 4, 7, 15, 30, 60, 180];
    constructor(prisma) {
        this.prisma = prisma;
    }
    async importFromExtractedWords(documentId) {
        const doc = await this.prisma.document.findUnique({
            where: { id: documentId },
        });
        if (!doc) {
            throw new common_1.NotFoundException(`Document with ID ${documentId} not found`);
        }
        const extractedWords = await this.prisma.extractedWord.findMany({
            where: { documentId },
        });
        if (extractedWords.length === 0) {
            return {
                total: 0,
                inserted: 0,
                skipped: 0,
                message: '没有找到可导入的单词，请先进行词性提取',
            };
        }
        const now = new Date();
        const existing = await this.prisma.reviewCard.findMany({
            where: { documentId },
            select: { word: true, partOfSpeech: true },
        });
        const existingKey = new Set(existing.map((x) => `${x.word.toLowerCase()}@@${x.partOfSpeech.toLowerCase()}`));
        const rows = extractedWords.map((ew) => ({
            documentId,
            word: ew.word,
            partOfSpeech: ew.partOfSpeech,
            translation: ew.translation,
            sentence: ew.sentence,
            stage: 0,
            nextReviewAt: now,
            status: 'LEARNING',
        }));
        const insertedCandidates = rows.filter((r) => !existingKey.has(`${r.word.toLowerCase()}@@${r.partOfSpeech.toLowerCase()}`));
        const importantPairs = await this.prisma.alignedWordPair.findMany({
            where: {
                documentId,
                isImportant: true,
            },
        });
        for (const pair of importantPairs) {
            const pos = (pair.partOfSpeech || 'unknown').toLowerCase();
            const key = `${pair.en.toLowerCase()}@@${pos}`;
            const alreadyInCandidates = insertedCandidates.some(c => c.word.toLowerCase() === pair.en.toLowerCase() && c.partOfSpeech.toLowerCase() === pos);
            if (!existingKey.has(key) && !alreadyInCandidates) {
                insertedCandidates.push({
                    documentId,
                    word: pair.en,
                    partOfSpeech: pos,
                    translation: pair.zh,
                    sentence: null,
                    stage: 0,
                    nextReviewAt: now,
                    status: 'LEARNING',
                });
            }
        }
        const createRes = await this.prisma.reviewCard.createMany({
            data: insertedCandidates,
            skipDuplicates: true,
        });
        let updated = 0;
        for (const ew of extractedWords) {
            const key = `${ew.word.toLowerCase()}@@${ew.partOfSpeech.toLowerCase()}`;
            if (!existingKey.has(key))
                continue;
            await this.prisma.reviewCard.update({
                where: {
                    documentId_word_partOfSpeech: {
                        documentId,
                        word: ew.word,
                        partOfSpeech: ew.partOfSpeech,
                    },
                },
                data: {
                    translation: ew.translation,
                    sentence: ew.sentence,
                },
            });
            updated++;
        }
        const inserted = createRes.count;
        const skipped = extractedWords.length - inserted;
        const posByWord = new Map();
        const posByLemma = new Map();
        for (const ew of extractedWords) {
            const w = ew.word.toLowerCase().trim();
            if (!posByWord.has(w))
                posByWord.set(w, ew.partOfSpeech);
            if (ew.lemma) {
                const l = ew.lemma.toLowerCase().trim();
                if (!posByLemma.has(l))
                    posByLemma.set(l, ew.partOfSpeech);
            }
        }
        const allAligned = await this.prisma.alignedWordPair.findMany({
            where: { documentId },
            select: { id: true, en: true, lemma: true, partOfSpeech: true },
        });
        let posSynced = 0;
        for (const pair of allAligned) {
            const enLower = pair.en.toLowerCase().trim();
            const pos = posByWord.get(enLower) ?? (pair.lemma ? posByLemma.get(pair.lemma.toLowerCase().trim()) : null);
            if (pos) {
                await this.prisma.alignedWordPair.update({
                    where: { id: pair.id },
                    data: { partOfSpeech: pos },
                });
                posSynced++;
            }
        }
        return {
            total: extractedWords.length,
            inserted,
            updated,
            skipped,
            posSynced,
        };
    }
    async getDueCards(documentId, limit = 50, partOfSpeech, mode = 'due') {
        const where = {
            documentId,
            status: 'LEARNING',
        };
        if (mode === 'due') {
            where.nextReviewAt = { lte: new Date() };
        }
        if (partOfSpeech && partOfSpeech !== 'all') {
            where.partOfSpeech = { equals: partOfSpeech.toLowerCase(), mode: 'insensitive' };
        }
        return this.prisma.reviewCard.findMany({
            where,
            orderBy: [
                { nextReviewAt: 'asc' },
                { createdAt: 'asc' }
            ],
            take: limit,
        });
    }
    async gradeCard(cardId, result) {
        const card = await this.prisma.reviewCard.findUnique({
            where: { id: cardId },
        });
        if (!card) {
            throw new common_1.NotFoundException(`ReviewCard with ID ${cardId} not found`);
        }
        let nextStage = card.stage;
        let nextStatus = card.status;
        if (result === 'GOOD') {
            nextStage = Math.min(card.stage + 1, this.INTERVAL_SEQUENCE.length - 1);
            if (nextStage === this.INTERVAL_SEQUENCE.length - 1) {
                nextStatus = 'MASTERED';
            }
        }
        else {
            nextStage = Math.max(card.stage - 2, 0);
        }
        const now = new Date();
        const intervalDays = this.INTERVAL_SEQUENCE[nextStage];
        const nextReviewAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
        return this.prisma.reviewCard.update({
            where: { id: cardId },
            data: {
                stage: nextStage,
                lastReviewAt: now,
                nextReviewAt,
                status: nextStatus,
            },
        });
    }
    async getSummary(documentId) {
        const now = new Date();
        const [dueCount, learningCount, masteredCount] = await Promise.all([
            this.prisma.reviewCard.count({
                where: { documentId, nextReviewAt: { lte: now }, status: 'LEARNING' },
            }),
            this.prisma.reviewCard.count({
                where: { documentId, status: 'LEARNING' },
            }),
            this.prisma.reviewCard.count({
                where: { documentId, status: 'MASTERED' },
            }),
        ]);
        return {
            dueCount,
            learningCount,
            masteredCount,
            totalCount: learningCount + masteredCount,
        };
    }
};
exports.ReviewService = ReviewService;
exports.ReviewService = ReviewService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReviewService);
//# sourceMappingURL=review.service.js.map