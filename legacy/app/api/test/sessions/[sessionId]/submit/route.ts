import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

import { db } from '@/lib/db';
import { examResults, questions } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { IQuestion } from '@/types'; // Assuming IQuestion type is defined here

// 입력 스키마 정의
const submitAnswerSchema = z.object({
  questionId: z.string().uuid(),
  selectedOptionIndex: z.number().nullable(), // 사용자가 답을 선택하지 않았을 수 있음
});

const postSchema = z.object({
  answers: z.array(submitAnswerSchema),
});

export async function POST(
  request: Request,
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
      startedAt: examResults.startedAt, // 시간 계산 위해 필요
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

    // 3. 요청 본문 파싱 및 유효성 검사
    const body = await request.json();
    const parseResult = postSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: parseResult.error.format() }, { status: 400 });
    }
    const { answers: userAnswers } = parseResult.data;

    // 4. 채점을 위해 해당 시험의 모든 문제 정보 조회 (정답 포함)
    const questionIds = userAnswers.map(a => a.questionId);
    const questionsForScoring: Pick<IQuestion, 'id' | 'answerIndex'>[] = await db.select({
      id: questions.id,
      answerIndex: questions.answerIndex, // questions 테이블에 정답 인덱스 컬럼 필요
    }).from(questions)
      .where(inArray(questions.id, questionIds));

    // 조회된 문제 정보를 Map으로 변환하여 빠른 접근
    const questionMap = new Map(questionsForScoring.map(q => [q.id, q]));

    // 5. 채점 수행
    let correctAnswersCount = 0;
    const detailedAnswers = userAnswers.map(userAnswer => {
      const question = questionMap.get(userAnswer.questionId);
      const isCorrect = question ? userAnswer.selectedOptionIndex === question.answerIndex : false;
      if (isCorrect) {
        correctAnswersCount++;
      }
      return {
        questionId: userAnswer.questionId,
        selectedOptionIndex: userAnswer.selectedOptionIndex,
        isCorrect: isCorrect,
      };
    });

    // 6. 점수 및 소요 시간 계산
    const totalQuestions = questionsForScoring.length; // 제출된 답안 기준이 아닌, 실제 시험 문항 수 기준이 더 정확할 수 있음 (session.totalQuestions)
    const score = totalQuestions > 0 ? Math.round((correctAnswersCount / totalQuestions) * 100) : 0;
    const completedAt = new Date();
    const timeTakenSeconds = Math.round((completedAt.getTime() - session.startedAt.getTime()) / 1000);

    // 7. examResults 테이블 업데이트
    const updatedResult = await db.update(examResults)
      .set({
        status: 'completed',
        score: score,
        correctAnswers: correctAnswersCount,
        answers: detailedAnswers,
        completedAt: completedAt,
        timeTakenSeconds: timeTakenSeconds,
        updatedAt: new Date(), // 업데이트 시간 명시
      })
      .where(eq(examResults.id, sessionId))
      .returning({ id: examResults.id });

    if (!updatedResult || updatedResult.length === 0) {
      throw new Error('Failed to update exam session results');
    }

    const resultId = updatedResult[0].id;

    // 8. 업데이트된 결과 ID 반환
    return NextResponse.json({ resultId });

  } catch (error) {
    console.error('[POST /api/test/sessions/[sessionId]/submit] Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 