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
var OCRService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OCRService = exports.OCRProvider = void 0;
const common_1 = require("@nestjs/common");
const tesseract_js_1 = require("tesseract.js");
const openai_1 = __importDefault(require("openai"));
const qwen_config_1 = require("../config/qwen.config");
var OCRProvider;
(function (OCRProvider) {
    OCRProvider["LOCAL"] = "local";
    OCRProvider["QWEN"] = "qwen";
})(OCRProvider || (exports.OCRProvider = OCRProvider = {}));
let OCRService = OCRService_1 = class OCRService {
    logger = new common_1.Logger(OCRService_1.name);
    provider = OCRProvider.QWEN;
    containsChinese(s) {
        return /[\u3400-\u9FFF]/.test(s);
    }
    containsLatin(s) {
        return /[A-Za-z]/.test(s);
    }
    containsIpaLike(s) {
        return /[ˈˌɪʊʌəɛæɑɔθðŋʃʒ]/.test(s) || /\/[^/\n]{1,30}\//.test(s);
    }
    isMostlyAsciiEnglish(s) {
        return /^[\x20-\x7E\u2018\u2019\u201C\u201D\u2013\u2014]*$/.test(s);
    }
    extractEnglishTokens(text) {
        const matches = text.match(/[A-Za-z][A-Za-z0-9'-]*/g);
        const tokens = Array.isArray(matches) ? matches : [];
        return new Set(tokens.map((t) => t.toLowerCase()));
    }
    getErrorMessage(err) {
        if (err instanceof Error)
            return err.message;
        return String(err);
    }
    isRecord(x) {
        return typeof x === 'object' && x !== null;
    }
    collectStringLeaves(value, opts) {
        const maxLeaves = opts?.maxLeaves ?? 80;
        const maxDepth = opts?.maxDepth ?? 6;
        const out = [];
        const visit = (v, depth) => {
            if (out.length >= maxLeaves)
                return;
            if (depth > maxDepth)
                return;
            if (typeof v === 'string') {
                const s = v.trim();
                if (s)
                    out.push(s);
                return;
            }
            if (typeof v === 'number' || typeof v === 'boolean') {
                out.push(String(v));
                return;
            }
            if (Array.isArray(v)) {
                for (const item of v) {
                    visit(item, depth + 1);
                    if (out.length >= maxLeaves)
                        break;
                }
                return;
            }
            if (this.isRecord(v)) {
                for (const k of ['text', 'content', 'value', 'message', 'data']) {
                    if (typeof v[k] === 'string')
                        visit(v[k], depth + 1);
                }
                for (const key of Object.keys(v)) {
                    visit(v[key], depth + 1);
                    if (out.length >= maxLeaves)
                        break;
                }
            }
        };
        visit(value, 0);
        return out;
    }
    coercePairText(value, fieldName) {
        if (typeof value === 'string')
            return value;
        if (typeof value === 'number' || typeof value === 'boolean') {
            return String(value);
        }
        if (this.isRecord(value) && typeof value.text === 'string') {
            return value.text;
        }
        if (Array.isArray(value)) {
            const parts = [];
            for (const item of value) {
                if (typeof item === 'string') {
                    parts.push(item);
                    continue;
                }
                if (this.isRecord(item) && typeof item.text === 'string') {
                    parts.push(item.text);
                    continue;
                }
            }
            const joined = parts.join('');
            if (joined)
                return joined;
        }
        const deep = this.collectStringLeaves(value);
        if (deep.length > 0)
            return deep.join(' ');
        const type = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
        throw new Error(`${fieldName} 必须为字符串（无法从 ${type} 提取文本）`);
    }
    buildRetryPrompt(validationError) {
        return ('你上一次输出的 JSON 不符合约束，错误原因如下：\n' +
            validationError +
            '\n\n' +
            '请严格分析这张图片中的文本内容，并按以下结构化格式重新输出 JSON：\n' +
            '\n' +
            '{\n' +
            '  "originalText": "提取图片中的所有文本（保持原文格式）",\n' +
            '  "sentencePairs": [\n' +
            '    { "en": "纯英文句子", "zh": "纯中文翻译" }\n' +
            '  ],\n' +
            '  "wordPairs": [\n' +
            '    { "en": "纯英文单词", "zh": "纯中文对照" }\n' +
            '  ]\n' +
            '}\n' +
            '\n' +
            '强约束：\n' +
            '1. sentencePairs 必须是语义完整的句子，wordPairs 必须是独立的单词或短语。\n' +
            '2. en 字段必须是纯英文（ASCII），zh 字段必须是纯中文。\n' +
            '3. 严禁包含音标/IPA（如 /ˈ.../ 等）或词性标注（如 n., v. 等）。\n' +
            '4. 所有字段值必须是字符串，不允许数组或对象。\n' +
            '5. 输出必须只有 JSON，不要有任何额外文字或 Markdown 标记。');
    }
    normalizeAlignedLines(input) {
        const en = input.enLines.map((x) => String(x ?? '').trim());
        const zh = input.zhLines.map((x) => String(x ?? '').trim());
        if (en.length !== zh.length) {
            const min = Math.min(en.length, zh.length);
            const enExtra = en.slice(min).filter((x) => x.length > 0);
            const zhExtra = zh.slice(min).filter((x) => x.length > 0);
            if (enExtra.length === 0 && zhExtra.length === 0) {
                return this.normalizeAlignedLines({
                    enLines: en.slice(0, min),
                    zhLines: zh.slice(0, min),
                });
            }
            return { enLines: en, zhLines: zh };
        }
        const outEn = [];
        const outZh = [];
        for (let i = 0; i < en.length; i++) {
            const e = en[i] ?? '';
            const z = zh[i] ?? '';
            if (!e && !z)
                continue;
            outEn.push(e);
            outZh.push(z);
        }
        return { enLines: outEn, zhLines: outZh };
    }
    setProvider(provider) {
        this.provider = provider;
    }
    async imageToText(file) {
        if (this.provider === OCRProvider.LOCAL) {
            return this.localOCR(file.buffer);
        }
        else if (this.provider === OCRProvider.QWEN) {
            const result = await this.qwenOCR(file.buffer);
            return result.originalText;
        }
        else {
            return this.localOCR(file.buffer);
        }
    }
    async imageToTextStructured(file) {
        if (this.provider === OCRProvider.QWEN) {
            return this.qwenOCR(file.buffer);
        }
        else {
            const text = await this.localOCR(file.buffer);
            return {
                originalText: text,
                chineseText: '',
                englishText: '',
            };
        }
    }
    async localOCR(buffer) {
        this.logger.log('Starting local OCR with Tesseract (English + Chinese)...');
        try {
            const worker = await (0, tesseract_js_1.createWorker)(['eng', 'chi_sim'], 1, {
                logger: (m) => {
                    if (m?.status === 'recognizing text' &&
                        typeof m.progress === 'number') {
                        this.logger.debug(`OCR Progress: ${(m.progress * 100).toFixed(2)}%`);
                    }
                },
                errorHandler: (err) => this.logger.error('Tesseract Worker Error:', err),
            });
            const { data: { text }, } = await worker.recognize(buffer);
            await worker.terminate();
            return text;
        }
        catch (error) {
            const msg = this.getErrorMessage(error);
            this.logger.error(`Local OCR failed: ${msg}`);
            throw new Error(`OCR 识别失败: ${msg}。请检查网络是否能访问语言包下载地址。`);
        }
    }
    async qwenOCR(buffer) {
        const config = (0, qwen_config_1.getQwenConfig)();
        if (!config.apiKey) {
            throw new Error('Qwen API Key (DASHSCOPE_API_KEY) not provided');
        }
        this.logger.log('Calling Qwen OCR API (DashScope compatible mode)...');
        try {
            const client = new openai_1.default({
                apiKey: config.apiKey,
                baseURL: config.baseUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
            });
            const base64Image = buffer.toString('base64');
            const mimeType = 'image/jpeg';
            const completion = await client.chat.completions.create({
                model: config.vlModel || 'qwen3-vl-flash',
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:${mimeType};base64,${base64Image}`,
                                },
                            },
                            {
                                type: 'text',
                                text: '请严格分析这张图片中的文本内容，并按以下结构化格式提取信息：\n' +
                                    '\n' +
                                    '1. **originalText**: 提取图片中的所有文本（保持原文格式，包含音标、换行等）。\n' +
                                    '\n' +
                                    '2. **sentencePairs**: 从文本中提取【完整的句子】及其中文翻译。\n' +
                                    '   - 必须是语义完整的句子（如段落中的话、标题、完整的例句）。\n' +
                                    '   - 严禁包含独立的单词对照。\n' +
                                    '   - en: 纯英文句子；zh: 纯中文翻译。\n' +
                                    '\n' +
                                    '3. **wordPairs**: 从文本中提取【独立的单词】及其中文对照。\n' +
                                    '   - 必须是独立的单词或短语（如词汇表、标注的关键词）。\n' +
                                    '   - en: 纯英文单词；zh: 纯中文对照。\n' +
                                    '\n' +
                                    '请以 JSON 格式返回结果：\n' +
                                    '{\n' +
                                    '  "originalText": "...",\n' +
                                    '  "sentencePairs": [{ "en": "...", "zh": "..." }],\n' +
                                    '  "wordPairs": [{ "en": "...", "zh": "..." }]\n' +
                                    '}\n' +
                                    '\n' +
                                    '注意：\n' +
                                    '- 严禁在 en 字段包含中文，严禁在 zh 字段包含英文。\n' +
                                    '- 严禁包含音标/IPA（如 /ˈ.../ 等）或词性标注（如 n., v. 等）。\n' +
                                    '- 如果图片中只有句子或只有单词，请将另一个数组设为空 []。\n' +
                                    '- 输出必须是合法 JSON，不要有任何 Markdown 标记。',
                            },
                        ],
                    },
                ],
                temperature: 0,
                response_format: { type: 'json_object' },
            });
            const rawContent = completion.choices[0]?.message?.content;
            if (!rawContent) {
                throw new Error('千问 OCR 返回内容为空');
            }
            this.logger.log('=== 千问 OCR 原始返回内容 ===');
            this.logger.log(rawContent);
            this.logger.log('=== 原始返回内容结束 ===');
            let parsed;
            try {
                parsed = JSON.parse(typeof rawContent === 'string' ? rawContent : String(rawContent));
            }
            catch {
                this.logger.error(`Qwen OCR JSON parse failed. Raw content: ${rawContent}`);
                throw new Error('千问 OCR 返回的不是合法 JSON，请检查提示词或模型配置');
            }
            this.logger.log('=== 千问 OCR 解析后的 JSON ===');
            this.logger.log(JSON.stringify(parsed, null, 2));
            this.logger.log('=== 解析后的 JSON 结束 ===');
            if (!this.isRecord(parsed)) {
                throw new Error('千问 OCR 返回的 JSON 不是对象');
            }
            if (typeof parsed.originalText !== 'string') {
                throw new Error('千问 OCR originalText 不是字符串');
            }
            const originalText = parsed.originalText.trim();
            this.logger.log(`=== originalText (长度: ${originalText.length}) ===`);
            this.logger.log(originalText);
            this.logger.log('=== originalText 结束 ===');
            let enLines = [];
            let zhLines = [];
            const extractPairs = (raw, label) => {
                if (!Array.isArray(raw))
                    return [];
                const result = [];
                for (let idx = 0; idx < raw.length; idx++) {
                    const item = raw[idx];
                    if (!this.isRecord(item))
                        continue;
                    try {
                        const en = this.coercePairText(item.en, `${label}[${idx}].en`).trim();
                        const zh = this.coercePairText(item.zh, `${label}[${idx}].zh`).trim();
                        if (en && zh) {
                            result.push({ en, zh });
                        }
                    }
                    catch (e) {
                        this.logger.warn(`${label}[${idx}] 解析失败: ${this.getErrorMessage(e)}`);
                    }
                }
                return result;
            };
            const sentencePairs = extractPairs(parsed.sentencePairs, 'sentencePairs');
            const wordPairs = extractPairs(parsed.wordPairs, 'wordPairs');
            const legacyPairs = extractPairs(parsed.pairs, 'pairs');
            const allPairs = [...sentencePairs, ...wordPairs, ...legacyPairs];
            if (allPairs.length > 0) {
                enLines = allPairs.map((p) => p.en);
                zhLines = allPairs.map((p) => p.zh);
                this.logger.log(`=== 解析后的数据 (句子: ${sentencePairs.length}, 单词: ${wordPairs.length}) ===`);
            }
            else {
                const zhLinesRaw = Array.isArray(parsed.zhLines)
                    ? parsed.zhLines
                    : [];
                const enLinesRaw = Array.isArray(parsed.enLines)
                    ? parsed.enLines
                    : [];
                zhLines = zhLinesRaw.map((x) => {
                    if (typeof x !== 'string') {
                        throw new Error('千问 OCR zhLines 含非字符串项');
                    }
                    return x.trim();
                });
                enLines = enLinesRaw.map((x) => {
                    if (typeof x !== 'string') {
                        throw new Error('千问 OCR enLines 含非字符串项');
                    }
                    return x.trim();
                });
                this.logger.log(`=== 解析后的 enLines/zhLines (en=${enLines.length}, zh=${zhLines.length}) ===`);
                for (let i = 0; i < Math.max(enLines.length, zhLines.length); i++) {
                    this.logger.log(`[${i}] en="${enLines[i] || ''}", zh="${zhLines[i] || ''}"`);
                }
                this.logger.log('=== enLines/zhLines 结束 ===');
            }
            this.logger.log(`=== 最终解析结果 (en=${enLines.length}, zh=${zhLines.length}) ===`);
            for (let i = 0; i < enLines.length; i++) {
                this.logger.log(`[${i}] en="${enLines[i]}", zh="${zhLines[i]}"`);
            }
            this.logger.log('=== 最终解析结果结束 ===');
            if (!originalText)
                throw new Error('千问 OCR originalText 为空');
            if (zhLines.length === 0 || enLines.length === 0) {
                throw new Error('千问 OCR pairs 或 enLines/zhLines 为空');
            }
            if (zhLines.length !== enLines.length) {
                throw new Error(`千问 OCR zhLines/enLines 长度不一致：zh=${zhLines.length}, en=${enLines.length}`);
            }
            const validateOrThrow = (z, e) => {
                for (let i = 0; i < z.length; i++) {
                    const zh = z[i] || '';
                    const en = e[i] || '';
                    if (/^[A-Za-z0-9\s.,!?'"-]+$/.test(zh)) {
                        throw new Error(`第 ${i + 1} 行 zhLines 看起来全是英文：${zh}`);
                    }
                    if (this.containsIpaLike(zh)) {
                        throw new Error(`第 ${i + 1} 行 zhLines 含音标/IPA：${zh}`);
                    }
                    if (this.containsChinese(en)) {
                        throw new Error(`第 ${i + 1} 行 enLines 含中文：${en}`);
                    }
                    if (!this.isMostlyAsciiEnglish(en)) {
                        throw new Error(`第 ${i + 1} 行 enLines 含非 ASCII 字符：${en}`);
                    }
                    if (this.containsIpaLike(en)) {
                        throw new Error(`第 ${i + 1} 行 enLines 含音标/IPA：${en}`);
                    }
                }
            };
            try {
                validateOrThrow(zhLines, enLines);
            }
            catch (e) {
                const retryCompletion = await client.chat.completions.create({
                    model: config.vlModel || 'qwen3-vl-flash',
                    messages: [
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: `data:${mimeType};base64,${base64Image}`,
                                    },
                                },
                                {
                                    type: 'text',
                                    text: this.buildRetryPrompt(this.getErrorMessage(e)),
                                },
                            ],
                        },
                    ],
                    temperature: 0,
                    response_format: { type: 'json_object' },
                });
                const retryRaw = retryCompletion.choices[0]?.message?.content;
                if (!retryRaw) {
                    throw new Error('千问 OCR 重试返回内容为空');
                }
                const retryParsed = JSON.parse(typeof retryRaw === 'string' ? retryRaw : String(retryRaw));
                if (!this.isRecord(retryParsed)) {
                    throw new Error('千问 OCR 重试返回的 JSON 不是对象');
                }
                if (typeof retryParsed.originalText !== 'string') {
                    throw new Error('千问 OCR 重试 originalText 不是字符串');
                }
                const originalText2 = retryParsed.originalText.trim();
                const sentencePairs2 = extractPairs(retryParsed.sentencePairs, 'retry.sentencePairs');
                const wordPairs2 = extractPairs(retryParsed.wordPairs, 'retry.wordPairs');
                const legacyPairs2 = extractPairs(retryParsed.pairs, 'retry.pairs');
                const allPairs2 = [...sentencePairs2, ...wordPairs2, ...legacyPairs2];
                let enLines2 = [];
                let zhLines2 = [];
                if (allPairs2.length > 0) {
                    enLines2 = allPairs2.map((p) => p.en);
                    zhLines2 = allPairs2.map((p) => p.zh);
                }
                else {
                    const zhLinesRaw2 = Array.isArray(retryParsed.zhLines)
                        ? retryParsed.zhLines
                        : [];
                    const enLinesRaw2 = Array.isArray(retryParsed.enLines)
                        ? retryParsed.enLines
                        : [];
                    zhLines2 = zhLinesRaw2.map((x) => {
                        if (typeof x !== 'string') {
                            throw new Error('千问 OCR 重试 zhLines 含非字符串项');
                        }
                        return x.trim();
                    });
                    enLines2 = enLinesRaw2.map((x) => {
                        if (typeof x !== 'string') {
                            throw new Error('千问 OCR 重试 enLines 含非字符串项');
                        }
                        return x.trim();
                    });
                }
                const normalized2 = this.normalizeAlignedLines({
                    enLines: enLines2,
                    zhLines: zhLines2,
                });
                enLines2 = normalized2.enLines;
                zhLines2 = normalized2.zhLines;
                if (!originalText2)
                    throw new Error('千问 OCR 重试 originalText 为空');
                if (zhLines2.length === 0 || enLines2.length === 0) {
                    throw new Error('千问 OCR 重试 zhLines/enLines 为空');
                }
                if (zhLines2.length !== enLines2.length) {
                    throw new Error(`千问 OCR 重试 zhLines/enLines 长度不一致：zh=${zhLines2.length}, en=${enLines2.length}`);
                }
                validateOrThrow(zhLines2, enLines2);
                return {
                    originalText: originalText2,
                    chineseText: zhLines2.join('\n'),
                    englishText: enLines2.join('\n'),
                };
            }
            const result = {
                originalText,
                chineseText: zhLines.join('\n'),
                englishText: enLines.join('\n'),
            };
            this.logger.log('=== 最终返回的数据 ===');
            this.logger.log(`originalText 长度: ${result.originalText.length}`);
            this.logger.log(`chineseText 行数: ${zhLines.length}`);
            this.logger.log(`englishText 行数: ${enLines.length}`);
            this.logger.log('chineseText 内容:');
            zhLines.forEach((zh, idx) => {
                this.logger.log(`  [${idx}] ${zh}`);
            });
            this.logger.log('englishText 内容:');
            enLines.forEach((en, idx) => {
                this.logger.log(`  [${idx}] ${en}`);
            });
            this.logger.log('=== 最终返回的数据结束 ===');
            return result;
        }
        catch (error) {
            const msg = this.getErrorMessage(error);
            this.logger.error(`Qwen OCR failed: ${msg}`);
            throw new Error(`OCR 识别失败: ${msg}`);
        }
    }
    async mergeAndStructureContent(existingOriginalText, existingChineseText, existingEnglishText, newImagesOCRResults) {
        const config = (0, qwen_config_1.getQwenConfig)();
        if (!config.apiKey) {
            throw new Error('Qwen API Key (DASHSCOPE_API_KEY) not provided');
        }
        this.logger.log('Calling Qwen to merge and structure content...');
        try {
            const client = new openai_1.default({
                apiKey: config.apiKey,
                baseURL: config.baseUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
            });
            const newOriginalTexts = newImagesOCRResults.map(r => r.originalText).join('\n\n');
            const newChineseLines = newImagesOCRResults
                .flatMap(r => r.chineseText.split(/\r?\n/).map(x => x.trim()).filter(Boolean));
            const newEnglishLines = newImagesOCRResults
                .flatMap(r => r.englishText.split(/\r?\n/).map(x => x.trim()).filter(Boolean));
            const prompt = `
你是一个专业的文本编辑和语言学习内容整理专家。你需要将原有内容和新增内容合并，并输出结构化的中英文对照数据。

**原有内容：**
- 原文（originalText）：
${existingOriginalText}

- 中文文本（按行分隔）：
${existingChineseText.split(/\r?\n/).map((line, i) => `[${i + 1}] ${line}`).join('\n')}

- 英文文本（按行分隔）：
${existingEnglishText.split(/\r?\n/).map((line, i) => `[${i + 1}] ${line}`).join('\n')}

**新增内容：**
- 新增原文：
${newOriginalTexts}

- 新增中文文本（按行分隔）：
${newChineseLines.map((line, i) => `[${i + 1}] ${line}`).join('\n')}

- 新增英文文本（按行分隔）：
${newEnglishLines.map((line, i) => `[${i + 1}] ${line}`).join('\n')}

**任务要求：**
1. 合并原文：将原有原文和新增原文合并，去除重复内容，保持逻辑顺序。
2. 合并中英文对照：将原有和新增的中英文文本合并，去除重复的句子和单词，保持一一对应关系。
3. 区分句子和单词：
   - 句子：包含空格且长度大于15个字符的完整句子
   - 单词：不包含空格或长度小于等于15个字符的单词/短语
4. 输出格式：严格按照以下JSON格式输出，不要有任何Markdown标记。

**输出格式：**
{
  "originalText": "合并后的完整原文（去除重复）",
  "sentencePairs": [
    { "en": "完整的英文句子", "zh": "对应的中文句子" }
  ],
  "wordPairs": [
    { "en": "英文单词", "zh": "中文对照" }
  ]
}

**重要约束：**
- 严禁在 en 字段包含中文、音标/IPA（如 /ˈ.../）、词性标注（如 n., v. 等）
- 严禁在 zh 字段包含英文
- sentencePairs 和 wordPairs 必须一一对应（相同索引的 en 和 zh 是对应的）
- 输出必须是合法 JSON，不要有任何额外文本
`;
            const completion = await client.chat.completions.create({
                model: config.textModel || 'qwen-turbo',
                messages: [
                    {
                        role: 'system',
                        content: '你是一个专业的文本编辑和语言学习内容整理专家。',
                    },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.3,
                response_format: { type: 'json_object' },
            });
            const rawContent = completion.choices[0]?.message?.content;
            if (!rawContent) {
                throw new Error('千问合并返回内容为空');
            }
            this.logger.log('=== 千问合并原始返回内容 ===');
            this.logger.log(rawContent);
            this.logger.log('=== 原始返回内容结束 ===');
            let parsed;
            try {
                parsed = JSON.parse(typeof rawContent === 'string' ? rawContent : String(rawContent));
            }
            catch {
                this.logger.error(`Qwen merge JSON parse failed. Raw content: ${rawContent}`);
                throw new Error('千问合并返回的不是合法 JSON');
            }
            if (!this.isRecord(parsed)) {
                throw new Error('千问合并返回的 JSON 不是对象');
            }
            if (typeof parsed.originalText !== 'string') {
                throw new Error('千问合并 originalText 不是字符串');
            }
            const originalText = parsed.originalText.trim();
            const extractPairs = (raw, label) => {
                if (!Array.isArray(raw))
                    return [];
                const result = [];
                for (let idx = 0; idx < raw.length; idx++) {
                    const item = raw[idx];
                    if (!this.isRecord(item))
                        continue;
                    try {
                        const en = this.coercePairText(item.en, `${label}[${idx}].en`).trim();
                        const zh = this.coercePairText(item.zh, `${label}[${idx}].zh`).trim();
                        if (en && zh) {
                            result.push({ en, zh });
                        }
                    }
                    catch (e) {
                        this.logger.warn(`${label}[${idx}] 解析失败: ${this.getErrorMessage(e)}`);
                    }
                }
                return result;
            };
            const sentencePairs = extractPairs(parsed.sentencePairs, 'sentencePairs');
            const wordPairs = extractPairs(parsed.wordPairs, 'wordPairs');
            const allPairs = [...sentencePairs, ...wordPairs];
            const zhLines = allPairs.map((p) => p.zh);
            const enLines = allPairs.map((p) => p.en);
            if (!originalText)
                throw new Error('千问合并 originalText 为空');
            if (zhLines.length === 0 || enLines.length === 0) {
                throw new Error('千问合并 pairs 为空');
            }
            if (zhLines.length !== enLines.length) {
                throw new Error(`千问合并 zhLines/enLines 长度不一致：zh=${zhLines.length}, en=${enLines.length}`);
            }
            const validateOrThrow = (z, e) => {
                for (let i = 0; i < z.length; i++) {
                    const zh = z[i] || '';
                    const en = e[i] || '';
                    if (/^[A-Za-z0-9\s.,!?"'\-()\[\]{}:;\/\\]+$/.test(zh)) {
                        throw new Error(`第 ${i + 1} 行 zhLines 看起来全是英文：${zh}`);
                    }
                    if (this.containsIpaLike(zh)) {
                        throw new Error(`第 ${i + 1} 行 zhLines 含音标/IPA：${zh}`);
                    }
                    if (this.containsChinese(en)) {
                        throw new Error(`第 ${i + 1} 行 enLines 含中文：${en}`);
                    }
                    if (!this.isMostlyAsciiEnglish(en)) {
                        throw new Error(`第 ${i + 1} 行 enLines 含非 ASCII 字符：${en}`);
                    }
                    if (this.containsIpaLike(en)) {
                        throw new Error(`第 ${i + 1} 行 enLines 含音标/IPA：${en}`);
                    }
                }
            };
            validateOrThrow(zhLines, enLines);
            const result = {
                originalText,
                chineseText: zhLines.join('\n'),
                englishText: enLines.join('\n'),
            };
            this.logger.log('=== 千问合并成功 ===');
            this.logger.log(`originalText 长度: ${originalText.length}`);
            this.logger.log(`句子对数: ${sentencePairs.length}, 单词对数: ${wordPairs.length}`);
            return result;
        }
        catch (error) {
            const msg = this.getErrorMessage(error);
            this.logger.error(`Qwen merge failed: ${msg}`);
            throw new Error(`内容合并失败: ${msg}`);
        }
    }
};
exports.OCRService = OCRService;
exports.OCRService = OCRService = OCRService_1 = __decorate([
    (0, common_1.Injectable)()
], OCRService);
//# sourceMappingURL=ocr.service.js.map