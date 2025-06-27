import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { userQuestionFlags } from '@/db/schema/userQuestionFlags';
import { and, eq } from 'drizzle-orm';

// 북마크/중요 표시 상태 가져오기
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  console.log('[wrong-note/flag API] session:', session);
  
  if (!session?.user?.id) {
    return NextResponse.json({ message: '로그인 필요' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const questionId = searchParams.get('questionId');

  if (!questionId) {
    return NextResponse.json({ message: 'questionId 필요' }, { status: 400 });
  }

  const flags = await db.query.userQuestionFlags.findFirst({
    where: (f, { eq, and }) => 
      and(eq(f.userId, session.user.id), eq(f.questionId, questionId)),
  });

  return NextResponse.json({ 
    flags: flags || { 
      isBookmarked: false, 
      isImportant: false 
    } 
  });
}

// 북마크/중요 표시 설정
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  console.log('[wrong-note/flag POST API] session:', session);
  
  if (!session?.user?.id) {
    return NextResponse.json({ message: '로그인 필요' }, { status: 401 });
  }

  const { questionId, isBookmarked, isImportant } = await req.json();

  if (!questionId) {
    return NextResponse.json({ message: 'questionId 필요' }, { status: 400 });
  }

  // 이미 존재하는지 확인
  const existing = await db.query.userQuestionFlags.findFirst({
    where: (f, { eq, and }) => 
      and(eq(f.userId, session.user.id), eq(f.questionId, questionId)),
  });

  if (existing) {
    // 업데이트
    await db.update(userQuestionFlags)
      .set({ 
        isBookmarked: isBookmarked !== undefined ? isBookmarked : existing.isBookmarked,
        isImportant: isImportant !== undefined ? isImportant : existing.isImportant,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(userQuestionFlags.userId, session.user.id),
          eq(userQuestionFlags.questionId, questionId)
        )
      );
  } else {
    // 새로 생성
    await db.insert(userQuestionFlags).values({
      userId: session.user.id,
      questionId,
      isBookmarked: !!isBookmarked,
      isImportant: !!isImportant,
      updatedAt: new Date()
    });
  }

  return NextResponse.json({ success: true });
}

// 북마크/중요 표시 삭제
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  console.log('[wrong-note/flag DELETE API] session:', session);
  
  if (!session?.user?.id) {
    return NextResponse.json({ message: '로그인 필요' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const questionId = searchParams.get('questionId');
  const type = searchParams.get('type'); // 'bookmark' 또는 'important'

  if (!questionId || !type) {
    return NextResponse.json({ message: 'questionId와 type(bookmark/important) 필요' }, { status: 400 });
  }

  const existing = await db.query.userQuestionFlags.findFirst({
    where: (f, { eq, and }) => 
      and(eq(f.userId, session.user.id), eq(f.questionId, questionId)),
  });

  if (existing) {
    if (type === 'bookmark') {
      await db.update(userQuestionFlags)
        .set({ isBookmarked: false, updatedAt: new Date() })
        .where(
          and(
            eq(userQuestionFlags.userId, session.user.id),
            eq(userQuestionFlags.questionId, questionId)
          )
        );
    } else if (type === 'important') {
      await db.update(userQuestionFlags)
        .set({ isImportant: false, updatedAt: new Date() })
        .where(
          and(
            eq(userQuestionFlags.userId, session.user.id),
            eq(userQuestionFlags.questionId, questionId)
          )
        );
    }
  }

  return NextResponse.json({ success: true });
} 