"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQwenConfig = getQwenConfig;
function getQwenConfig() {
    const apiKey = process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY;
    const baseUrl = process.env.QWEN_BASE_URL || process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    const ocrModel = process.env.QWEN_OCR_MODEL || 'ocr_recognize';
    const vlModel = process.env.QWEN_VL_MODEL || 'qwen3-vl-flash';
    const textModel = process.env.QWEN_TEXT_MODEL || 'qwen-turbo';
    return {
        apiKey,
        baseUrl,
        ocrModel,
        vlModel,
        textModel,
    };
}
//# sourceMappingURL=qwen.config.js.map