export type QwenConfig = {
    apiKey?: string;
    baseUrl?: string;
    ocrModel?: string;
    vlModel?: string;
    textModel?: string;
};
export declare function getQwenConfig(): QwenConfig;
