"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServerlessExpressApp = getServerlessExpressApp;
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const core_1 = require("@nestjs/core");
const platform_express_1 = require("@nestjs/platform-express");
const app_module_1 = require("./app.module");
let cachedExpressApp = null;
async function getServerlessExpressApp() {
    if (cachedExpressApp)
        return cachedExpressApp;
    const expressApp = (0, express_1.default)();
    const nestApp = await core_1.NestFactory.create(app_module_1.AppModule, new platform_express_1.ExpressAdapter(expressApp), {
        logger: ['error', 'warn', 'log'],
    });
    nestApp.enableCors({
        origin: true,
        credentials: true,
    });
    await nestApp.init();
    cachedExpressApp = expressApp;
    return expressApp;
}
//# sourceMappingURL=server.js.map