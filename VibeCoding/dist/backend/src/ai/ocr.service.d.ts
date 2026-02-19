export declare enum OCRProvider {
    LOCAL = "local",
    QWEN = "qwen"
}
export declare class OCRService {
    private readonly logger;
    private provider;
    private containsChinese;
    private containsLatin;
    private containsIpaLike;
    private isMostlyAsciiEnglish;
    private extractEnglishTokens;
    private getErrorMessage;
    private isRecord;
    private collectStringLeaves;
    private coercePairText;
    private buildRetryPrompt;
    private normalizeAlignedLines;
    setProvider(provider: OCRProvider): void;
    imageToText(file: Express.Multer.File): Promise<string>;
    imageToTextStructured(file: Express.Multer.File): Promise<{
        originalText: string;
        chineseText: string;
        englishText: string;
    }>;
    private localOCR;
    private qwenOCR;
    mergeAndStructureContent(existingOriginalText: string, existingChineseText: string, existingEnglishText: string, newImagesOCRResults: Array<{
        originalText: string;
        chineseText: string;
        englishText: string;
    }>): Promise<{
        originalText: string;
        chineseText: string;
        englishText: string;
    }>;
}
