import { NextRequest, NextResponse } from 'next/server';
export declare function POST(req: NextRequest, ctx: {
    params: {
        path?: string[];
    };
}): Promise<NextResponse<any>>;
