import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { db } from '@/lib/db';
import { examResults, questions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// TODO: 질문 테이블에 examId 외래 키가 있는지 확인하고, 없다면 스키마 수정 필요
// 또는 questions 테이블에서 examId 기준으로 필터링하는 로직 구현

export async function GET(
  request: Request, // request 객체는 사용하지 않더라도 필요합니다.
  { params }: { params: { sessionId: string } }
) {
  try {
    // 1. 사용자 인증 확인
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const sessionId = params.sessionId;
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // 2. 세션 유효성 검증 (존재 여부, 사용자 소유권, 상태 확인)
    const sessionResult = await db.select({
      id: examResults.id,
      userId: examResults.userId,
      examId: examResults.examId,
      status: examResults.status,
    }).from(examResults)
      .where(eq(examResults.id, sessionId))
      .limit(1);

    if (sessionResult.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const session = sessionResult[0];

    if (session.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden: You do not own this session' }, { status: 403 });
    }

    if (session.status !== 'in_progress') {
      return NextResponse.json({ error: `Session is not in progress (status: ${session.status})` }, { status: 400 });
    }

    // 3. 해당 시험(examId)에 속한 문제 목록 조회
    // questions 테이블에 examId 컬럼이 있다고 가정
    const questionsForSession = await db.select({
      // 필요한 문제 정보만 선택 (정답 정보 제외)
      id: questions.id,
      content: questions.content,
      contentImageId: questions.contentImageId,
      options: questions.options,
      // 필요한 경우 이미지 정보 조인
    }).from(questions)
      .where(eq(questions.examId, session.examId)); // questions 테이블에 examId가 있다고 가정

    if (questionsForSession.length === 0) {
      return NextResponse.json({ error: 'No questions found for this exam session' }, { status: 404 });
    }

    // 4. 문제 목록 반환
    return NextResponse.json(questionsForSession);

  } catch (error) {
    console.error('[GET /api/test/sessions/[sessionId]/questions] Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 