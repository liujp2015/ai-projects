import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { getDeepSeekConfig } from '../config/deepseek.config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DictionaryService {
  private readonly logger = new Logger(DictionaryService.name);

  constructor(private prisma: PrismaService) {}

  async lookup(word: string) {
    const cleanWord = word.toLowerCase().trim();

    try {
      // 1. 优先从数据库缓存中查找
      const cachedEntry = await this.prisma.dictionaryEntry.findUnique({
        where: { word: cleanWord },
      });

      if (cachedEntry) {
        this.logger.log(`Cache hit for word: "${cleanWord}"`);
        return cachedEntry.data;
      }

      this.logger.log(`Cache miss for word: "${cleanWord}". Calling APIs...`);

      // 2. 如果缓存不存在，则调用 API
      // 2.1 获取英文释义 (Free Dictionary API)
      let englishData: any = null;
      try {
        const response = await axios.get(
          `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`,
        );
        englishData = response.data[0];
      } catch (e) {
        this.logger.warn(
          `No English definition found for "${cleanWord}" from API`,
        );
      }

      // 2.2 使用 DeepSeek 获取中文翻译和详细解析
      const config = getDeepSeekConfig();
      let translation = '';
      let definitionZh = '';

      if (config.apiKey) {
        try {
          const aiResponse = await axios.post(
            config.baseUrl || 'https://api.deepseek.com/chat/completions',
            {
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
            },
            {
              headers: {
                Authorization: `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
              },
            },
          );

          const aiText = aiResponse.data.choices[0].message.content;
          const match = aiText.match(
            /Translation:\s*(.*?)\s*\|\s*Explanation:\s*(.*)/s,
          );
          if (match) {
            translation = match[1].trim();
            definitionZh = match[2].trim();
          } else {
            translation = aiText.split('|')[0].replace('Translation:', '').trim();
            definitionZh = aiText;
          }
        } catch (e) {
          this.logger.error(`DeepSeek translation failed: ${e.message}`);
        }
      }

      const result = {
        word: cleanWord,
        phonetic: englishData?.phonetic || '',
        phonetics: englishData?.phonetics || [],
        translation: translation,
        definitionZh: definitionZh,
        meanings:
          englishData?.meanings.map((m: any) => ({
            partOfSpeech: m.partOfSpeech,
            definitions: m.definitions.slice(0, 3).map((d: any) => ({
              definition: d.definition,
              example: d.example,
            })),
          })) || [],
      };

      // 3. 将结果存入数据库缓存
      try {
        await this.prisma.dictionaryEntry.create({
          data: {
            word: cleanWord,
            phonetic: result.phonetic,
            translation: result.translation,
            definitionZh: result.definitionZh,
            data: result as any,
          },
        });
        this.logger.log(`Word "${cleanWord}" saved to cache.`);
      } catch (dbError) {
        this.logger.error(`Failed to save cache for "${cleanWord}": ${dbError.message}`);
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to lookup word "${cleanWord}": ${error.message}`,
      );
      return {
        word: cleanWord,
        meanings: [],
        translation: '',
        definitionZh: '',
        error: 'Word lookup failed',
      };
    }
  }
}

