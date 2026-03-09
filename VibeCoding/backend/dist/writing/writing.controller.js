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
exports.WritingController = void 0;
const common_1 = require("@nestjs/common");
const analyze_dto_1 = require("./dto/analyze.dto");
const start_session_dto_1 = require("./dto/start-session.dto");
const next_step_dto_1 = require("./dto/next-step.dto");
const writing_service_1 = require("./writing.service");
let WritingController = class WritingController {
    writingService;
    constructor(writingService) {
        this.writingService = writingService;
    }
    async analyze(body) {
        const originalText = String(body?.originalText ?? '').trim();
        if (!originalText)
            throw new common_1.BadRequestException('originalText 不能为空');
        if (originalText.length < 20)
            throw new common_1.BadRequestException('originalText 太短，请至少输入一个完整段落');
        if (originalText.length > 6000)
            throw new common_1.BadRequestException('originalText 过长，请控制在 6000 字符以内');
        return this.writingService.analyze(originalText);
    }
    async startSession(body) {
        const originalText = String(body?.originalText ?? '').trim();
        const newTheme = String(body?.newTheme ?? '').trim();
        if (!originalText)
            throw new common_1.BadRequestException('originalText 不能为空');
        if (!newTheme)
            throw new common_1.BadRequestException('newTheme 不能为空');
        return this.writingService.startSession(originalText, newTheme);
    }
    async nextStep(body) {
        const sessionId = String(body?.sessionId ?? '').trim();
        const userInput = String(body?.userInput ?? '').trim();
        if (!sessionId)
            throw new common_1.BadRequestException('sessionId 不能为空');
        if (!userInput)
            throw new common_1.BadRequestException('userInput 不能为空');
        return this.writingService.nextStep(sessionId, userInput);
    }
    async nextStepStream(sessionId, userInput, res) {
        const sid = String(sessionId ?? '').trim();
        const input = String(userInput ?? '').trim();
        if (!sid || !input) {
            throw new common_1.BadRequestException('sessionId 和 userInput 不能为空');
        }
        const result = this.writingService.nextStep(sid, input);
        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        const emit = (event, data) => {
            res.write(`event: ${event}\n`);
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        };
        const prompt = String(result.nextPrompt ?? '');
        for (const ch of prompt) {
            emit('guidance_token', { token: ch });
        }
        emit('review_result', result.review);
        emit('step_advanced', {
            currentStepIndex: result.currentStepIndex,
            done: result.done,
        });
        if (result.done) {
            emit('session_completed', { done: true });
        }
        res.end();
    }
    async getSession(id) {
        const sessionId = String(id ?? '').trim();
        if (!sessionId)
            throw new common_1.BadRequestException('session id 不能为空');
        return this.writingService.getSession(sessionId);
    }
};
exports.WritingController = WritingController;
__decorate([
    (0, common_1.Post)('analyze'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [analyze_dto_1.AnalyzeDto]),
    __metadata("design:returntype", Promise)
], WritingController.prototype, "analyze", null);
__decorate([
    (0, common_1.Post)('start-session'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [start_session_dto_1.StartSessionDto]),
    __metadata("design:returntype", Promise)
], WritingController.prototype, "startSession", null);
__decorate([
    (0, common_1.Post)('next-step'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [next_step_dto_1.NextStepDto]),
    __metadata("design:returntype", Promise)
], WritingController.prototype, "nextStep", null);
__decorate([
    (0, common_1.Get)('next-step/stream'),
    __param(0, (0, common_1.Query)('sessionId')),
    __param(1, (0, common_1.Query)('userInput')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], WritingController.prototype, "nextStepStream", null);
__decorate([
    (0, common_1.Get)('session/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WritingController.prototype, "getSession", null);
exports.WritingController = WritingController = __decorate([
    (0, common_1.Controller)('writing'),
    __metadata("design:paramtypes", [writing_service_1.WritingService])
], WritingController);
//# sourceMappingURL=writing.controller.js.map