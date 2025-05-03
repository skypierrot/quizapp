import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

import { db } from '@/lib/db'; // Assuming db instance is exported from here
import { exams, examResults } from '@/db/schema'; // Assuming schemas are exported from here
import { eq } from 'drizzle-orm';

// 입력 스키마 정의 (예시: 시험 ID 또는 상세 정보 필요)
const postSchema = z.object({
  // examId: z.string().uuid(), // 특정 시험 종류를 식별하는 ID
  // 또는 년도, 회차, 과목 등 상세 정보
  examInstanceInfo: z.object({
    year: z.number(),
    session: z.number(),
    subject: z.string().optional(),
    // 필요에 따라 examId 참조 추가
    examId: z.string().uuid().optional(), // 특정 시험 유형 ID
  }),
});

export async function POST(request: Request) {
  try {
    // 1. 사용자 인증 확인
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // 2. 요청 본문 파싱 및 유효성 검사
    const body = await request.json();
    const parseResult = postSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: parseResult.error.format() }, { status: 400 });
    }

    const { examInstanceInfo } = parseResult.data;

    // 3. 해당 시험 정보 및 문제 목록 조회 (예시: examInstanceInfo 기반)
    // 실제로는 examInstanceInfo (year, session 등)를 사용하여 exams 테이블에서 examId를 찾고,
    // 해당 examId에 연결된 questions 테이블에서 문제 ID 목록을 가져와야 합니다.
    // 여기서는 예시로 고정된 값을 사용합니다.
    const examDetails = await db.select().from(exams).where(eq(exams.year, examInstanceInfo.year /* ... 등 조건 추가 */)).limit(1);
    if (!examDetails || examDetails.length === 0) {
      return NextResponse.json({ error: 'Exam not found for the given criteria' }, { status: 404 });
    }
    const targetExamId = examDetails[0].id;

    // TODO: targetExamId에 해당하는 문제 목록(ID만 또는 전체) 조회 로직 추가
    const questionIds = ['uuid-question-1', 'uuid-question-2', /* ... */]; // 실제 조회 로직 필요
    const totalQuestions = questionIds.length;

    if (totalQuestions === 0) {
      return NextResponse.json({ error: 'No questions found for this exam' }, { status: 404 });
    }

    // 4. examResults 테이블에 초기 레코드 생성
    const newExamResult = await db.insert(examResults).values({
      userId,
      examId: targetExamId, // 조회된 시험 ID 사용
      totalQuestions,
      status: 'in_progress', // 기본 상태
      // examInstanceInfo 컬럼이 있다면 여기서 저장
      // startedAt, createdAt 등은 기본값 또는 DB 트리거로 설정됨
    }).returning({ id: examResults.id });

    if (!newExamResult || newExamResult.length === 0) {
      throw new Error('Failed to create exam session');
    }

    const sessionId = newExamResult[0].id;

    // 5. 생성된 세션 ID 반환
    return NextResponse.json({ sessionId });

  } catch (error) {
    console.error('[POST /api/test/sessions] Error:', error);
    // Zod 에러 등 특정 에러 타입에 따라 분기 처리 가능
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 