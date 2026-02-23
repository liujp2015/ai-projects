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
    tts = null;
    initialized = false;
    initializing = false;
    initAttempts = 0;
    maxInitAttempts = 3;
    constructor() {
    }
    async ensureInitialized() {
        if (this.initialized) {
            return true;
        }
        if (this.initializing) {
            return new Promise((resolve) => {
                const checkInterval = setInterval(() => {
                    if (this.initialized || (!this.initializing && this.initAttempts >= this.maxInitAttempts)) {
                        clearInterval(checkInterval);
                        resolve(this.initialized);
                    }
                }, 100);
            });
        }
        if (this.initAttempts >= this.maxInitAttempts) {
            this.logger.warn('TTS initialization failed after multiple attempts, giving up');
            return false;
        }
        this.initializing = true;
        this.initAttempts++;
        try {
            if (!this.tts) {
                this.tts = new edge_tts_node_1.MsEdgeTTS({});
            }
            const testVoice = 'en-US-AndrewMultilingualNeural';
            await this.tts.setMetadata(testVoice, edge_tts_node_1.OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
            this.initialized = true;
            this.initializing = false;
            this.logger.log('TTS service initialized successfully');
            return true;
        }
        catch (error) {
            this.initializing = false;
            const errorMsg = error?.message || String(error);
            if (errorMsg.includes('Connect') || errorMsg.includes('network') || errorMsg.includes('ECONNREFUSED')) {
                this.logger.warn(`TTS initialization failed (attempt ${this.initAttempts}/${this.maxInitAttempts}): Network connection issue. ` +
                    `This may be due to firewall, proxy, or network restrictions. ` +
                    `TTS will be retried on next request.`);
            }
            else {
                this.logger.error(`TTS initialization failed (attempt ${this.initAttempts}/${this.maxInitAttempts}): ${errorMsg}`, error?.stack);
            }
            this.tts = null;
            return false;
        }
    }
    async getAudioStream(text, voice = 'en-US-AndrewMultilingualNeural') {
        if (!text || !text.trim()) {
            throw new Error('Text is required and cannot be empty');
        }
        const isReady = await this.ensureInitialized();
        if (!isReady || !this.tts) {
            throw new Error('TTS service is not available. This may be due to network connectivity issues. ' +
                'Please check your internet connection and firewall settings.');
        }
        try {
            this.logger.log(`Synthesizing text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}" with voice: ${voice}`);
            await this.tts.setMetadata(voice, edge_tts_node_1.OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
            const stream = this.tts.toStream(text);
            const buffer = await new Promise((resolve, reject) => {
                const chunks = [];
                let hasError = false;
                stream.on('data', (chunk) => {
                    if (!hasError) {
                        chunks.push(Buffer.from(chunk));
                    }
                });
                stream.on('end', () => {
                    if (!hasError) {
                        resolve(Buffer.concat(chunks));
                    }
                });
                stream.on('error', (err) => {
                    hasError = true;
                    this.logger.error(`TTS stream error: ${err.message}`, err.stack);
                    reject(err);
                });
                setTimeout(() => {
                    if (!hasError) {
                        hasError = true;
                        reject(new Error('TTS stream timeout'));
                    }
                }, 30000);
            });
            if (buffer.length === 0) {
                throw new Error('Generated audio buffer is empty');
            }
            this.logger.log(`TTS synthesis successful, buffer size: ${buffer.length} bytes`);
            return buffer;
        }
        catch (error) {
            this.logger.error(`TTS synthesis failed: ${error?.message || error}`, error?.stack);
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