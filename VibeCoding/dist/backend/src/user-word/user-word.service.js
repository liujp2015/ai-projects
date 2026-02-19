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
exports.UserWordService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const dictionary_service_1 = require("../dictionary/dictionary.service");
const srs_service_1 = require("./srs.service");
let UserWordService = class UserWordService {
    prisma;
    dictionaryService;
    srsService;
    constructor(prisma, dictionaryService, srsService) {
        this.prisma = prisma;
        this.dictionaryService = dictionaryService;
        this.srsService = srsService;
    }
    async upsert(word, status, sourceSentenceId, translation, definition) {
        const cleanWord = word.toLowerCase().trim();
        return this.prisma.userWord.upsert({
            where: { word: cleanWord },
            update: {
                status: status,
                sourceSentenceId: sourceSentenceId,
                translation: translation,
                definition: definition,
            },
            create: {
                word: cleanWord,
                status: status || 'NEW',
                sourceSentenceId: sourceSentenceId,
                translation: translation,
                definition: definition,
            },
        });
    }
    async findAll() {
        return this.prisma.userWord.findMany({
            orderBy: { updatedAt: 'desc' },
        });
    }
    async findByWord(word) {
        return this.prisma.userWord.findUnique({
            where: { word: word.toLowerCase().trim() },
        });
    }
    async updateStatus(word, status) {
        return this.prisma.userWord.update({
            where: { word: word.toLowerCase().trim() },
            data: { status },
        });
    }
    async remove(word) {
        return this.prisma.userWord.delete({
            where: { word: word.toLowerCase().trim() },
        });
    }
    async getReviewQueue() {
        const now = new Date();
        return this.prisma.userWord.findMany({
            where: {
                nextReviewAt: {
                    lte: now,
                },
            },
            include: {
                sourceSentence: {
                    include: {
                        paragraph: {
                            include: {
                                document: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                nextReviewAt: 'asc',
            },
        });
    }
    async submitReview(word, quality) {
        const userWord = await this.findByWord(word);
        if (!userWord)
            throw new Error('Word not found in collection');
        const nextReview = this.srsService.calculateNextReview(quality, userWord.interval, userWord.reps, userWord.difficulty);
        return this.prisma.userWord.update({
            where: { word: word.toLowerCase().trim() },
            data: {
                interval: nextReview.interval,
                reps: nextReview.reps,
                difficulty: nextReview.difficulty,
                nextReviewAt: nextReview.nextReviewAt,
                status: quality >= 3 ? 'LEARNING' : 'NEW',
            },
        });
    }
    async fillMissingTranslations() {
        const wordsMissingData = await this.prisma.userWord.findMany({
            where: {
                OR: [
                    { translation: null },
                    { translation: '' },
                    { definition: null },
                    { definition: '' },
                ],
            },
        });
        const results = [];
        for (const userWord of wordsMissingData) {
            try {
                const lookupResult = await this.dictionaryService.lookup(userWord.word);
                if (lookupResult) {
                    await this.prisma.userWord.update({
                        where: { id: userWord.id },
                        data: {
                            translation: lookupResult.translation,
                            definition: lookupResult.definitionZh,
                        },
                    });
                    results.push({ word: userWord.word, success: true });
                }
            }
            catch (error) {
                results.push({ word: userWord.word, success: false, error: error.message });
            }
        }
        return {
            total: wordsMissingData.length,
            processed: results.length,
            details: results,
        };
    }
};
exports.UserWordService = UserWordService;
exports.UserWordService = UserWordService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        dictionary_service_1.DictionaryService,
        srs_service_1.SRSService])
], UserWordService);
//# sourceMappingURL=user-word.service.js.map