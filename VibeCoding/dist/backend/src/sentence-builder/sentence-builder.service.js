"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var SentenceBuilderService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SentenceBuilderService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const deepseek_config_1 = require("../config/deepseek.config");
let SentenceBuilderService = SentenceBuilderService_1 = class SentenceBuilderService {
    logger = new common_1.Logger(SentenceBuilderService_1.name);
    extractJsonText(input) {
        let text = (input ?? '').trim();
        const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        if (fenceMatch?.[1]) {
            text = fenceMatch[1].trim();
        }
        const firstBrace = text.indexOf('{');
        const firstBracket = text.indexOf('[');
        let start = -1;
        if (firstBrace !== -1)
            start = firstBrace;
        if (firstBracket !== -1 && (start === -1 || firstBracket < start))
            start = firstBracket;
        if (start > 0)
            text = text.slice(start).trim();
        const lastBrace = text.lastIndexOf('}');
        const lastBracket2 = text.lastIndexOf(']');
        const end = Math.max(lastBrace, lastBracket2);
        if (end !== -1)
            text = text.slice(0, end + 1).trim();
        return text;
    }
    async generateSceneLexicon(scene, level) {
        const config = (0, deepseek_config_1.getDeepSeekConfig)();
        if (!config.apiKey)
            throw new Error('DeepSeek API Key not configured');
        const prompt = `
你是一个英语教学专家。用户选择了场景「${scene}」，学习者水平：${level}。

请只用 JSON 格式回答，不要出现任何解释文字。

输出结构：
{
  "scene": "string",
  "subjects": [ { "id": "subj_1", "text": "I" }, ... ],
  "verbs":    [ { "id": "verb_1", "text": "would like to check in" }, ... ],
  "objects":  [ { "id": "obj_1", "text": "my luggage" }, ... ],
  "modifiers":[ { "id": "mod_1", "text": "at the counter" }, ... ]
}

要求：
1. 每类 5~10 个词组，全部与场景紧密相关、自然地道。
2. 每个元素必须有唯一 id（字符串），方便前端索引。
3. 词组要适合自由拼接成多个句子，不要太长。
4. 严格保证是合法 JSON，不能出现注释或多余文本。
`;
        const resp = await axios_1.default.post(config.baseUrl || 'https://api.deepseek.com/chat/completions', {
            model: config.model,
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful language teaching expert. Output only JSON as requested.',
                },
                { role: 'user', content: prompt },
            ],
            temperature: 0.4,
            response_format: { type: 'json_object' },
        }, {
            headers: {
                Authorization: `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
            },
        });
        const raw = String(resp.data?.choices?.[0]?.message?.content ?? '');
        const jsonText = this.extractJsonText(raw);
        return JSON.parse(jsonText);
    }
    async evaluateSentence(payload) {
        const config = (0, deepseek_config_1.getDeepSeekConfig)();
        if (!config.apiKey)
            throw new Error('DeepSeek API Key not configured');
        const { scene, sentence, userLevel } = payload;
        const prompt = `
你是资深英语教师，帮学生评估一个句子并给出学习建议。

场景：${scene}
学生水平：${userLevel}
学生句子：${sentence}

请只输出 JSON，结构如下：
{
  "sentence": "string",
  "isGrammaticallyCorrect": true,
  "isNatural": true,
  "corrections": [
    {
      "original": "string",
      "suggested": "string",
      "reasonZh": "string"
    }
  ],
  "explanations": {
    "grammarPoints": [
      { "title": "would like to", "detailZh": "..." }
    ],
    "cultureTips": [
      "在机场场景中，用 'would like to' 比 'want to' 更礼貌。"
    ],
    "pronunciation": {
      "ipa": "…（可选）",
      "linkingTipsZh": "标出可能的连读、弱读等。"
    }
  },
  "suggestedExamples": [
    "I would like to check in two bags.",
    "I need to change my flight for tomorrow morning."
  ]
}

要求：
1. 如果句子有小问题，用 corrections 给出精确修改建议。
2. explanations 面向中国学习者，用中文解释。
3. 严格 JSON 格式，不要输出任何多余文字。
`;
        const resp = await axios_1.default.post(config.baseUrl || 'https://api.deepseek.com/chat/completions', {
            model: config.model,
            messages: [
                {
                    role: 'system',
                    content: 'You are a professional English teacher. Output strict JSON as requested.',
                },
                { role: 'user', content: prompt },
            ],
            temperature: 0.4,
            response_format: { type: 'json_object' },
        }, {
            headers: {
                Authorization: `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
            },
        });
        const raw = String(resp.data?.choices?.[0]?.message?.content ?? '');
        const jsonText = this.extractJsonText(raw);
        return JSON.parse(jsonText);
    }
    async suggestNextTokens(payload) {
        const config = (0, deepseek_config_1.getDeepSeekConfig)();
        if (!config.apiKey)
            throw new Error('DeepSeek API Key not configured');
        const prompt = `
你是一个智能写作辅助系统，帮助学生在场景下造句。

场景：${payload.scene}
当前已选词块（按顺序）：${JSON.stringify(payload.currentTokens, null, 2)}

所有可选词块（按分类）：
${JSON.stringify(payload.allOptions, null, 2)}

请只输出 JSON，结构如下：
{
  "nextCategory": "subjects | verbs | objects | modifiers | done",
  "recommendedIds": ["token_id_1", "token_id_2"]
}

要求：
1. 如果句子已经基本完整，请返回 nextCategory 为 "done"，recommendedIds 为空数组。
2. 否则选择最合理的下一类（如已经有主语，就推荐动词等）。
3. recommendedIds 里的 id 必须来自给定的 allOptions，数量 1~3 个。
4. 严格 JSON 格式。
`;
        const resp = await axios_1.default.post(config.baseUrl || 'https://api.deepseek.com/chat/completions', {
            model: config.model,
            messages: [
                {
                    role: 'system',
                    content: 'You are an assistant that suggests next tokens. Output JSON only.',
                },
                { role: 'user', content: prompt },
            ],
            temperature: 0.4,
            response_format: { type: 'json_object' },
        }, {
            headers: {
                Authorization: `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
            },
        });
        const raw = String(resp.data?.choices?.[0]?.message?.content ?? '');
        const jsonText = this.extractJsonText(raw);
        return JSON.parse(jsonText);
    }
};
exports.SentenceBuilderService = SentenceBuilderService;
exports.SentenceBuilderService = SentenceBuilderService = SentenceBuilderService_1 = __decorate([
    (0, common_1.Injectable)()
], SentenceBuilderService);
//# sourceMappingURL=sentence-builder.service.js.map