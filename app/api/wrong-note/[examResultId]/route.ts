import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { examResults } from '@/db/schema/examResults';
import { questions } from '@/db/schema/questions';
import { eq, inArray } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: Promise<{ examResultId: string }> }) {
  const session = await getServerSession(authOptions);
  console.log('[wrong-note API] session:', session);
  
  if (!session?.user?.id) {
    return NextResponse.json({ message: '로그인 필요' }, { status: 401 });
  }

  // 1. 내 시험 결과만 조회
  const { examResultId } = await params;
  const result = await db.select().from(examResults)
    .where(eq(examResults.id, examResultId));
  if (!result[0] || result[0].userId !== session.user.id) {
    return NextResponse.json({ message: '결과 없음' }, { status: 404 });
  }
  const examResult = result[0];

  // 2. 오답만 추출
  const wrongAnswers = (examResult.answers || []).filter((a: any) => !a.isCorrect);
  if (wrongAnswers.length === 0) {
    return NextResponse.json({ wrongNote: [] });
  }

  // 3. 누적 오답 집계 (userId 기준 모든 examResults에서)
  const allResults = await db.select().from(examResults)
    .where(eq(examResults.userId, session.user.id));
  // questionId별 누적 오답 횟수 집계
  const wrongCountMap: Record<string, number> = {};
  allResults.forEach(r => {
    (r.answers || []).forEach((a: any) => {
      if (!a.isCorrect) {
        wrongCountMap[a.questionId] = (wrongCountMap[a.questionId] || 0) + 1;
      }
    });
  });

  // 4. 오답 문제 상세 정보 조회
  const questionIds = wrongAnswers.map((a: any) => a.questionId);
  const questionList = await db.select().from(questions)
    .where(inArray(questions.id, questionIds));

  // 5. 오답노트 데이터 조합 (누적 오답 횟수 포함)
  const wrongNote = wrongAnswers.map((a: any) => {
    const q = questionList.find((q: any) => q.id === a.questionId);
    return {
      questionId: a.questionId,
      question: q?.content,
      images: q?.images || [],
      options: q?.options || [],
      userAnswer: a.userAnswer,
      correctAnswer: a.correctAnswer,
      explanation: q?.explanation,
      explanationImages: q?.explanationImages || [],
      wrongCount: wrongCountMap[a.questionId] || 1, // 누적 오답 횟수
    };
  });

  // 6. 오답 횟수 기준 정렬(자주 틀리는 문제 우선)
  wrongNote.sort((a, b) => b.wrongCount - a.wrongCount);

  return NextResponse.json({ wrongNote });
} 