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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var DictionaryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DictionaryService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const deepseek_config_1 = require("../config/deepseek.config");
const prisma_service_1 = require("../prisma/prisma.service");
let DictionaryService = DictionaryService_1 = class DictionaryService {
    prisma;
    logger = new common_1.Logger(DictionaryService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async lookup(word) {
        const cleanWord = word.toLowerCase().trim();
        try {
            const cachedEntry = await this.prisma.dictionaryEntry.findUnique({
                where: { word: cleanWord },
            });
            if (cachedEntry) {
                this.logger.log(`Cache hit for word: "${cleanWord}"`);
                return cachedEntry.data;
            }
            this.logger.log(`Cache miss for word: "${cleanWord}". Calling APIs...`);
            let englishData = null;
            try {
                const response = await axios_1.default.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`);
                englishData = response.data[0];
            }
            catch (e) {
                this.logger.warn(`No English definition found for "${cleanWord}" from API`);
            }
            const config = (0, deepseek_config_1.getDeepSeekConfig)();
            let translation = '';
            let definitionZh = '';
            if (config.apiKey) {
                try {
                    const aiResponse = await axios_1.default.post(config.baseUrl || 'https://api.deepseek.com/chat/completions', {
                        model: config.model,
                        messages: [
                            {
                                role: 'system',
                                content: 'You are a professional English-Chinese dictionary.',
                            },
                            {
                                role: 'user',
                                content: `Provide a concise Chinese translation and a detailed explanation for the word: "${cleanWord}". Output format: Translation: [concise_zh_translation] | Explanation: [detailed_zh_explanation]`,
                            },
                        ],
                        temperature: 0.3,
                    }, {
                        headers: {
                            Authorization: `Bearer ${config.apiKey}`,
                            'Content-Type': 'application/json',
                        },
                    });
                    const aiText = aiResponse.data.choices[0].message.content;
                    const match = aiText.match(/Translation:\s*(.*?)\s*\|\s*Explanation:\s*(.*)/s);
                    if (match) {
                        translation = match[1].trim();
                        definitionZh = match[2].trim();
                    }
                    else {
                        translation = aiText.split('|')[0].replace('Translation:', '').trim();
                        definitionZh = aiText;
                    }
                }
                catch (e) {
                    this.logger.error(`DeepSeek translation failed: ${e.message}`);
                }
            }
            const result = {
                word: cleanWord,
                phonetic: englishData?.phonetic || '',
                phonetics: englishData?.phonetics || [],
                translation: translation,
                definitionZh: definitionZh,
                meanings: englishData?.meanings.map((m) => ({
                    partOfSpeech: m.partOfSpeech,
                    definitions: m.definitions.slice(0, 3).map((d) => ({
                        definition: d.definition,
                        example: d.example,
                    })),
                })) || [],
            };
            try {
                await this.prisma.dictionaryEntry.create({
                    data: {
                        word: cleanWord,
                        phonetic: result.phonetic,
                        translation: result.translation,
                        definitionZh: result.definitionZh,
                        data: result,
                    },
                });
                this.logger.log(`Word "${cleanWord}" saved to cache.`);
            }
            catch (dbError) {
                this.logger.error(`Failed to save cache for "${cleanWord}": ${dbError.message}`);
            }
            return result;
        }
        catch (error) {
            this.logger.error(`Failed to lookup word "${cleanWord}": ${error.message}`);
            return {
                word: cleanWord,
                meanings: [],
                translation: '',
                definitionZh: '',
                error: 'Word lookup failed',
            };
        }
    }
};
exports.DictionaryService = DictionaryService;
exports.DictionaryService = DictionaryService = DictionaryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DictionaryService);
//# sourceMappingURL=dictionary.service.js.map