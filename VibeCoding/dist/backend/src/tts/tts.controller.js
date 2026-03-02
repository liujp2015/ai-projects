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
var TTSController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TTSController = void 0;
const common_1 = require("@nestjs/common");
const tts_service_1 = require("./tts.service");
let TTSController = TTSController_1 = class TTSController {
    ttsService;
    logger = new common_1.Logger(TTSController_1.name);
    constructor(ttsService) {
        this.ttsService = ttsService;
    }
    async streamAudio(text, res) {
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }
        try {
            this.logger.log(`TTS request for text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
            const buffer = await this.ttsService.getAudioStream(text);
            res.set({
                'Content-Type': 'audio/mpeg',
                'Content-Length': buffer.length.toString(),
                'Cache-Control': 'public, max-age=3600',
            });
            res.send(buffer);
        }
        catch (error) {
            this.logger.error(`TTS generation failed: ${error?.message || error}`, error?.stack);
            res.status(500).json({
                error: 'Failed to generate audio',
                message: error?.message || 'Unknown error'
            });
        }
    }
};
exports.TTSController = TTSController;
__decorate([
    (0, common_1.Get)('stream'),
    __param(0, (0, common_1.Query)('text')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TTSController.prototype, "streamAudio", null);
exports.TTSController = TTSController = TTSController_1 = __decorate([
    (0, common_1.Controller)('tts'),
    __metadata("design:paramtypes", [tts_service_1.TTSService])
], TTSController);
//# sourceMappingURL=tts.controller.js.map