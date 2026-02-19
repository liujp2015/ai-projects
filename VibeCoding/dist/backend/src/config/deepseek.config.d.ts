export type DeepSeekConfig = {
    apiKey?: string;
    baseUrl?: string;
    model: string;
};
export declare function getDeepSeekConfig(): DeepSeekConfig;
