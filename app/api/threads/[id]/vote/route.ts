import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { threadVotes } from '@/db/schema/threads';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: '로그인 필요' }, { status: 401 });
  }
  const { value } = await req.json(); // 1 또는 -1
  if (![1, -1].includes(value)) {
    return NextResponse.json({ message: '잘못된 값' }, { status: 400 });
  }
  // 기존 투표가 있으면 업데이트, 없으면 생성
  const existing = await db.select().from(threadVotes)
    .where(and(eq(threadVotes.threadId, params.id), eq(threadVotes.userId, session.user.id)));
  if (existing.length > 0) {
    await db.update(threadVotes)
      .set({ value })
      .where(eq(threadVotes.id, existing[0].id));
  } else {
    await db.insert(threadVotes).values({
      threadId: params.id,
      userId: session.user.id,
      value,
    });
  }
  return NextResponse.json({ ok: true });
} 