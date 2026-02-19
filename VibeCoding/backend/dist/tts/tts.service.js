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
var TTSService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TTSService = void 0;
const common_1 = require("@nestjs/common");
const edge_tts_node_1 = require("edge-tts-node");
let TTSService = TTSService_1 = class TTSService {
    logger = new common_1.Logger(TTSService_1.name);
    tts;
    constructor() {
        this.tts = new edge_tts_node_1.MsEdgeTTS({});
    }
    async getAudioStream(text, voice = 'en-US-AndrewMultilingualNeural') {
        try {
            this.logger.log(`Synthesizing text: "${text.substring(0, 20)}..." with voice: ${voice}`);
            await this.tts.setMetadata(voice, edge_tts_node_1.OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
            const stream = this.tts.toStream(text);
            const buffer = await new Promise((resolve, reject) => {
                const chunks = [];
                stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
                stream.on('end', () => resolve(Buffer.concat(chunks)));
                stream.on('error', reject);
            });
            return buffer;
        }
        catch (error) {
            this.logger.error(`TTS synthesis failed: ${error.message}`);
            throw error;
        }
    }
};
exports.TTSService = TTSService;
exports.TTSService = TTSService = TTSService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], TTSService);
//# sourceMappingURL=tts.service.js.map