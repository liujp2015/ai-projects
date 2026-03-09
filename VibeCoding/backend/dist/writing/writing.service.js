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
var WritingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WritingService = void 0;
const common_1 = require("@nestjs/common");
const openai_1 = __importDefault(require("openai"));
const crypto_1 = require("crypto");
const qwen_config_1 = require("../config/qwen.config");
let WritingService = WritingService_1 = class WritingService {
    logger = new common_1.Logger(WritingService_1.name);
    sessions = new Map();
    async analyze(originalText) {
        const text = originalText;
        const config = (0, qwen_config_1.getQwenConfig)();
        if (!config.apiKey) {
            return this.heuristicAnalyze(text);
        }
        try {
            const client = new openai_1.default({
                apiKey: config.apiKey,
                baseURL: config.baseUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
            });
            const prompt = 'Analyze the paragraph and split it into PEEL units. Return JSON only: ' +
                '{"logicUnits":[{"type":"Point|Evidence|Explanation|Link","start":0,"end":10,"text":"...","purposeZh":"..."}]}. ' +
                'start/end must be offsets over original text [start, end).';
            const completion = await client.chat.completions.create({
                model: config.textModel || 'qwen-turbo',
                messages: [
                    { role: 'system', content: 'You are a strict JSON generator.' },
                    { role: 'user', content: `${prompt}\n\nParagraph:\n${text}` },
                ],
                temperature: 0,
                response_format: { type: 'json_object' },
            });
            const raw = completion.choices[0]?.message?.content;
            if (!raw)
                throw new Error('empty model response');
            const parsed = JSON.parse(typeof raw === 'string' ? raw : String(raw));
            const units = this.normalizeAndValidateUnits(parsed?.logicUnits, text);
            return { logicUnits: units, blueprint: this.buildBlueprint(units) };
        }
        catch (e) {
            this.logger.warn(`analyze failed, fallback heuristic: ${String(e)}`);
            return this.heuristicAnalyze(text);
        }
    }
    async startSession(originalText, newTheme) {
        const analyzed = await this.analyze(originalText);
        const sessionId = (0, crypto_1.randomUUID)();
        const now = new Date().toISOString();
        const session = {
            sessionId,
            originalText,
            newTheme,
            logicMap: analyzed.logicUnits,
            blueprint: analyzed.blueprint,
            currentStepIndex: 0,
            draftLines: [],
            done: false,
            createdAt: now,
            updatedAt: now,
        };
        this.sessions.set(sessionId, session);
        return {
            sessionId,
            currentStepIndex: 0,
            nextPrompt: this.getPromptForStep(session),
            done: false,
            logicUnits: session.logicMap,
            blueprint: session.blueprint,
        };
    }
    getSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            throw new common_1.NotFoundException('session 不存在');
        return {
            ...session,
            nextPrompt: session.done ? '会话已完成。' : this.getPromptForStep(session),
        };
    }
    nextStep(sessionId, userInput) {
        const session = this.sessions.get(sessionId);
        if (!session)
            throw new common_1.NotFoundException('session 不存在');
        if (session.done) {
            return {
                review: {
                    pass: true,
                    score: 1,
                    feedbackZh: '会话已完成。',
                    hints: [],
                },
                currentStepIndex: session.currentStepIndex,
                nextPrompt: '会话已完成。',
                done: true,
            };
        }
        const review = this.reviewStep(session, userInput);
        if (review.pass) {
            session.draftLines.push(userInput.trim());
            session.currentStepIndex += 1;
            if (session.currentStepIndex >= session.blueprint.length) {
                session.done = true;
            }
        }
        session.updatedAt = new Date().toISOString();
        this.sessions.set(sessionId, session);
        return {
            review,
            currentStepIndex: session.currentStepIndex,
            nextPrompt: session.done ? '已完成全部步骤，请回顾你的段落。' : this.getPromptForStep(session),
            done: session.done,
        };
    }
    reviewStep(session, userInput) {
        const step = session.blueprint[session.currentStepIndex];
        const input = userInput.trim();
        if (!input) {
            return {
                pass: false,
                score: 0,
                feedbackZh: '这一轮输入为空，请先写一句再继续。',
                hints: ['先写一句简短表达即可', '可以先中文后英文'],
            };
        }
        let pass = false;
        let hints = [];
        let feedbackZh = '';
        switch (step?.type) {
            case 'Point':
                pass = input.length >= 8;
                feedbackZh = pass ? '观点基本清楚，可以进入下一步。' : '观点还不够明确，请补充你的立场。';
                hints = pass ? ['下一步给一个具体证据'] : ['可用 In my view / I believe 开头'];
                break;
            case 'Evidence':
                pass = /for example|for instance|例如|比如|such as/i.test(input) || input.length >= 14;
                feedbackZh = pass ? '有证据支撑，继续。' : '证据感偏弱，请给一个具体例子或事实。';
                hints = pass ? ['下一步解释“为什么这个证据能支持观点”'] : ['尝试加入 for example'];
                break;
            case 'Explanation':
                pass = /because|therefore|这说明|因此|意味着/i.test(input) || input.length >= 14;
                feedbackZh = pass ? '解释逻辑成立，继续最后总结。' : '需要补充解释关系：证据如何支撑观点？';
                hints = pass ? ['最后用一句总结并回扣主题'] : ['可以使用 therefore / this shows that'];
                break;
            case 'Link':
                pass = input.length >= 8;
                feedbackZh = pass ? '总结完成，结构闭环。' : '请用一句总结并回扣主题。';
                hints = pass ? [] : ['可用 In conclusion / Overall'];
                break;
            default:
                pass = input.length > 0;
                feedbackZh = pass ? '通过。' : '请继续补充。';
        }
        return {
            pass,
            score: pass ? 0.82 : 0.48,
            feedbackZh,
            hints,
        };
    }
    getPromptForStep(session) {
        const node = session.blueprint[session.currentStepIndex];
        if (!node)
            return '会话已完成。';
        return `当前步骤 ${session.currentStepIndex + 1}/${session.blueprint.length}（${node.type}）：${node.instructionZh} 主题：${session.newTheme}`;
    }
    normalizeAndValidateUnits(rawUnits, text) {
        if (!Array.isArray(rawUnits) || rawUnits.length === 0)
            throw new Error('logicUnits invalid');
        const units = rawUnits
            .map((item, idx) => {
            const row = item;
            const type = String(row?.type ?? '');
            const start = Number(row?.start);
            const end = Number(row?.end);
            const itemText = String(row?.text ?? '');
            const purposeZh = String(row?.purposeZh ?? '').trim() || this.defaultPurpose(type);
            if (!this.isValidType(type))
                return null;
            if (!Number.isInteger(start) || !Number.isInteger(end))
                return null;
            if (start < 0 || end > text.length || start >= end)
                return null;
            return {
                id: `u${idx + 1}`,
                type,
                start,
                end,
                text: itemText.trim() ? itemText : text.slice(start, end),
                purposeZh,
            };
        })
            .filter((x) => Boolean(x))
            .sort((a, b) => a.start - b.start);
        if (!units.length)
            throw new Error('no valid units');
        return units;
    }
    heuristicAnalyze(text) {
        const sentenceRegex = /[^.!?\n]+[.!?]?|[^\n]+/g;
        const matches = Array.from(text.matchAll(sentenceRegex));
        const spans = matches
            .map((m) => {
            const segment = (m[0] || '').trim();
            const index = m.index ?? -1;
            if (!segment || index < 0)
                return null;
            const start = text.indexOf(segment, index);
            if (start < 0)
                return null;
            return { segment, start, end: start + segment.length };
        })
            .filter((x) => Boolean(x));
        const fallback = spans.length ? spans : [{ segment: text, start: 0, end: text.length }];
        const types = ['Point', 'Evidence', 'Explanation', 'Link'];
        const logicUnits = fallback.map((s, idx) => {
            const type = types[Math.min(idx, types.length - 1)];
            return {
                id: `u${idx + 1}`,
                type,
                start: s.start,
                end: s.end,
                text: s.segment,
                purposeZh: this.defaultPurpose(type),
            };
        });
        return { logicUnits, blueprint: this.buildBlueprint(logicUnits) };
    }
    buildBlueprint(units) {
        return units.map((u, i) => ({ step: i, type: u.type, instructionZh: this.defaultInstruction(u.type) }));
    }
    isValidType(type) {
        return type === 'Point' || type === 'Evidence' || type === 'Explanation' || type === 'Link';
    }
    defaultPurpose(type) {
        const map = {
            Point: '提出核心观点',
            Evidence: '给出证据或例子支撑观点',
            Explanation: '解释证据与观点之间的关系',
            Link: '总结并回扣主题',
        };
        return map[type];
    }
    defaultInstruction(type) {
        const map = {
            Point: '请先给出你的核心观点（可先中文再英文）。',
            Evidence: '请提供一个具体例子或事实作为证据。',
            Explanation: '请解释这个证据如何支撑你的观点。',
            Link: '请用一句话总结并回扣主题。',
        };
        return map[type];
    }
};
exports.WritingService = WritingService;
exports.WritingService = WritingService = WritingService_1 = __decorate([
    (0, common_1.Injectable)()
], WritingService);
//# sourceMappingURL=writing.service.js.map