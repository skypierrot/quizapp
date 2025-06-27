import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { threadBookmarks } from '@/db/schema/threads';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

// 북마크 추가/제거
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: '로그인 필요' }, { status: 401 });
  }

  const threadId = params.id;
  const userId = session.user.id;

  try {
    // 기존 북마크 확인
    const existing = await db
      .select()
      .from(threadBookmarks)
      .where(and(
        eq(threadBookmarks.threadId, threadId),
        eq(threadBookmarks.userId, userId)
      ));

    if (existing.length > 0) {
      // 북마크 제거
      await db
        .delete(threadBookmarks)
        .where(eq(threadBookmarks.id, existing[0].id));
      
      return NextResponse.json({ bookmarked: false, message: '북마크가 제거되었습니다.' });
    } else {
      // 북마크 추가
      await db.insert(threadBookmarks).values({
        threadId,
        userId,
      });
      
      return NextResponse.json({ bookmarked: true, message: '북마크가 추가되었습니다.' });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// 북마크 상태 확인
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ bookmarked: false });
  }

  const threadId = params.id;
  const userId = session.user.id;

  try {
    const bookmark = await db
      .select()
      .from(threadBookmarks)
      .where(and(
        eq(threadBookmarks.threadId, threadId),
        eq(threadBookmarks.userId, userId)
      ));

    return NextResponse.json({ bookmarked: bookmark.length > 0 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
} 