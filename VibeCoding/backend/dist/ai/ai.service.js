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
var AIService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const openai_1 = __importDefault(require("openai"));
const deepseek_config_1 = require("../config/deepseek.config");
const qwen_config_1 = require("../config/qwen.config");
let AIService = AIService_1 = class AIService {
    logger = new common_1.Logger(AIService_1.name);
    async mergeAndDeduplicate(texts) {
        const config = (0, qwen_config_1.getQwenConfig)();
        if (!config.apiKey) {
            this.logger.warn('Qwen API Key (DASHSCOPE_API_KEY) not provided, performing simple join as fallback');
            return texts.join('\n\n');
        }
        this.logger.log('Calling Qwen to merge and deduplicate OCR results...');
        try {
            const client = new openai_1.default({
                apiKey: config.apiKey,
                baseURL: config.baseUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
            });
            const prompt = `
      You are an expert editor. You will be given two or more versions/parts of an English article.
      Some parts might overlap or be duplicates.
      
      Task:
      1. Merge the texts into a single, coherent English article.
      2. Identify and remove any duplicate paragraphs or sentences.
      3. Maintain the original order as much as possible, but ensure the final text flows naturally.
      4. DO NOT summarize. Keep all unique information.
      
      Texts to merge:
      ${texts.map((t, i) => `--- Text ${i + 1} ---\n${t}`).join('\n\n')}
      
      Final Merged Article (Output only the text):
    `;
            const completion = await client.chat.completions.create({
                model: config.textModel || 'qwen-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert editor who merges texts and removes duplicates.',
                    },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.3,
            });
            const result = completion.choices[0]?.message?.content?.trim();
            return result || texts.join('\n\n');
        }
        catch (error) {
            this.logger.error(`Qwen merge failed: ${error.message}`);
            return texts.join('\n\n');
        }
    }
    async validateSentence(word, scenario, sentence) {
        const config = (0, deepseek_config_1.getDeepSeekConfig)();
        if (!config.apiKey) {
            throw new Error('DeepSeek API Key not configured');
        }
        const prompt = `
      As an AI English teacher, evaluate the following sentence created by a student.
      Target Word: "${word}"
      Scenario: "${scenario}"
      Student's Sentence: "${sentence}"

      Please provide feedback in JSON format with the following fields:
      - isCorrect (boolean): Whether the sentence is grammatically correct.
      - score (number 0-100): An overall score for the sentence.
      - correction (string): A corrected version of the sentence if there are errors.
      - nativeSuggestion (string): A more natural/native way to express the same idea in this scenario.
      - explanation (string): Brief explanation of mistakes or why the native suggestion is better (in Chinese).
      - wordUsage (string): Feedback on whether the target word was used correctly (in Chinese).

      JSON Output Only:
    `;
        try {
            const response = await axios_1.default.post(config.baseUrl || 'https://api.deepseek.com/chat/completions', {
                model: config.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful and professional English teacher who provides feedback in JSON format.',
                    },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.3,
                response_format: { type: 'json_object' },
            }, {
                headers: {
                    Authorization: `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json',
                },
            });
            const content = response.data.choices[0].message.content;
            return JSON.parse(this.extractJsonText(content));
        }
        catch (error) {
            this.logger.error(`AI validation failed: ${error.message}`);
            throw new Error('AI 评估服务暂时不可用');
        }
    }
    extractJsonText(input) {
        let text = (input ?? '').trim();
        const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        if (fenceMatch?.[1]) {
            text = fenceMatch[1].trim();
        }
        const firstBrace = text.indexOf('[');
        const firstObj = text.indexOf('{');
        let start = -1;
        if (firstBrace !== -1 && (firstObj === -1 || firstBrace < firstObj))
            start = firstBrace;
        if (firstObj !== -1 && (start === -1 || firstObj < start))
            start = firstObj;
        if (start > 0)
            text = text.slice(start).trim();
        const lastBracket = text.lastIndexOf(']');
        const lastBrace2 = text.lastIndexOf('}');
        const end = Math.max(lastBracket, lastBrace2);
        if (end !== -1)
            text = text.slice(0, end + 1).trim();
        return text;
    }
    async translateEnglishToChinese(sentences) {
        const config = (0, deepseek_config_1.getDeepSeekConfig)();
        if (!config.apiKey) {
            throw new Error('DeepSeek API Key not configured');
        }
        const prompt = `Translate the following English sentences into natural Chinese.
Return ONLY a JSON array of strings (no extra keys), keeping the same order.

Sentences:\n${sentences.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
        const response = await axios_1.default.post(config.baseUrl || 'https://api.deepseek.com/chat/completions', {
            model: config.model,
            messages: [
                {
                    role: 'system',
                    content: 'You are a professional translator. Translate English to Chinese and output only a JSON array of strings.',
                },
                { role: 'user', content: prompt },
            ],
            temperature: 0.2,
        }, {
            headers: {
                Authorization: `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
            },
        });
        const raw = String(response.data?.choices?.[0]?.message?.content ?? '');
        const jsonText = this.extractJsonText(raw);
        let parsed;
        try {
            parsed = JSON.parse(jsonText);
        }
        catch (e) {
            this.logger.error(`Translation JSON parse failed. Raw content: ${raw}`);
            throw e;
        }
        if (!Array.isArray(parsed)) {
            throw new Error('Translation response is not a JSON array');
        }
        return parsed.map((x) => String(x));
    }
    async extractAlignedSentencePairsFromEnglishArticle(englishArticle) {
        const config = (0, deepseek_config_1.getDeepSeekConfig)();
        if (!config.apiKey)
            throw new Error('DeepSeek API Key not configured');
        const prompt = `
You will be given an English article.

Task:
1) Segment the English article into sentences.
2) Translate EACH English sentence into natural Chinese.
3) Return a JSON array of objects, preserving order.

STRICT OUTPUT FORMAT:
- Output ONLY valid JSON.
- Each item must have EXACTLY two keys: "en" and "zh".
- "en" must be copied EXACTLY from the original English article.
- "en" MUST be English-only: it MUST NOT contain any Chinese characters, Chinese punctuation, translations, or glosses.
- "en" should contain only ASCII letters/digits/spaces and common English punctuation.
- "zh" must be the Chinese translation of that sentence ONLY (Chinese only, do not repeat English).
- Do NOT include IPA, part of speech, word explanations, markdown, numbering, or extra keys.

English Article:
${englishArticle}
`;
        const response = await axios_1.default.post(config.baseUrl || 'https://api.deepseek.com/chat/completions', {
            model: config.model,
            messages: [
                {
                    role: 'system',
                    content: 'You are a professional bilingual editor. Output strictly formatted JSON only.',
                },
                { role: 'user', content: prompt },
            ],
            temperature: 0.2,
        }, {
            headers: {
                Authorization: `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
            },
        });
        const raw = String(response.data?.choices?.[0]?.message?.content ?? '');
        const jsonText = this.extractJsonText(raw);
        let parsed;
        try {
            parsed = JSON.parse(jsonText);
        }
        catch (e) {
            this.logger.error(`Aligned pairs JSON parse failed. Raw content: ${raw}`);
            throw e;
        }
        if (!Array.isArray(parsed)) {
            throw new Error('Aligned pairs response is not a JSON array');
        }
        const pairs = parsed;
        return pairs.map((p) => ({
            en: String(p?.en ?? ''),
            zh: String(p?.zh ?? ''),
        }));
    }
    async generateQuestionsForSentences(sentences) {
        const config = (0, deepseek_config_1.getDeepSeekConfig)();
        if (!config.apiKey)
            throw new Error('DeepSeek API Key not configured');
        const prompt = `
      You are an expert English teacher. For each English sentence provided, generate exactly two types of exercise questions.
      
      STRICT CONSTRAINTS:
      1. sentenceId MUST match the input exactly.
      2. scramble.promptZh MUST be EXACTLY the same as the provided "translationZh". No IPA, no part of speech, no extra text.
      3. scramble.tokens MUST be all individual words from the original "content", including necessary punctuation as separate tokens.
      4. choice.promptZh MUST be EXACTLY the same as the provided "translationZh".
      5. choice.blankedEn MUST be the full original English sentence with EXACTLY ONE key word replaced by "____".
      6. choice.answerEn MUST be the original word that was replaced.
      7. choice.options MUST contain EXACTLY 4 strings, including the correct answerEn and 3 plausible distractors from similar contexts.

      Input Sentences:
      ${JSON.stringify(sentences)}

      Return a JSON array of objects, one per sentence:
      {
        "sentenceId": "string",
        "scramble": {
          "promptZh": "string",
          "answerEn": "string (full original sentence)",
          "tokens": ["word1", "word2", ...]
        },
        "choice": {
          "promptZh": "string",
          "blankedEn": "string",
          "answerEn": "string",
          "options": ["opt1", "opt2", "opt3", "opt4"]
        }
      }
    `;
        try {
            const response = await axios_1.default.post(config.baseUrl || 'https://api.deepseek.com/chat/completions', {
                model: config.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an educational content creator. Generate English exercise questions in strict JSON format.',
                    },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.3,
                response_format: { type: 'json_object' },
            }, {
                headers: {
                    Authorization: `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json',
                },
            });
            const content = response.data.choices[0].message.content;
            const parsed = JSON.parse(this.extractJsonText(content));
            return Array.isArray(parsed) ? parsed : parsed.questions || Object.values(parsed)[0];
        }
        catch (error) {
            this.logger.error(`AI question generation failed: ${error.message}`);
            throw error;
        }
    }
    async generateAdvancedQuestions(data) {
        const config = (0, deepseek_config_1.getDeepSeekConfig)();
        if (!config.apiKey)
            throw new Error('DeepSeek API Key not configured');
        const prompt = `
请根据提供的中英文对照内容，生成以下三种类型的测试题：

## 输入数据
中文句子：${data.chinese_sentence}
中文关键词：${data.chinese_words.join('、')}
英文句子：${data.english_sentence}
英文关键词：${data.english_words.join('、')}

## 要求生成题型：

### 题型1：选词组合造句（基于英文句子）
请为【英文句子】生成一个选词填空题，要求：
1. 显示中文句子作为提示（promptZh）。
2. 保留英文句子主干，但移除关键单词（用____表示）。
3. 为每个空位提供正确选项和2-3个干扰项（所有选项必须是英文）。
4. 干扰项需要是相关但错误的英文词汇（近义词、语法错误词、易混淆词等）。

### 题型2：单词选择（基于英文单词）
请为每个英文关键词生成选择题：
1. 显示中文释义（promptZh）。
2. 提供4个英文选项（1个正确，3个干扰）。
3. 干扰项需要是：
   - 拼写相似的英文单词
   - 发音相似的英文单词
   - 意思相近但不同的英文单词
   - 容易混淆的英文单词

### 题型3：句子拼装（基于中文句子提示）
请为英文句子生成一个单词/词组拼装题，要求：
1. 显示中文句子作为提示（promptZh）。
2. 将完整的英文句子切分。
   **极其重要的约束：切分后的 tokens 数组必须【百分之百完整地】包含原始英文句子中的每一个字符。**
   - 必须包含所有虚词（如 of, a, the, in, on, at, to, and 等）。
   - 必须包含所有标点符号（如逗号、句号、撇号等）。
   - 严禁遗漏任何单词或符号，否则用户将无法拼凑出正确的句子。
3. tokens 可以是单个单词，也可以是短语，但必须保证其打乱后仍能通过点击重新组合成 answerEn。
4. 返回的 tokens 数组可以是顺序的，后端会进行二次洗牌。

## 输出格式（JSON）
{
  "sentence_completion": {
    "original_sentence": "完整的英文句子",
    "template": "带____的英文句子模板",
    "blanks": [
      {
        "blank_index": 1,
        "position_word": "被替换的英文关键词",
        "correct_answer": "正确英文答案",
        "options": ["英文选项1", "英文选项2", "英文选项3", "英文选项4"],
        "word_type": "名词/动词/形容词等",
        "difficulty": "简单/中等/困难"
      }
    ]
  },
  "word_matching": [
    {
      "chinese_meaning": "词语的中文释义",
      "correct_word": "正确的英文单词",
      "options": ["word1", "word2", "word3", "word4"],
      "similar_words": [
        {"word": "相似词1", "type": "拼写相似"},
        {"word": "相似词2", "type": "发音相似"}
      ],
      "difficulty": "简单/中等/困难"
    }
  ],
  "sentence_scramble": {
    "promptZh": "对应的中文句子内容",
    "answerEn": "完整的英文原句",
    "tokens": ["单词1", "of", "词组2", "the", ".", "..."]
  }
}

请确保生成的内容准确、难度适中，适合语言学习者使用。
STRICT OUTPUT FORMAT: Output ONLY valid JSON.
`;
        try {
            const response = await axios_1.default.post(config.baseUrl || 'https://api.deepseek.com/chat/completions', {
                model: config.model,
                messages: [
                    {
                        role: 'system',
                        content: '你是一个专业的语言测试题生成专家。',
                    },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.7,
                response_format: { type: 'json_object' },
            }, {
                headers: {
                    Authorization: `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json',
                },
            });
            const content = response.data.choices[0].message.content;
            return JSON.parse(this.extractJsonText(content));
        }
        catch (error) {
            this.logger.error(`Advanced question generation failed: ${error.message}`);
            throw error;
        }
    }
    async parseImagesWithQwenVL(files) {
        const config = (0, qwen_config_1.getQwenConfig)();
        if (!config.apiKey) {
            throw new Error('Qwen API Key (DASHSCOPE_API_KEY) not configured');
        }
        this.logger.log(`Parsing ${files.length} image(s) with Qwen VL using OpenAI compatible mode...`);
        try {
            const client = new openai_1.default({
                apiKey: config.apiKey,
                baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
            });
            const content = [
                {
                    type: 'text',
                    text: 'Please extract all English text content from these images. Output the text in the original order. If there are multiple images, merge all text content together.',
                },
            ];
            for (const file of files) {
                const base64Image = file.buffer.toString('base64');
                const mimeType = file.mimetype || 'image/jpeg';
                content.push({
                    type: 'image_url',
                    image_url: {
                        url: `data:${mimeType};base64,${base64Image}`,
                    },
                });
            }
            const completion = await client.chat.completions.create({
                model: config.vlModel || 'qwen3-vl-flash',
                messages: [
                    {
                        role: 'user',
                        content,
                    },
                ],
                temperature: 0.1,
            });
            const result = completion.choices[0]?.message?.content;
            if (result) {
                return result.trim();
            }
            throw new Error('千问 VL 返回内容为空');
        }
        catch (error) {
            this.logger.error(`Qwen VL parsing failed: ${error.message}`);
            if (error.response) {
                this.logger.error(`Qwen VL API error status: ${error.response.status}`);
                this.logger.error(`Qwen VL API error data: ${JSON.stringify(error.response.data)}`);
            }
            else if (error.error) {
                this.logger.error(`Qwen VL API error: ${JSON.stringify(error.error)}`);
            }
            throw new Error(`图片解析失败: ${error.message}`);
        }
    }
};
exports.AIService = AIService;
exports.AIService = AIService = AIService_1 = __decorate([
    (0, common_1.Injectable)()
], AIService);
//# sourceMappingURL=ai.service.js.map