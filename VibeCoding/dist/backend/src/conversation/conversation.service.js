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
var ConversationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const ocr_service_1 = require("../ai/ocr.service");
const ai_service_1 = require("../ai/ai.service");
const openai_1 = __importDefault(require("openai"));
const qwen_config_1 = require("../config/qwen.config");
let ConversationService = ConversationService_1 = class ConversationService {
    prisma;
    ocrService;
    aiService;
    logger = new common_1.Logger(ConversationService_1.name);
    constructor(prisma, ocrService, aiService) {
        this.prisma = prisma;
        this.ocrService = ocrService;
        this.aiService = aiService;
    }
    async extractConversationFromImages(files, title) {
        this.logger.log(`Extracting conversation from ${files.length} images`);
        const imageTexts = [];
        for (let i = 0; i < files.length; i++) {
            try {
                const ocrResult = await this.ocrService.imageToText(files[i]);
                imageTexts.push({ text: ocrResult, index: i });
                this.logger.log(`OCR completed for image ${i + 1}/${files.length}`);
            }
            catch (error) {
                this.logger.error(`OCR failed for image ${i + 1}: ${error.message}`);
                throw new Error(`图片 ${i + 1} OCR 识别失败: ${error.message}`);
            }
        }
        const allText = imageTexts.map((item) => item.text).join('\n\n---\n\n');
        const messages = await this.extractDialogueFromText(allText);
        const conversation = await this.prisma.conversation.create({
            data: {
                title: title || `对话 ${new Date().toLocaleDateString()}`,
                messages: {
                    create: messages
                        .slice()
                        .sort((a, b) => a.order - b.order)
                        .map((msg, idx) => ({
                        speaker: msg.speaker,
                        content: msg.content,
                        orderIndex: msg.order ?? idx,
                    })),
                },
            },
            include: {
                messages: {
                    orderBy: { orderIndex: 'asc' },
                },
            },
        });
        this.logger.log(`Conversation created with ${conversation.messages.length} messages`);
        return conversation;
    }
    async extractDialogueFromText(text) {
        const config = (0, qwen_config_1.getQwenConfig)();
        if (!config.apiKey) {
            throw new Error('Qwen API Key (DASHSCOPE_API_KEY) not configured');
        }
        const prompt = `
你是一个专业的对话提取专家。请从以下文本中提取对话内容，这些文本来自图片 OCR 识别。

任务：
1. 识别文本中的对话内容
2. 区分不同的说话者（可能是 A/B, Person1/Person2, 或者根据上下文推断的说话者）
3. 将对话按照顺序整理成结构化格式

规则：
- 只提取对话内容，忽略其他无关文本
- 如果无法确定说话者，使用 "Speaker1", "Speaker2" 等通用标识
- 保持对话的原始顺序
- 每个对话条目应该包含说话者和内容

文本内容：
${text}

请返回 JSON 格式的对话数组，格式如下（必须包含 order 字段，并且严格按出现顺序从 1 递增）：
{
  "messages": [
    {
      "order": 1,
      "speaker": "A",
      "content": "对话内容1"
    },
    {
      "order": 2,
      "speaker": "B",
      "content": "对话内容2"
    }
  ]
}

只返回 JSON，不要有其他说明文字。
`;
        try {
            const client = new openai_1.default({
                apiKey: config.apiKey,
                baseURL: config.baseUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
            });
            const completion = await client.chat.completions.create({
                model: config.textModel || 'qwen-turbo',
                messages: [
                    {
                        role: 'system',
                        content: '你是一个专业的对话提取专家。从文本中提取对话内容并返回 JSON 格式。',
                    },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.2,
                response_format: { type: 'json_object' },
            });
            const raw = String(completion.choices[0]?.message?.content ?? '');
            this.logger.log(`Qwen response: ${raw.substring(0, 500)}`);
            const jsonText = this.extractJsonText(raw);
            const parsed = JSON.parse(jsonText);
            let messages = [];
            if (parsed.messages && Array.isArray(parsed.messages)) {
                messages = parsed.messages;
            }
            else if (Array.isArray(parsed)) {
                messages = parsed;
            }
            else {
                const keys = Object.keys(parsed);
                for (const key of keys) {
                    if (Array.isArray(parsed[key])) {
                        messages = parsed[key];
                        break;
                    }
                }
            }
            const normalizedMessages = messages
                .filter((msg) => msg && msg.speaker && msg.content)
                .map((msg, idx) => ({
                order: typeof msg.order === 'number' ? msg.order : idx + 1,
                speaker: String(msg.speaker).trim(),
                content: String(msg.content).trim(),
            }));
            if (normalizedMessages.length === 0) {
                this.logger.warn('No dialogue messages extracted from text');
                return [
                    {
                        order: 1,
                        speaker: 'Unknown',
                        content: text.substring(0, 1000),
                    },
                ];
            }
            return normalizedMessages;
        }
        catch (error) {
            this.logger.error(`Failed to extract dialogue: ${error.message}`);
            throw new Error(`对话提取失败: ${error.message}`);
        }
    }
    extractJsonText(input) {
        let text = (input ?? '').trim();
        const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        if (fenceMatch?.[1]) {
            text = fenceMatch[1].trim();
        }
        const firstObj = text.indexOf('{');
        if (firstObj > 0)
            text = text.slice(firstObj).trim();
        const lastBrace = text.lastIndexOf('}');
        if (lastBrace !== -1)
            text = text.slice(0, lastBrace + 1).trim();
        return text;
    }
    async findAll() {
        return this.prisma.conversation.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                messages: {
                    orderBy: { orderIndex: 'asc' },
                    take: 1,
                },
            },
        });
    }
    async findOne(id) {
        return this.prisma.conversation.findUnique({
            where: { id },
            include: {
                messages: {
                    orderBy: { orderIndex: 'asc' },
                },
            },
        });
    }
    async delete(id) {
        return this.prisma.conversation.delete({
            where: { id },
        });
    }
};
exports.ConversationService = ConversationService;
exports.ConversationService = ConversationService = ConversationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ocr_service_1.OCRService,
        ai_service_1.AIService])
], ConversationService);
//# sourceMappingURL=conversation.service.js.map