"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const server_1 = require("../src/server");
async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Max-Age', '86400');
        res.statusCode = 204;
        res.end();
        return;
    }
    try {
        const app = await (0, server_1.getServerlessExpressApp)();
        return app(req, res);
    }
    catch (error) {
        console.error('Serverless Function Error:', error);
        if (!res.headersSent) {
            res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
                error: 'Internal Server Error',
                message: error?.message || 'Unknown error',
            }));
        }
    }
}
//# sourceMappingURL=index.js.map