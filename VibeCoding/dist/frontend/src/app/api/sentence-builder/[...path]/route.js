"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';
async function POST(req, ctx) {
    const path = ctx.params?.path ?? [];
    const suffix = path.join('/');
    const body = await req.json().catch(() => ({}));
    const res = await fetch(`${API_BASE_URL}/sentence-builder/${suffix}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const text = await res.text();
    try {
        return server_1.NextResponse.json(JSON.parse(text), { status: res.status });
    }
    catch {
        return server_1.NextResponse.json({ raw: text }, { status: res.status });
    }
}
//# sourceMappingURL=route.js.map