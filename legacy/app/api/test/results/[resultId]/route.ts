import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { db } from '@/lib/db';
import { examResults, questions, exams, users } from '@/db/schema'; // Include related tables
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { resultId: string } }
) {
  try {
    // 1. 사용자 인증 확인
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const resultId = params.resultId;
    if (!resultId) {
      return NextResponse.json({ error: 'Result ID is required' }, { status: 400 });
    }

    // 2. 결과 조회 및 소유권 확인
    // 필요한 정보(시험 정보, 사용자 정보 등)를 조인하여 가져옵니다.
    const resultDetails = await db.select({
      result: examResults,
      exam: exams,
      // user: { id: users.id, name: users.name, image: users.image } // 필요한 사용자 정보만 선택
    })
      .from(examResults)
      .where(eq(examResults.id, resultId))
      .leftJoin(exams, eq(examResults.examId, exams.id))
      // .leftJoin(users, eq(examResults.userId, users.id)) // 사용자 정보 필요시 조인
      .limit(1);

    if (resultDetails.length === 0) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }

    const { result, exam } = resultDetails[0];

    if (result.userId !== userId) {
      // 관리자 등 다른 권한 확인 로직 추가 가능
      return NextResponse.json({ error: 'Forbidden: You do not own this result' }, { status: 403 });
    }

    // 3. (선택적) 결과에 포함된 문제 상세 정보 조회 (필요한 경우)
    // result.answers 배열에는 questionId 목록이 이미 포함되어 있습니다.
    // 클라이언트에서 이 ID들을 사용하여 별도로 문제 정보를 요청하거나,
    // 여기서 문제 정보를 추가로 조회하여 응답에 포함시킬 수 있습니다.
    // 예시: const questionIds = result.answers?.map(a => a.questionId) || [];
    //        const relatedQuestions = await db.select().from(questions).where(inArray(questions.id, questionIds));

    // 4. 상세 결과 데이터 반환
    // 필요한 정보만 조합하여 반환합니다.
    const responseData = {
      id: result.id,
      status: result.status,
      score: result.score,
      totalQuestions: result.totalQuestions,
      correctAnswers: result.correctAnswers,
      startedAt: result.startedAt,
      completedAt: result.completedAt,
      timeTakenSeconds: result.timeTakenSeconds,
      answers: result.answers, // 사용자 답안 및 정답 여부 포함
      exam: exam ? { // 시험 정보 포함
        id: exam.id,
        title: exam.title,
        year: exam.year,
        session: exam.session,
        subject: exam.subject,
      } : null,
      // user: user ? { ... } : null, // 사용자 정보 포함
      // relatedQuestions: relatedQuestions, // 문제 상세 정보 포함 (선택적)
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('[GET /api/test/results/[resultId]] Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 