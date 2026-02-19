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
exports.SentenceBuilderController = void 0;
const common_1 = require("@nestjs/common");
const sentence_builder_service_1 = require("./sentence-builder.service");
let SentenceBuilderController = class SentenceBuilderController {
    service;
    constructor(service) {
        this.service = service;
    }
    async getSceneLexicon(body) {
        const { scene, word, targetUserLevel = 'A2' } = body;
        return this.service.generateSceneLexicon(scene, targetUserLevel, word);
    }
    async evaluate(body) {
        const { scene, word, sentence, userLevel = 'A2' } = body;
        return this.service.evaluateSentence({ scene, word, sentence, userLevel });
    }
    async nextToken(body) {
        return this.service.suggestNextTokens(body);
    }
    async save(body) {
        return this.service.saveSentence(body);
    }
    async list(word, scene) {
        return this.service.listSavedSentences({ word, scene });
    }
    async remove(id) {
        return this.service.deleteSavedSentence(id);
    }
};
exports.SentenceBuilderController = SentenceBuilderController;
__decorate([
    (0, common_1.Post)('scene'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SentenceBuilderController.prototype, "getSceneLexicon", null);
__decorate([
    (0, common_1.Post)('evaluate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SentenceBuilderController.prototype, "evaluate", null);
__decorate([
    (0, common_1.Post)('next-token'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SentenceBuilderController.prototype, "nextToken", null);
__decorate([
    (0, common_1.Post)('saved'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SentenceBuilderController.prototype, "save", null);
__decorate([
    (0, common_1.Get)('saved'),
    __param(0, (0, common_1.Query)('word')),
    __param(1, (0, common_1.Query)('scene')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SentenceBuilderController.prototype, "list", null);
__decorate([
    (0, common_1.Delete)('saved/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SentenceBuilderController.prototype, "remove", null);
exports.SentenceBuilderController = SentenceBuilderController = __decorate([
    (0, common_1.Controller)('sentence-builder'),
    __metadata("design:paramtypes", [sentence_builder_service_1.SentenceBuilderService])
], SentenceBuilderController);
//# sourceMappingURL=sentence-builder.controller.js.map