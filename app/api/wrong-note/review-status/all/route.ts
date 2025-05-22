import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { userQuestionReviewStatus } from '@/db/schema/userQuestionReviewStatus';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  console.log('[wrong-note/review-status/all API] session:', session);
  
  if (!session?.user?.id) {
    return NextResponse.json({ message: '로그인 필요' }, { status: 401 });
  }

  try {
    // 현재 사용자의 모든 복습 상태 가져오기
    const statuses = await db.query.userQuestionReviewStatus.findMany({
      where: eq(userQuestionReviewStatus.userId, session.user.id)
    });

    // questionId를 키로 하는 객체로 변환
    const statusMap: Record<string, { 
      reviewStatus: number, 
      lastReviewedAt: string | null,
      nextReviewDate: string | null,
      retryCount: number,
      correctRetryCount: number
    }> = {};

    statuses.forEach(status => {
      statusMap[status.questionId] = {
        reviewStatus: status.reviewStatus,
        lastReviewedAt: status.lastReviewedAt ? status.lastReviewedAt.toISOString() : null,
        nextReviewDate: status.nextReviewDate ? status.nextReviewDate.toISOString() : null,
        retryCount: status.retryCount || 0,
        correctRetryCount: status.correctRetryCount || 0
      };
    });

    return NextResponse.json({ statusMap });
  } catch (error) {
    console.error('복습 상태 데이터 조회 실패:', error);
    return NextResponse.json({ message: '서버 오류' }, { status: 500 });
  }
} 