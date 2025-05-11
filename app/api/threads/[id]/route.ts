import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { threads } from '@/db/schema/threads';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const result = await db.select().from(threads).where(eq(threads.id, id));
  if (!result[0]) {
    return NextResponse.json({ message: '게시글을 찾을 수 없습니다.' }, { status: 404 });
  }
  return NextResponse.json({ thread: result[0] });
} 