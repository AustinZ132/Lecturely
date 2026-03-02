import { NextResponse } from 'next/server';

export const runtime = 'edge'; // 使用边缘计算，确保测出的是最真实的机房延迟

export async function GET() {
  return NextResponse.json({ status: 'pong' }, { status: 200 });
}