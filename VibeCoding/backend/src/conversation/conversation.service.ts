import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OCRService } from '../ai/ocr.service';
import { AIService } from '../ai/ai.service';
import OpenAI from 'openai';
import { getQwenConfig } from '../config/qwen.config';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    private prisma: PrismaService,
    private ocrService: OCRService,
    private aiService: AIService,
  ) {}

  /**
   * 从多张图片中提取对话内容
   */
  async extractConversationFromImages(
    files: Express.Multer.File[],
    title?: string,
  ) {
    this.logger.log(`Extracting conversation from ${files.length} images`);

    // 1. 对每张图片进行 OCR，提取文本
    const imageTexts: Array<{ text: string; index: number }> = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const ocrResult = await this.ocrService.imageToText(files[i]);
        imageTexts.push({ text: ocrResult, index: i });
        this.logger.log(`OCR completed for image ${i + 1}/${files.length}`);
      } catch (error: any) {
        this.logger.error(`OCR failed for image ${i + 1}: ${error.message}`);
        throw new Error(`图片 ${i + 1} OCR 识别失败: ${error.message}`);
      }
    }

    // 2. 将所有文本合并，调用千问提取对话结构
    const allText = imageTexts.map((item) => item.text).join('\n\n---\n\n');
    
    const messages = await this.extractDialogueFromText(allText);

    // 3. 创建对话记录
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

    this.logger.log(
      `Conversation created with ${conversation.messages.length} messages`,
    );

    return conversation;
  }

  /**
   * 使用千问 API 从文本中提取对话结构
   */
  private async extractDialogueFromText(
    text: string,
  ): Promise<Array<{ order: number; speaker: string; content: string }>> {
    const config = getQwenConfig();

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
      const client = new OpenAI({
        apiKey: config.apiKey,
        baseURL:
          config.baseUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      });

      const completion = await client.chat.completions.create({
        model: config.textModel || 'qwen-turbo',
        messages: [
          {
            role: 'system',
            content:
              '你是一个专业的对话提取专家。从文本中提取对话内容并返回 JSON 格式。',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      const raw = String(completion.choices[0]?.message?.content ?? '');
      this.logger.log(`Qwen response: ${raw.substring(0, 500)}`);

      // 提取 JSON
      const jsonText = this.extractJsonText(raw);
      const parsed = JSON.parse(jsonText);

      // 处理响应格式
      let messages: Array<{ order?: number; speaker: string; content: string }> = [];
      if (parsed.messages && Array.isArray(parsed.messages)) {
        messages = parsed.messages;
      } else if (Array.isArray(parsed)) {
        messages = parsed;
      } else {
        // 尝试从对象中提取数组
        const keys = Object.keys(parsed);
        for (const key of keys) {
          if (Array.isArray(parsed[key])) {
            messages = parsed[key];
            break;
          }
        }
      }

      // 验证和规范化
      const normalizedMessages = messages
        .filter((msg) => msg && msg.speaker && msg.content)
        .map((msg, idx) => ({
          order: typeof msg.order === 'number' ? msg.order : idx + 1,
          speaker: String(msg.speaker).trim(),
          content: String(msg.content).trim(),
        }));

      if (normalizedMessages.length === 0) {
        this.logger.warn('No dialogue messages extracted from text');
        // 如果没有提取到对话，返回原始文本作为单个消息
        return [
          {
            order: 1,
            speaker: 'Unknown',
            content: text.substring(0, 1000), // 限制长度
          },
        ];
      }

      return normalizedMessages;
    } catch (error: any) {
      this.logger.error(`Failed to extract dialogue: ${error.message}`);
      throw new Error(`对话提取失败: ${error.message}`);
    }
  }

  /**
   * 提取 JSON 文本（从 markdown code blocks 等中提取）
   */
  private extractJsonText(input: string): string {
    let text = (input ?? '').trim();

    // Remove Markdown code fences like ```json ... ```
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenceMatch?.[1]) {
      text = fenceMatch[1].trim();
    }

    // If the model added leading/trailing commentary, try to slice the JSON object.
    const firstObj = text.indexOf('{');
    if (firstObj > 0) text = text.slice(firstObj).trim();

    // Trim after the last closing brace.
    const lastBrace = text.lastIndexOf('}');
    if (lastBrace !== -1) text = text.slice(0, lastBrace + 1).trim();

    return text;
  }

  /**
   * 获取所有对话列表
   */
  async findAll() {
    return this.prisma.conversation.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        messages: {
          orderBy: { orderIndex: 'asc' },
          take: 1, // 只取第一条消息用于预览
        },
      },
    });
  }

  /**
   * 获取单个对话详情
   */
  async findOne(id: string) {
    return this.prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
  }

  /**
   * 删除对话
   */
  async delete(id: string) {
    return this.prisma.conversation.delete({
      where: { id },
    });
  }
}
