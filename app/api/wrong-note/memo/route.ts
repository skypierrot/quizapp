import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { userQuestionMemos } from '@/db/schema/userQuestionMemos';
import { eq, and } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  console.log('[wrong-note/memo API] session:', session);
  
  if (!session?.user?.id) return NextResponse.json({ message: '로그인 필요' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const questionId = searchParams.get('questionId');
  if (!questionId) return NextResponse.json({ message: 'questionId 필요' }, { status: 400 });

  const memo = await db.query.userQuestionMemos.findFirst({
    where: (m, { eq, and }) => and(eq(m.userId, session.user.id), eq(m.questionId, questionId)),
  });

  return NextResponse.json({ memo: memo?.memo || '' });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  console.log('[wrong-note/memo POST API] session:', session);
  
  if (!session?.user?.id) return NextResponse.json({ message: '로그인 필요' }, { status: 401 });

  const { questionId, memo } = await req.json();
  console.log('[WRONG-NOTE-MEMO][POST] questionId:', questionId, 'memo:', memo);

  if (!questionId) return NextResponse.json({ message: 'questionId 필요' }, { status: 400 });

  // upsert: 이미 있으면 update, 없으면 insert
  const exist = await db.query.userQuestionMemos.findFirst({
    where: (m, { eq, and }) => and(eq(m.userId, session.user.id), eq(m.questionId, questionId)),
  });

  if (exist) {
    await db.update(userQuestionMemos)
      .set({ memo, updatedAt: new Date() })
      .where(and(eq(userQuestionMemos.userId, session.user.id), eq(userQuestionMemos.questionId, questionId)));
  } else {
    await db.insert(userQuestionMemos).values({
      userId: session.user.id,
      questionId,
      memo,
      updatedAt: new Date(),
    });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  console.log('[wrong-note/memo DELETE API] session:', session);
  
  if (!session?.user?.id) return NextResponse.json({ message: '로그인 필요' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const questionId = searchParams.get('questionId');
  if (!questionId) return NextResponse.json({ message: 'questionId 필요' }, { status: 400 });

  await db.delete(userQuestionMemos)
    .where(and(eq(userQuestionMemos.userId, session.user.id), eq(userQuestionMemos.questionId, questionId)));
  return NextResponse.json({ ok: true });
} 