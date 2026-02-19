import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

function getSuffixFromPathname(pathname: string): string {
  // /api/sentence-builder/scene -> scene
  // /api/sentence-builder/next-token -> next-token
  const prefix = '/api/sentence-builder/';
  if (pathname === '/api/sentence-builder') return '';
  if (pathname.startsWith(prefix)) return pathname.slice(prefix.length);
  return '';
}

export async function POST(req: NextRequest) {
  const suffix = getSuffixFromPathname(new URL(req.url).pathname);

  const body = await req.json().catch(() => ({}));

  const res = await fetch(`${API_BASE_URL}/sentence-builder/${suffix}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  try {
    return NextResponse.json(JSON.parse(text), { status: res.status });
  } catch {
    return NextResponse.json({ raw: text }, { status: res.status });
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const suffix = getSuffixFromPathname(url.pathname);

  const res = await fetch(`${API_BASE_URL}/sentence-builder/${suffix}${url.search}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const text = await res.text();
  try {
    return NextResponse.json(JSON.parse(text), { status: res.status });
  } catch {
    return NextResponse.json({ raw: text }, { status: res.status });
  }
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const suffix = getSuffixFromPathname(url.pathname);

  const res = await fetch(`${API_BASE_URL}/sentence-builder/${suffix}${url.search}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  const text = await res.text();
  try {
    return NextResponse.json(JSON.parse(text), { status: res.status });
  } catch {
    return NextResponse.json({ raw: text }, { status: res.status });
  }
}


