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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const ai_service_1 = require("./ai.service");
let AIController = class AIController {
    aiService;
    constructor(aiService) {
        this.aiService = aiService;
    }
    async validate(word, scenario, sentence) {
        return this.aiService.validateSentence(word, scenario, sentence);
    }
    async qwenImagesParse(files) {
        return this.aiService.parseImagesWithQwenVL(files);
    }
    async sentencePatternTraining(sentence, scenario, documentId) {
        if (!sentence?.trim()) {
            throw new common_1.BadRequestException('sentence 不能为空');
        }
        if (!scenario?.trim()) {
            throw new common_1.BadRequestException('scenario 不能为空');
        }
        const items = await this.aiService.generateSentencePatternTraining(sentence.trim(), scenario.trim());
        await this.aiService.saveSentencePatternTrainingHistory({
            documentId,
            sourceSentence: sentence.trim(),
            scenario: scenario.trim(),
            items,
        });
        return {
            sentence: sentence.trim(),
            scenario: scenario.trim(),
            items,
            count: items.length,
        };
    }
    async sentencePatternTrainingHistory(documentId, sentence, limit) {
        const parsedLimit = Number(limit);
        const items = await this.aiService.getSentencePatternTrainingHistory({
            documentId,
            sourceSentence: sentence,
            limit: Number.isFinite(parsedLimit) ? parsedLimit : 20,
        });
        return {
            items,
            count: items.length,
        };
    }
    async sentenceChunkQuiz(pairs) {
        if (!Array.isArray(pairs) || pairs.length === 0) {
            throw new common_1.BadRequestException('pairs 不能为空');
        }
        const items = await this.aiService.generateSentenceChunkQuiz(pairs);
        return {
            items,
            count: items.length,
        };
    }
};
exports.AIController = AIController;
__decorate([
    (0, common_1.Post)('validate-sentence'),
    __param(0, (0, common_1.Body)('word')),
    __param(1, (0, common_1.Body)('scenario')),
    __param(2, (0, common_1.Body)('sentence')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "validate", null);
__decorate([
    (0, common_1.Post)('qwen-images-parse'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files')),
    __param(0, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "qwenImagesParse", null);
__decorate([
    (0, common_1.Post)('sentence-pattern-training'),
    __param(0, (0, common_1.Body)('sentence')),
    __param(1, (0, common_1.Body)('scenario')),
    __param(2, (0, common_1.Body)('documentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "sentencePatternTraining", null);
__decorate([
    (0, common_1.Get)('sentence-pattern-training-history'),
    __param(0, (0, common_1.Query)('documentId')),
    __param(1, (0, common_1.Query)('sentence')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "sentencePatternTrainingHistory", null);
__decorate([
    (0, common_1.Post)('sentence-chunk-quiz'),
    __param(0, (0, common_1.Body)('pairs')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "sentenceChunkQuiz", null);
exports.AIController = AIController = __decorate([
    (0, common_1.Controller)('ai'),
    __metadata("design:paramtypes", [ai_service_1.AIService])
], AIController);
//# sourceMappingURL=ai.controller.js.map