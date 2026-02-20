"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServerlessExpressApp = getServerlessExpressApp;
if (process.env.NODE_ENV !== 'production') {
    try {
        require('dotenv/config');
    }
    catch (e) {
    }
}
const express_1 = __importDefault(require("express"));
const core_1 = require("@nestjs/core");
const platform_express_1 = require("@nestjs/platform-express");
const app_module_1 = require("./app.module");
let cachedExpressApp = null;
async function getServerlessExpressApp() {
    if (cachedExpressApp) {
        return cachedExpressApp;
    }
    try {
        console.log('Initializing NestJS app for serverless...');
        const expressApp = (0, express_1.default)();
        const nestApp = await core_1.NestFactory.create(app_module_1.AppModule, new platform_express_1.ExpressAdapter(expressApp), {
            logger: ['error', 'warn', 'log'],
        });
        nestApp.enableCors({
            origin: true,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
            exposedHeaders: ['Content-Type', 'Content-Length'],
            maxAge: 86400,
        });
        await nestApp.init();
        console.log('NestJS app initialized successfully');
        cachedExpressApp = expressApp;
        return expressApp;
    }
    catch (error) {
        console.error('Failed to initialize NestJS app:', error);
        throw error;
    }
}
//# sourceMappingURL=server.js.map