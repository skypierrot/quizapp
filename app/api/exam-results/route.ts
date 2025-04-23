import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db'; // Assuming your Drizzle instance is exported from db/index.ts
import { examResults, INewExamResult } from '@/db/schema/examResults'; // Import schema and type
import { questions } from '@/db/schema/questions'; // Import questions schema
import { inArray } from 'drizzle-orm'; // Import inArray
import { IQuestion } from '@/types'; // For fetching correct answers later

interface IExamResultPayload {
  examName: string;
  examYear: number;
  examSession: string;
  answers: Array<{ questionId: string; selectedOptionIndex: number | null }>;
  elapsedTime: number; // 초 단위
  limitTime?: number; // 초 단위 (선택적)
  totalQuestions: number;
  correctCount: number; // 클라이언트에서 미리 계산해서 보낼 수도 있고, 서버에서 계산할 수도 있음
  score: number;        // 클라이언트에서 미리 계산해서 보낼 수도 있고, 서버에서 계산할 수도 있음
}

export async function POST(request: Request) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: IExamResultPayload = await request.json();

    console.log('Received exam result submission:', { userId, ...body });

    // TODO: 데이터베이스에 결과 저장 로직 구현 (IExamResult 스키마 사용)
    // 1. body 데이터 유효성 검증
    // 2. 필요한 경우 서버에서 채점 (correctCount, score 계산)
    // 3. db.insert(examResults).values(...) 실행

    // 임시 성공 응답
    return NextResponse.json({ message: 'Exam result submitted successfully (pending save)', data: { userId, ...body } }, { status: 201 });

  } catch (error) {
    console.error('Error submitting exam result:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to submit exam result' }, { status: 500 });
  }
} 