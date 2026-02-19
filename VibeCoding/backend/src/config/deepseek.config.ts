export type DeepSeekConfig = {
  apiKey?: string;
  baseUrl?: string;
  model: string;
};

export function getDeepSeekConfig(): DeepSeekConfig {
  return {
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseUrl: process.env.DEEPSEEK_BASE_URL,
    model: process.env.DEEPSEEK_MODEL ?? 'deepseek-chat',
  };
}



