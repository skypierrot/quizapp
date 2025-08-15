import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { userQuestionFlags } from '@/db/schema/userQuestionFlags';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  console.log('[wrong-note/flag/all API] session:', session);
  
  if (!session?.user?.id) {
    return NextResponse.json({ message: '로그인 필요' }, { status: 401 });
  }

  try {
    // 현재 사용자의 모든 플래그(북마크, 중요) 가져오기
    const flags = await db.query.userQuestionFlags.findMany({
      where: eq(userQuestionFlags.userId, session.user.id)
    });

    // questionId를 키로 하는 객체로 변환
    const flagsMap: Record<string, { isBookmarked: boolean, isImportant: boolean }> = {};
    flags.forEach(flag => {
      flagsMap[flag.questionId] = {
        isBookmarked: flag.isBookmarked || false,
        isImportant: flag.isImportant || false
      };
    });

    return NextResponse.json({ flags: flagsMap });
  } catch (error) {
    console.error('북마크 및 중요 표시 데이터 조회 실패:', error);
    return NextResponse.json({ message: '서버 오류' }, { status: 500 });
  }
} 