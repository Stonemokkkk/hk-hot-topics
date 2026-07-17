// app/api/tools/route.ts

import { NextResponse } from 'next/server';
import { listTools } from '@/lib/kv';

export async function GET() {
  const tools = await listTools();
  return NextResponse.json({ success: true, data: tools });
}
