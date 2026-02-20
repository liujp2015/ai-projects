import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

// 通用的 API 代理路由，转发所有请求到后端
export async function GET(req: NextRequest) {
  return proxyRequest(req, 'GET');
}

export async function POST(req: NextRequest) {
  return proxyRequest(req, 'POST');
}

export async function PUT(req: NextRequest) {
  return proxyRequest(req, 'PUT');
}

export async function PATCH(req: NextRequest) {
  return proxyRequest(req, 'PATCH');
}

export async function DELETE(req: NextRequest) {
  return proxyRequest(req, 'DELETE');
}

async function proxyRequest(req: NextRequest, method: string) {
  try {
    const url = new URL(req.url);
    // 从 /api/xxx 中提取路径
    const path = url.pathname.replace(/^\/api/, '');
    const backendUrl = `${API_BASE_URL}${path}${url.search}`;

    // 获取请求体
    let body: string | FormData | undefined;
    const contentType = req.headers.get('content-type');
    
    if (method !== 'GET' && method !== 'DELETE') {
      if (contentType?.includes('multipart/form-data')) {
        // FormData 请求
        body = await req.formData();
      } else {
        // JSON 或其他文本请求
        try {
          body = await req.text();
        } catch {
          body = undefined;
        }
      }
    }

    // 构建请求头
    const headers: HeadersInit = {};
    
    // 复制必要的请求头（排除 host 和 connection）
    req.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey !== 'host' &&
        lowerKey !== 'connection' &&
        lowerKey !== 'content-length'
      ) {
        headers[key] = value;
      }
    });

    // 如果是 FormData，不设置 Content-Type（让 fetch 自动处理）
    if (body instanceof FormData) {
      delete (headers as any)['content-type'];
      delete (headers as any)['Content-Type'];
    } else if (body && typeof body === 'string' && body.length > 0) {
      // 确保 JSON 请求有正确的 Content-Type
      if (!headers['content-type'] && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
    }

    // 转发请求到后端
    const res = await fetch(backendUrl, {
      method,
      headers,
      body: body as any,
    });

    // 检查是否是流式响应（如 TTS 音频流）
    const responseContentType = res.headers.get('content-type') || '';
    const isStream = responseContentType.includes('audio') || 
                     responseContentType.includes('stream') ||
                     responseContentType.includes('octet-stream');

    // 复制响应头（排除一些不需要的）
    const responseHeaders = new Headers();
    res.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey !== 'connection' &&
        lowerKey !== 'content-encoding' &&
        lowerKey !== 'transfer-encoding'
      ) {
        responseHeaders.set(key, value);
      }
    });

    // 如果是流式响应，直接返回流
    if (isStream) {
      return new NextResponse(res.body, {
        status: res.status,
        headers: responseHeaders,
      });
    }

    // 否则，处理 JSON 或文本响应
    const responseText = await res.text();
    
    // 尝试解析 JSON，如果失败则返回原始文本
    let responseData: any;
    try {
      responseData = JSON.parse(responseText);
      return NextResponse.json(responseData, {
        status: res.status,
        headers: responseHeaders,
      });
    } catch {
      // 如果不是 JSON，返回原始文本
      return new NextResponse(responseText, {
        status: res.status,
        headers: responseHeaders,
      });
    }
  } catch (error: any) {
    console.error('[API Proxy Error]', error);
    return NextResponse.json(
      { error: 'Proxy request failed', message: error.message },
      { status: 500 }
    );
  }
}

