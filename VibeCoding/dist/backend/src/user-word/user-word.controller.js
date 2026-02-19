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
exports.UserWordController = void 0;
const common_1 = require("@nestjs/common");
const user_word_service_1 = require("./user-word.service");
let UserWordController = class UserWordController {
    userWordService;
    constructor(userWordService) {
        this.userWordService = userWordService;
    }
    async upsert(word, status, sourceSentenceId, translation, definition) {
        return this.userWordService.upsert(word, status, sourceSentenceId, translation, definition);
    }
    async findAll() {
        return this.userWordService.findAll();
    }
    async findByWord(word) {
        return this.userWordService.findByWord(word);
    }
    async fillMissing() {
        return this.userWordService.fillMissingTranslations();
    }
    async getReviewQueue() {
        return this.userWordService.getReviewQueue();
    }
    async submitReview(word, quality) {
        return this.userWordService.submitReview(word, quality);
    }
    async updateStatus(word, status) {
        return this.userWordService.updateStatus(word, status);
    }
    async remove(word) {
        return this.userWordService.remove(word);
    }
};
exports.UserWordController = UserWordController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)('word')),
    __param(1, (0, common_1.Body)('status')),
    __param(2, (0, common_1.Body)('sourceSentenceId')),
    __param(3, (0, common_1.Body)('translation')),
    __param(4, (0, common_1.Body)('definition')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], UserWordController.prototype, "upsert", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserWordController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':word'),
    __param(0, (0, common_1.Param)('word')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserWordController.prototype, "findByWord", null);
__decorate([
    (0, common_1.Post)('fill-translations'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserWordController.prototype, "fillMissing", null);
__decorate([
    (0, common_1.Get)('review/queue'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserWordController.prototype, "getReviewQueue", null);
__decorate([
    (0, common_1.Post)('review/submit'),
    __param(0, (0, common_1.Body)('word')),
    __param(1, (0, common_1.Body)('quality')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], UserWordController.prototype, "submitReview", null);
__decorate([
    (0, common_1.Patch)(':word/status'),
    __param(0, (0, common_1.Param)('word')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UserWordController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Delete)(':word'),
    __param(0, (0, common_1.Param)('word')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserWordController.prototype, "remove", null);
exports.UserWordController = UserWordController = __decorate([
    (0, common_1.Controller)('user-words'),
    __metadata("design:paramtypes", [user_word_service_1.UserWordService])
], UserWordController);
//# sourceMappingURL=user-word.controller.js.map