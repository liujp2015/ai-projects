"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
exports.PUT = PUT;
exports.PATCH = PATCH;
exports.DELETE = DELETE;
const server_1 = require("next/server");
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';
async function GET(req) {
    return proxyRequest(req, 'GET');
}
async function POST(req) {
    return proxyRequest(req, 'POST');
}
async function PUT(req) {
    return proxyRequest(req, 'PUT');
}
async function PATCH(req) {
    return proxyRequest(req, 'PATCH');
}
async function DELETE(req) {
    return proxyRequest(req, 'DELETE');
}
async function proxyRequest(req, method) {
    try {
        const url = new URL(req.url);
        const path = url.pathname.replace(/^\/api/, '');
        const backendUrl = `${API_BASE_URL}${path}${url.search}`;
        let body;
        const contentType = req.headers.get('content-type');
        if (method !== 'GET' && method !== 'DELETE') {
            if (contentType?.includes('multipart/form-data')) {
                body = await req.formData();
            }
            else {
                try {
                    body = await req.text();
                }
                catch {
                    body = undefined;
                }
            }
        }
        const headers = {};
        req.headers.forEach((value, key) => {
            const lowerKey = key.toLowerCase();
            if (lowerKey !== 'host' &&
                lowerKey !== 'connection' &&
                lowerKey !== 'content-length') {
                headers[key] = value;
            }
        });
        if (body instanceof FormData) {
            delete headers['content-type'];
            delete headers['Content-Type'];
        }
        else if (body && typeof body === 'string' && body.length > 0) {
            if (!headers['content-type'] && !headers['Content-Type']) {
                headers['Content-Type'] = 'application/json';
            }
        }
        const res = await fetch(backendUrl, {
            method,
            headers,
            body: body,
        });
        const responseContentType = res.headers.get('content-type') || '';
        const isStream = responseContentType.includes('audio') ||
            responseContentType.includes('stream') ||
            responseContentType.includes('octet-stream');
        const responseHeaders = new Headers();
        res.headers.forEach((value, key) => {
            const lowerKey = key.toLowerCase();
            if (lowerKey !== 'connection' &&
                lowerKey !== 'content-encoding' &&
                lowerKey !== 'transfer-encoding') {
                responseHeaders.set(key, value);
            }
        });
        if (isStream) {
            return new server_1.NextResponse(res.body, {
                status: res.status,
                headers: responseHeaders,
            });
        }
        const responseText = await res.text();
        let responseData;
        try {
            responseData = JSON.parse(responseText);
            return server_1.NextResponse.json(responseData, {
                status: res.status,
                headers: responseHeaders,
            });
        }
        catch {
            return new server_1.NextResponse(responseText, {
                status: res.status,
                headers: responseHeaders,
            });
        }
    }
    catch (error) {
        console.error('[API Proxy Error]', error);
        return server_1.NextResponse.json({ error: 'Proxy request failed', message: error.message }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map