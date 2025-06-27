import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('[API PING TEST] Request received at /api/ping');
  return NextResponse.json({ message: "Ping successful from /api/ping!" }, { status: 200 });
} 