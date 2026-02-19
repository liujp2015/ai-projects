export type QwenConfig = {
  apiKey?: string;
  baseUrl?: string;
  ocrModel?: string;
  vlModel?: string;
  textModel?: string;
};

export function getQwenConfig(): QwenConfig {
  // 优先使用 DASHSCOPE_API_KEY（阿里云标准环境变量名），如果没有则使用 QWEN_API_KEY（向后兼容）
  const apiKey = process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY;
  // 使用兼容模式 URL（OpenAI SDK 兼容模式）
  const baseUrl = process.env.QWEN_BASE_URL || process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
  const ocrModel = process.env.QWEN_OCR_MODEL || 'ocr_recognize'; // DashScope OCR 模型名称
  const vlModel = process.env.QWEN_VL_MODEL || 'qwen3-vl-flash'; // DashScope VL 模型名称
  const textModel = process.env.QWEN_TEXT_MODEL || 'qwen-turbo'; // DashScope 文本模型名称
  
  return {
    apiKey,
    baseUrl,
    ocrModel,
    vlModel,
    textModel,
  };
}

