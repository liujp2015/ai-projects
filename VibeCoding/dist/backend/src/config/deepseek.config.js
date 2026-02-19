"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDeepSeekConfig = getDeepSeekConfig;
function getDeepSeekConfig() {
    return {
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseUrl: process.env.DEEPSEEK_BASE_URL,
        model: process.env.DEEPSEEK_MODEL ?? 'deepseek-chat',
    };
}
//# sourceMappingURL=deepseek.config.js.map