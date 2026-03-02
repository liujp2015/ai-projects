"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
exports.GET = GET;
exports.DELETE = DELETE;
const server_1 = require("next/server");
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';
function getSuffixFromPathname(pathname) {
    const prefix = '/api/sentence-builder/';
    if (pathname === '/api/sentence-builder')
        return '';
    if (pathname.startsWith(prefix))
        return pathname.slice(prefix.length);
    return '';
}
async function POST(req) {
    const suffix = getSuffixFromPathname(new URL(req.url).pathname);
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
async function GET(req) {
    const url = new URL(req.url);
    const suffix = getSuffixFromPathname(url.pathname);
    const res = await fetch(`${API_BASE_URL}/sentence-builder/${suffix}${url.search}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
    const text = await res.text();
    try {
        return server_1.NextResponse.json(JSON.parse(text), { status: res.status });
    }
    catch {
        return server_1.NextResponse.json({ raw: text }, { status: res.status });
    }
}
async function DELETE(req) {
    const url = new URL(req.url);
    const suffix = getSuffixFromPathname(url.pathname);
    const res = await fetch(`${API_BASE_URL}/sentence-builder/${suffix}${url.search}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
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