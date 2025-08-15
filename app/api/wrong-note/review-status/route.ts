import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { userQuestionReviewStatus } from '@/db/schema/userQuestionReviewStatus';
import { and, eq } from 'drizzle-orm';

// 복습 상태 가져오기
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  console.log('[wrong-note/review-status API] session:', session);
  
  if (!session?.user?.id) {
    return NextResponse.json({ message: '로그인 필요' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const questionId = searchParams.get('questionId');

  if (!questionId) {
    return NextResponse.json({ message: 'questionId 필요' }, { status: 400 });
  }

  const status = await db.query.userQuestionReviewStatus.findFirst({
    where: (s, { eq, and }) => 
      and(eq(s.userId, session.user.id), eq(s.questionId, questionId)),
  });

  return NextResponse.json({ 
    status: status || { 
      reviewStatus: 0,
      retryCount: 0,
      correctRetryCount: 0,
      lastReviewedAt: null,
      nextReviewDate: null
    }
  });
}

// 복습 상태 업데이트
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  console.log('[wrong-note/review-status POST API] session:', session);
  
  if (!session?.user?.id) {
    return NextResponse.json({ message: '로그인 필요' }, { status: 401 });
  }

  const { questionId, reviewStatus, isCorrect } = await req.json();

  if (!questionId) {
    return NextResponse.json({ message: 'questionId 필요' }, { status: 400 });
  }

  // 현재 날짜, 다음 복습 날짜 계산
  const now = new Date();
  
  // 간격 반복 학습을 위한 다음 복습 날짜 계산 (1일, 3일, 7일, 14일 간격)
  const calcNextReviewDate = (reviewStatus: number, retryCount: number) => {
    // 완료 상태(2)이면 다음 복습 날짜 설정 안함
    if (reviewStatus === 2) return null;
    
    // 재시도 횟수에 따라 간격 조정 (맞은 횟수가 많을수록 간격이 길어짐)
    let interval = 1; // 기본 1일
    if (retryCount > 0) {
      if (retryCount >= 3) interval = 14; // 3회 이상: 14일
      else if (retryCount >= 2) interval = 7; // 2회: 7일
      else interval = 3; // 1회: 3일
    }
    
    const nextDate = new Date(now);
    nextDate.setDate(nextDate.getDate() + interval);
    return nextDate;
  };

  // 이미 존재하는지 확인
  const existing = await db.query.userQuestionReviewStatus.findFirst({
    where: (s, { eq, and }) => 
      and(eq(s.userId, session.user.id), eq(s.questionId, questionId)),
  });

  if (existing) {
    // 재시도 횟수 업데이트
    const newRetryCount = existing.retryCount + 1;
    const newCorrectRetryCount = isCorrect 
      ? existing.correctRetryCount + 1 
      : existing.correctRetryCount;
    
    // reviewStatus가 명시적으로 제공되지 않은 경우 자동 계산
    const newReviewStatus = reviewStatus !== undefined 
      ? reviewStatus 
      : (newCorrectRetryCount >= 3 ? 2 : 1); // 3번 이상 맞추면 완료(2), 아니면 복습 중(1)
    
    const nextReviewDate = calcNextReviewDate(newReviewStatus, newCorrectRetryCount);

    await db.update(userQuestionReviewStatus)
      .set({ 
        reviewStatus: newReviewStatus,
        retryCount: newRetryCount,
        correctRetryCount: newCorrectRetryCount,
        lastReviewedAt: now,
        nextReviewDate,
        updatedAt: now
      })
      .where(
        and(
          eq(userQuestionReviewStatus.userId, session.user.id),
          eq(userQuestionReviewStatus.questionId, questionId)
        )
      );
  } else {
    // 새로 생성
    const newCorrectRetryCount = isCorrect ? 1 : 0;
    const newReviewStatus = reviewStatus !== undefined ? reviewStatus : 1; // 기본값: 복습 중(1)
    const nextReviewDate = calcNextReviewDate(newReviewStatus, newCorrectRetryCount);

    await db.insert(userQuestionReviewStatus).values({
      userId: session.user.id,
      questionId,
      reviewStatus: newReviewStatus,
      retryCount: 1,
      correctRetryCount: newCorrectRetryCount,
      lastReviewedAt: now,
      nextReviewDate,
      updatedAt: now
    });
  }

  return NextResponse.json({ success: true });
}

// 특정 복습 상태로 설정
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  console.log('[wrong-note/review-status PUT API] session:', session);
  
  if (!session?.user?.id) {
    return NextResponse.json({ message: '로그인 필요' }, { status: 401 });
  }

  const { questionId, reviewStatus } = await req.json();

  if (!questionId || reviewStatus === undefined) {
    return NextResponse.json({ message: 'questionId와 reviewStatus 필요' }, { status: 400 });
  }

  const now = new Date();
  const existing = await db.query.userQuestionReviewStatus.findFirst({
    where: (s, { eq, and }) => 
      and(eq(s.userId, session.user.id), eq(s.questionId, questionId)),
  });

  if (existing) {
    const nextReviewDate = reviewStatus === 2 ? null : (existing.nextReviewDate || null);
    
    await db.update(userQuestionReviewStatus)
      .set({ 
        reviewStatus,
        nextReviewDate,
        updatedAt: now
      })
      .where(
        and(
          eq(userQuestionReviewStatus.userId, session.user.id),
          eq(userQuestionReviewStatus.questionId, questionId)
        )
      );
  } else {
    await db.insert(userQuestionReviewStatus).values({
      userId: session.user.id,
      questionId,
      reviewStatus,
      retryCount: 0,
      correctRetryCount: 0,
      lastReviewedAt: null,
      nextReviewDate: null,
      updatedAt: now
    });
  }

  return NextResponse.json({ success: true });
} 