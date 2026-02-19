import { Injectable, Logger } from '@nestjs/common';
import { createWorker } from 'tesseract.js';
import OpenAI from 'openai';
import { getQwenConfig } from '../config/qwen.config';

export enum OCRProvider {
  LOCAL = 'local',
  QWEN = 'qwen',
}

@Injectable()
export class OCRService {
  private readonly logger = new Logger(OCRService.name);
  private provider: OCRProvider = OCRProvider.QWEN; // 默认使用千问

  private containsChinese(s: string): boolean {
    return /[\u3400-\u9FFF]/.test(s);
  }

  private containsLatin(s: string): boolean {
    return /[A-Za-z]/.test(s);
  }

  private containsIpaLike(s: string): boolean {
    // Common IPA / phonetic markers and characters that frequently appear in dictionary-style output
    return /[ˈˌɪʊʌəɛæɑɔθðŋʃʒ]/.test(s) || /\/[^/\n]{1,30}\//.test(s);
  }

  private isMostlyAsciiEnglish(s: string): boolean {
    // Allow standard ASCII 20-7E, plus common smart quotes and apostrophes:
    // ’ (U+2019), “ (U+201C), ” (U+201D), — (U+2014), – (U+2013)
    return /^[\x20-\x7E\u2018\u2019\u201C\u201D\u2013\u2014]*$/.test(s);
  }

  private extractEnglishTokens(text: string): Set<string> {
    // Extract ASCII-ish English word tokens for completeness checking.
    // Keeps words like "object-oriented", "it's", "reusability".
    const matches = text.match(/[A-Za-z][A-Za-z0-9'-]*/g);
    const tokens: string[] = Array.isArray(matches) ? matches : [];
    return new Set(tokens.map((t) => t.toLowerCase()));
  }

  private getErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    return String(err);
  }

  private isRecord(x: unknown): x is Record<string, unknown> {
    return typeof x === 'object' && x !== null;
  }

  private collectStringLeaves(
    value: unknown,
    opts?: { maxLeaves?: number; maxDepth?: number },
  ): string[] {
    const maxLeaves = opts?.maxLeaves ?? 80;
    const maxDepth = opts?.maxDepth ?? 6;
    const out: string[] = [];

    const visit = (v: unknown, depth: number) => {
      if (out.length >= maxLeaves) return;
      if (depth > maxDepth) return;

      if (typeof v === 'string') {
        const s = v.trim();
        if (s) out.push(s);
        return;
      }
      if (typeof v === 'number' || typeof v === 'boolean') {
        out.push(String(v));
        return;
      }
      if (Array.isArray(v)) {
        for (const item of v) {
          visit(item, depth + 1);
          if (out.length >= maxLeaves) break;
        }
        return;
      }
      if (this.isRecord(v)) {
        // Prefer common text-ish keys first
        for (const k of ['text', 'content', 'value', 'message', 'data']) {
          if (typeof v[k] === 'string') visit(v[k], depth + 1);
        }
        // Then traverse all fields
        for (const key of Object.keys(v)) {
          visit(v[key], depth + 1);
          if (out.length >= maxLeaves) break;
        }
      }
    };

    visit(value, 0);
    return out;
  }

  private coercePairText(value: unknown, fieldName: string): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    // Some models may output { text: "..." } or an array like [{type:"text", text:"..."}]
    if (this.isRecord(value) && typeof value.text === 'string') {
      return value.text;
    }

    if (Array.isArray(value)) {
      const parts: string[] = [];
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
      if (joined) return joined;
    }

    const deep = this.collectStringLeaves(value);
    if (deep.length > 0) return deep.join(' ');

    // Last resort: keep the error but include a tiny diagnostic
    const type =
      value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
    throw new Error(`${fieldName} 必须为字符串（无法从 ${type} 提取文本）`);
  }

  private buildRetryPrompt(validationError: string): string {
    return (
      '你上一次输出的 JSON 不符合约束，错误原因如下：\n' +
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
      '5. 输出必须只有 JSON，不要有任何额外文字或 Markdown 标记。'
    );
  }

  private normalizeAlignedLines(input: {
    enLines: string[];
    zhLines: string[];
  }): {
    enLines: string[];
    zhLines: string[];
  } {
    const en = input.enLines.map((x) => String(x ?? '').trim());
    const zh = input.zhLines.map((x) => String(x ?? '').trim());

    // If length differs, allow trimming only-empty tail on the longer side.
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
      // Keep as-is; caller will throw with a clear error.
      return { enLines: en, zhLines: zh };
    }

    // Drop rows where both sides are empty (keeps alignment).
    const outEn: string[] = [];
    const outZh: string[] = [];
    for (let i = 0; i < en.length; i++) {
      const e = en[i] ?? '';
      const z = zh[i] ?? '';
      if (!e && !z) continue;
      outEn.push(e);
      outZh.push(z);
    }
    return { enLines: outEn, zhLines: outZh };
  }

  setProvider(provider: OCRProvider) {
    this.provider = provider;
  }

  async imageToText(file: Express.Multer.File): Promise<string> {
    if (this.provider === OCRProvider.LOCAL) {
      return this.localOCR(file.buffer);
    } else if (this.provider === OCRProvider.QWEN) {
      const result = await this.qwenOCR(file.buffer);
      return result.originalText; // 返回原文以保持兼容性
    } else {
      return this.localOCR(file.buffer);
    }
  }

  async imageToTextStructured(file: Express.Multer.File): Promise<{
    originalText: string;
    chineseText: string;
    englishText: string;
  }> {
    if (this.provider === OCRProvider.QWEN) {
      return this.qwenOCR(file.buffer);
    } else {
      // 本地 OCR：暂时只返回原文，中文/英文字段留空
      const text = await this.localOCR(file.buffer);
      return {
        originalText: text,
        chineseText: '',
        englishText: '',
      };
    }
  }

  private async localOCR(buffer: Buffer): Promise<string> {
    this.logger.log('Starting local OCR with Tesseract (English + Chinese)...');
    try {
      // 指定更多的 worker 选项，防止下载失败导致崩溃
      const worker = await createWorker(['eng', 'chi_sim'], 1, {
        logger: (m: { status?: string; progress?: number }) => {
          if (
            m?.status === 'recognizing text' &&
            typeof m.progress === 'number'
          ) {
            this.logger.debug(
              `OCR Progress: ${(m.progress * 100).toFixed(2)}%`,
            );
          }
        },
        errorHandler: (err: unknown) =>
          this.logger.error('Tesseract Worker Error:', err),
      });

      const {
        data: { text },
      } = await worker.recognize(buffer);
      await worker.terminate();
      return text;
    } catch (error: unknown) {
      const msg = this.getErrorMessage(error);
      this.logger.error(`Local OCR failed: ${msg}`);
      throw new Error(
        `OCR 识别失败: ${msg}。请检查网络是否能访问语言包下载地址。`,
      );
    }
  }

  private async qwenOCR(buffer: Buffer): Promise<{
    originalText: string;
    chineseText: string;
    englishText: string;
  }> {
    const config = getQwenConfig();

    if (!config.apiKey) {
      throw new Error('Qwen API Key (DASHSCOPE_API_KEY) not provided');
    }

    this.logger.log('Calling Qwen OCR API (DashScope compatible mode)...');

    try {
      // 使用 OpenAI SDK 兼容模式
      const client = new OpenAI({
        apiKey: config.apiKey,
        baseURL:
          config.baseUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      });

      // 将图片 buffer 转换为 base64
      const base64Image = buffer.toString('base64');
      const mimeType = 'image/jpeg'; // 默认 JPEG，可以根据实际文件类型调整
      // 使用 VL 模型进行 OCR（视觉语言模型可以识别图片中的文字）
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
                text:
                  '请严格分析这张图片中的文本内容，并按以下结构化格式提取信息：\n' +
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

      // 解析返回结果（期望为 JSON 对象）
      const rawContent = completion.choices[0]?.message?.content;

      if (!rawContent) {
        throw new Error('千问 OCR 返回内容为空');
      }

      // 打印原始返回内容（用于调试）
      this.logger.log('=== 千问 OCR 原始返回内容 ===');
      this.logger.log(rawContent);
      this.logger.log('=== 原始返回内容结束 ===');

      let parsed: unknown;
      try {
        parsed = JSON.parse(
          typeof rawContent === 'string' ? rawContent : String(rawContent),
        );
      } catch {
        this.logger.error(
          `Qwen OCR JSON parse failed. Raw content: ${rawContent}`,
        );
        throw new Error('千问 OCR 返回的不是合法 JSON，请检查提示词或模型配置');
      }

      // 打印解析后的 JSON 对象（用于调试）
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

      // 打印 originalText（用于调试）
      this.logger.log(`=== originalText (长度: ${originalText.length}) ===`);
      this.logger.log(originalText);
      this.logger.log('=== originalText 结束 ===');

      // Prefer `sentencePairs` and `wordPairs` to avoid length mismatch
      type Pair = { en: string; zh: string };
      let enLines: string[] = [];
      let zhLines: string[] = [];

      const extractPairs = (raw: unknown, label: string): Pair[] => {
        if (!Array.isArray(raw)) return [];
        const result: Pair[] = [];
        for (let idx = 0; idx < raw.length; idx++) {
          const item: unknown = raw[idx];
          if (!this.isRecord(item)) continue;
          try {
            const en = this.coercePairText(item.en, `${label}[${idx}].en`).trim();
            const zh = this.coercePairText(item.zh, `${label}[${idx}].zh`).trim();
            if (en && zh) {
              result.push({ en, zh });
            }
          } catch (e) {
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

        this.logger.log(
          `=== 解析后的数据 (句子: ${sentencePairs.length}, 单词: ${wordPairs.length}) ===`,
        );
      } else {
        const zhLinesRaw: unknown[] = Array.isArray(parsed.zhLines)
          ? parsed.zhLines
          : [];
        const enLinesRaw: unknown[] = Array.isArray(parsed.enLines)
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

        // 打印解析后的 enLines/zhLines（用于调试）
        this.logger.log(
          `=== 解析后的 enLines/zhLines (en=${enLines.length}, zh=${zhLines.length}) ===`,
        );
        for (let i = 0; i < Math.max(enLines.length, zhLines.length); i++) {
          this.logger.log(
            `[${i}] en="${enLines[i] || ''}", zh="${zhLines[i] || ''}"`,
          );
        }
        this.logger.log('=== enLines/zhLines 结束 ===');
      }

      // 信任千问返回的对齐结果，不再进行冗余的 normalizeAlignedLines 处理
      // const normalized = this.normalizeAlignedLines({ enLines, zhLines });
      // enLines = normalized.enLines;
      // zhLines = normalized.zhLines;

      // 打印最终解析结果（用于调试）
      this.logger.log(
        `=== 最终解析结果 (en=${enLines.length}, zh=${zhLines.length}) ===`,
      );
      for (let i = 0; i < enLines.length; i++) {
        this.logger.log(`[${i}] en="${enLines[i]}", zh="${zhLines[i]}"`);
      }
      this.logger.log('=== 最终解析结果结束 ===');

      if (!originalText) throw new Error('千问 OCR originalText 为空');
      if (zhLines.length === 0 || enLines.length === 0) {
        throw new Error('千问 OCR pairs 或 enLines/zhLines 为空');
      }
      if (zhLines.length !== enLines.length) {
        throw new Error(
          `千问 OCR zhLines/enLines 长度不一致：zh=${zhLines.length}, en=${enLines.length}`,
        );
      }

      const validateOrThrow = (z: string[], e: string[]) => {
        // 只检查内容纯度，不检查完整性（originalText 可能包含音标、注释等，不需要全部提取）
        for (let i = 0; i < z.length; i++) {
          const zh = z[i] || '';
          const en = e[i] || '';

          if (this.containsLatin(zh)) {
            throw new Error(`第 ${i + 1} 行 zhLines 含英文：${zh}`);
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
      } catch (e) {
        // One retry: ask Qwen to rewrite the JSON strictly without IPA/explanations.
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

        const retryParsed: unknown = JSON.parse(
          typeof retryRaw === 'string' ? retryRaw : String(retryRaw),
        );

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
        let enLines2: string[] = [];
        let zhLines2: string[] = [];

        if (allPairs2.length > 0) {
          enLines2 = allPairs2.map((p) => p.en);
          zhLines2 = allPairs2.map((p) => p.zh);
        } else {
          const zhLinesRaw2: unknown[] = Array.isArray(retryParsed.zhLines)
            ? retryParsed.zhLines
            : [];
          const enLinesRaw2: unknown[] = Array.isArray(retryParsed.enLines)
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

        if (!originalText2) throw new Error('千问 OCR 重试 originalText 为空');
        if (zhLines2.length === 0 || enLines2.length === 0) {
          throw new Error('千问 OCR 重试 zhLines/enLines 为空');
        }
        if (zhLines2.length !== enLines2.length) {
          throw new Error(
            `千问 OCR 重试 zhLines/enLines 长度不一致：zh=${zhLines2.length}, en=${enLines2.length}`,
          );
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

      // 打印最终返回的数据（用于调试）
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
    } catch (error: unknown) {
      const msg = this.getErrorMessage(error);
      this.logger.error(`Qwen OCR failed: ${msg}`);
      throw new Error(`OCR 识别失败: ${msg}`);
    }
  }

  /**
   * 合并原有内容和新增内容，使用千问API生成结构化的中英文对照
   * @param existingOriginalText 原有原文
   * @param existingChineseText 原有中文文本（按行分隔）
   * @param existingEnglishText 原有英文文本（按行分隔）
   * @param newImagesOCRResults 新增图片的OCR结果数组
   * @returns 合并后的结构化数据
   */
  async mergeAndStructureContent(
    existingOriginalText: string,
    existingChineseText: string,
    existingEnglishText: string,
    newImagesOCRResults: Array<{ originalText: string; chineseText: string; englishText: string }>,
  ): Promise<{
    originalText: string;
    chineseText: string;
    englishText: string;
  }> {
    const config = getQwenConfig();

    if (!config.apiKey) {
      throw new Error('Qwen API Key (DASHSCOPE_API_KEY) not provided');
    }

    this.logger.log('Calling Qwen to merge and structure content...');

    try {
      const client = new OpenAI({
        apiKey: config.apiKey,
        baseURL:
          config.baseUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      });

      // 构建新增内容的文本
      const newOriginalTexts = newImagesOCRResults.map(r => r.originalText).join('\n\n');
      const newChineseLines = newImagesOCRResults
        .flatMap(r => r.chineseText.split(/\r?\n/).map(x => x.trim()).filter(Boolean));
      const newEnglishLines = newImagesOCRResults
        .flatMap(r => r.englishText.split(/\r?\n/).map(x => x.trim()).filter(Boolean));

      // 构建提示词
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

      let parsed: unknown;
      try {
        parsed = JSON.parse(
          typeof rawContent === 'string' ? rawContent : String(rawContent),
        );
      } catch {
        this.logger.error(
          `Qwen merge JSON parse failed. Raw content: ${rawContent}`,
        );
        throw new Error('千问合并返回的不是合法 JSON');
      }

      if (!this.isRecord(parsed)) {
        throw new Error('千问合并返回的 JSON 不是对象');
      }

      if (typeof parsed.originalText !== 'string') {
        throw new Error('千问合并 originalText 不是字符串');
      }

      const originalText = parsed.originalText.trim();

      // 解析 sentencePairs 和 wordPairs
      type Pair = { en: string; zh: string };
      const extractPairs = (raw: unknown, label: string): Pair[] => {
        if (!Array.isArray(raw)) return [];
        const result: Pair[] = [];
        for (let idx = 0; idx < raw.length; idx++) {
          const item: unknown = raw[idx];
          if (!this.isRecord(item)) continue;
          try {
            const en = this.coercePairText(item.en, `${label}[${idx}].en`).trim();
            const zh = this.coercePairText(item.zh, `${label}[${idx}].zh`).trim();
            if (en && zh) {
              result.push({ en, zh });
            }
          } catch (e) {
            this.logger.warn(`${label}[${idx}] 解析失败: ${this.getErrorMessage(e)}`);
          }
        }
        return result;
      };

      const sentencePairs = extractPairs(parsed.sentencePairs, 'sentencePairs');
      const wordPairs = extractPairs(parsed.wordPairs, 'wordPairs');

      // 合并所有 pairs，按顺序输出
      const allPairs = [...sentencePairs, ...wordPairs];
      const zhLines = allPairs.map((p) => p.zh);
      const enLines = allPairs.map((p) => p.en);

      // 验证
      if (!originalText) throw new Error('千问合并 originalText 为空');
      if (zhLines.length === 0 || enLines.length === 0) {
        throw new Error('千问合并 pairs 为空');
      }
      if (zhLines.length !== enLines.length) {
        throw new Error(
          `千问合并 zhLines/enLines 长度不一致：zh=${zhLines.length}, en=${enLines.length}`,
        );
      }

      // 验证纯度
      const validateOrThrow = (z: string[], e: string[]) => {
        for (let i = 0; i < z.length; i++) {
          const zh = z[i] || '';
          const en = e[i] || '';

          if (this.containsLatin(zh)) {
            throw new Error(`第 ${i + 1} 行 zhLines 含英文：${zh}`);
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
    } catch (error: unknown) {
      const msg = this.getErrorMessage(error);
      this.logger.error(`Qwen merge failed: ${msg}`);
      throw new Error(`内容合并失败: ${msg}`);
    }
  }
}
