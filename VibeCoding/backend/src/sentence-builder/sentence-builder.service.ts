import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { getDeepSeekConfig } from '../config/deepseek.config';
import { PrismaService } from '../prisma/prisma.service';
import { SavedSentenceSource } from '@prisma/client';

export type SceneLexiconToken = { id: string; text: string };

export type SceneLexicon = {
  scene: string;
  requiredWord?: string;
  corePhrases?: SceneLexiconToken[];
  subjects: SceneLexiconToken[];
  verbs: SceneLexiconToken[];
  objects: SceneLexiconToken[];
  modifiers: SceneLexiconToken[];
  suggestedSentences?: string[];
};

export type CurrentSelectionToken = {
  category: 'core' | 'subject' | 'verb' | 'modifier' | 'object';
  id: string;
  text: string;
};

@Injectable()
export class SentenceBuilderService {
  private readonly logger = new Logger(SentenceBuilderService.name);

  constructor(private readonly prisma: PrismaService) {}

  private extractJsonText(input: string): string {
    let text = (input ?? '').trim();

    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenceMatch?.[1]) {
      text = fenceMatch[1].trim();
    }

    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');
    let start = -1;
    if (firstBrace !== -1) start = firstBrace;
    if (firstBracket !== -1 && (start === -1 || firstBracket < start)) start = firstBracket;
    if (start > 0) text = text.slice(start).trim();

    const lastBrace = text.lastIndexOf('}');
    const lastBracket2 = text.lastIndexOf(']');
    const end = Math.max(lastBrace, lastBracket2);
    if (end !== -1) text = text.slice(0, end + 1).trim();

    return text;
  }

  async generateSceneLexicon(scene: string, level: string, requiredWord?: string): Promise<SceneLexicon> {
    const config = getDeepSeekConfig();
    if (!config.apiKey) throw new Error('DeepSeek API Key not configured');

    const wordLine = requiredWord?.trim()
      ? `目标单词（必须出现在最终句子里）：${requiredWord.trim()}`
      : '目标单词：无';

    const prompt = `
你是一个英语教学专家。用户选择了场景「${scene}」，学习者水平：${level}。
${wordLine}

请只用 JSON 格式回答，不要出现任何解释文字。

输出结构：
{
  "scene": "string",
  "requiredWord": "string | null",
  "corePhrases": [ { "id": "core_1", "text": "..." }, ... ],
  "subjects": [ { "id": "subj_1", "text": "I" }, ... ],
  "verbs":    [ { "id": "verb_1", "text": "would like to check in" }, ... ],
  "objects":  [ { "id": "obj_1", "text": "my luggage" }, ... ],
  "modifiers":[ { "id": "mod_1", "text": "at the counter" }, ... ],
  "suggestedSentences": ["...", "..."]
}

要求：
1. 每类 5~10 个词组，全部与场景紧密相关、自然地道。
2. 每个元素必须有唯一 id（字符串），方便前端索引。
3. 如果提供了目标单词 requiredWord：
   - corePhrases 必须是该词在该场景下的高频固定搭配/常用短语（collocations/chunks），每个都必须包含 requiredWord（大小写不敏感）。
   - corePhrases 建议 6~12 条，尽量可直接拿来做“句子核心部分”。
   - 你生成的 objects/modifiers/verbs 必须围绕该词的高频搭配（collocations），并确保用户随便拼一拼就很容易把该词用进去。
   - 至少一半的 objects 必须直接包含 requiredWord（例如包含 requiredWord 的名词短语/介词短语）。
   - suggestedSentences 生成 3~5 句“不同表达”，每句都必须包含 requiredWord（大小写不敏感），且与场景匹配。
4. 词组要适合自由拼接成多个句子，不要太长。
5. 严格保证是合法 JSON，不能出现注释或多余文本。
`;

    const resp = await axios.post(
      config.baseUrl || 'https://api.deepseek.com/chat/completions',
      {
        model: config.model,
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful language teaching expert. Output only JSON as requested.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const raw = String(resp.data?.choices?.[0]?.message?.content ?? '');
    const jsonText = this.extractJsonText(raw);
    const parsed = JSON.parse(jsonText) as SceneLexicon;
    if (requiredWord?.trim()) parsed.requiredWord = requiredWord.trim();
    return parsed;
  }

  async evaluateSentence(payload: {
    scene: string;
    word?: string;
    sentence: string;
    userLevel: string;
  }) {
    const config = getDeepSeekConfig();
    if (!config.apiKey) throw new Error('DeepSeek API Key not configured');

    const { scene, word, sentence, userLevel } = payload;
    const wordHint = word?.trim()
      ? `目标单词（必须使用）：${word.trim()}`
      : '目标单词：无';

    const prompt = `
你是资深英语教师，帮学生评估一个句子并给出学习建议。

场景：${scene}
学生水平：${userLevel}
${wordHint}
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
1. 如果提供了目标单词，则要检查学生句子是否使用了该词；如果没用到，在 corrections 里给一个“包含该词”的改写建议（suggested 必须包含该词，大小写不敏感）。
2. 如果句子有小问题，用 corrections 给出精确修改建议。
2. explanations 面向中国学习者，用中文解释。
3. suggestedExamples 给 3~5 个“不同表达”的例句：如果提供了目标单词，则每句都必须包含该词（大小写不敏感）。
4. 严格 JSON 格式，不要输出任何多余文字。
`;

    const resp = await axios.post(
      config.baseUrl || 'https://api.deepseek.com/chat/completions',
      {
        model: config.model,
        messages: [
          {
            role: 'system',
            content:
              'You are a professional English teacher. Output strict JSON as requested.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const raw = String(resp.data?.choices?.[0]?.message?.content ?? '');
    const jsonText = this.extractJsonText(raw);
    return JSON.parse(jsonText);
  }

  async suggestNextTokens(payload: {
    scene: string;
    currentTokens: Array<string | CurrentSelectionToken>;
    allOptions: SceneLexicon;
  }) {
    const config = getDeepSeekConfig();
    if (!config.apiKey) throw new Error('DeepSeek API Key not configured');

    const normalizedCurrent = (payload.currentTokens ?? []).map((t: any) => {
      if (typeof t === 'string') return { category: 'unknown', id: '', text: t };
      return {
        category: String(t?.category ?? 'unknown'),
        id: String(t?.id ?? ''),
        text: String(t?.text ?? ''),
      };
    });

    const prompt = `
你是一个智能写作辅助系统，帮助学生在场景下造句。

场景：${payload.scene}
当前已选词块（按顺序，结构化）：${JSON.stringify(normalizedCurrent, null, 2)}

所有可选词块（按分类）：
${JSON.stringify(payload.allOptions, null, 2)}

请只输出 JSON，结构如下：
{
  "nextCategory": "subjects | verbs | objects | modifiers | done",
  "recommendedIds": ["token_id_1", "token_id_2"],
  "recommendations": [
    { "id": "token_id_1", "reasonZh": "一句话说明为什么推荐它（中文，<=12字）" }
  ]
}

要求：
1. 如果 allOptions.requiredWord 存在且还没选出一个“核心搭配”（优先从 allOptions.corePhrases 里选一个包含 requiredWord 的短语），则 nextCategory 必须是 "objects"，recommendedIds 必须优先返回 corePhrases 里的 1~3 个 id。
2. 如果核心搭配已选（currentTokens 中存在 category 为 "core" 或 "object" 的项，且该项 id 形如 "core_*" 或其 text 与 corePhrases 某项相同），则按造句顺序推荐：subjects -> verbs -> modifiers。
3. 如果句子已经基本完整，请返回 nextCategory 为 "done"，recommendedIds 为空数组。
4. recommendedIds 里的 id 必须来自给定的 allOptions，数量 1~3 个。
5. recommendations 需要与 recommendedIds 对应，数量一致（1~3 个）。
   - reasonZh 必须为【纯中文】短句（6~12个汉字），不要英文、不要数字、不要标点、不要换行、不要提到 requiredWord 本身。
6. 严格 JSON 格式。
`;

    const resp = await axios.post(
      config.baseUrl || 'https://api.deepseek.com/chat/completions',
      {
        model: config.model,
        messages: [
          {
            role: 'system',
            content:
              'You are an assistant that suggests next tokens. Output JSON only.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const raw = String(resp.data?.choices?.[0]?.message?.content ?? '');
    const jsonText = this.extractJsonText(raw);
    return JSON.parse(jsonText) as {
      nextCategory: 'subjects' | 'verbs' | 'objects' | 'modifiers' | 'done';
      recommendedIds: string[];
    };
  }

  private normalizeWord(word: string): string {
    return (word ?? '').trim();
  }

  private normalizeScene(scene: string): string {
    return (scene ?? '').trim();
  }

  private normalizeSentence(sentence: string): string {
    return String(sentence ?? '').trim().replace(/\s+/g, ' ');
  }

  private sentenceContainsWord(sentence: string, word: string): boolean {
    const s = this.normalizeSentence(sentence).toLowerCase();
    const w = this.normalizeWord(word).toLowerCase();
    if (!w) return true;
    // Word boundary-ish match, but also allow simple substring for phrases like "carry-on luggage"
    if (s.includes(w)) return true;
    return false;
  }

  async saveSentence(input: {
    word: string;
    scene: string;
    sentence: string;
    source?: SavedSentenceSource | string;
  }) {
    const word = this.normalizeWord(input.word);
    const scene = this.normalizeScene(input.scene);
    const sentence = this.normalizeSentence(input.sentence);

    if (!word) throw new Error('word is required');
    if (!scene) throw new Error('scene is required');
    if (!sentence) throw new Error('sentence is required');
    if (!this.sentenceContainsWord(sentence, word)) {
      throw new Error(`sentence must contain word: ${word}`);
    }

    const source = (String(input.source ?? 'USER').toUpperCase() as SavedSentenceSource) ?? 'USER';
    const allowed: SavedSentenceSource[] = ['USER', 'SUGGESTED', 'EVAL'];
    const finalSource: SavedSentenceSource = allowed.includes(source) ? source : 'USER';

    // Ensure the word exists in wordbook (create if absent)
    await this.prisma.userWord.upsert({
      where: { word },
      create: { word, status: 'LEARNING' },
      update: {},
    });

    return this.prisma.savedSentence.upsert({
      where: { word_scene_sentence: { word, scene, sentence } },
      create: { word, scene, sentence, source: finalSource },
      update: { source: finalSource },
    });
  }

  async listSavedSentences(input: { word: string; scene?: string }) {
    const word = this.normalizeWord(input.word);
    const scene = input.scene ? this.normalizeScene(input.scene) : '';
    if (!word) throw new Error('word is required');

    return this.prisma.savedSentence.findMany({
      where: {
        word,
        ...(scene ? { scene } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteSavedSentence(id: string) {
    const sid = String(id ?? '').trim();
    if (!sid) throw new Error('id is required');
    await this.prisma.savedSentence.delete({ where: { id: sid } });
    return { id: sid, deleted: true };
  }
}


