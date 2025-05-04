import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { examResults } from '@/db/schema/examResults';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { resultId: string } }
) {
  try {
    // 1. 사용자 인증
    const { userId } = auth();
    if (!userId) {
      console.warn(`GET /api/exam-results/${params.resultId}: Unauthorized attempt`);
      return NextResponse.json({ message: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }
    console.log(`GET /api/exam-results/${params.resultId}: User ${userId} attempting to fetch result`);

    // 2. resultId 유효성 검사
    const resultId = parseInt(params.resultId, 10);
    if (isNaN(resultId)) {
      console.warn(`GET /api/exam-results/${params.resultId}: Invalid result ID format`);
      return NextResponse.json({ message: '잘못된 결과 ID 형식입니다.' }, { status: 400 });
    }

    // 3. 데이터베이스 조회
    console.log(`GET /api/exam-results/${resultId}: Fetching result from database`);
    const results = await db
      .select()
      .from(examResults)
      .where(eq(examResults.id, resultId))
      .limit(1); // ID는 고유하므로 limit(1)

    // 4. 결과 존재 확인
    if (results.length === 0) {
      console.warn(`GET /api/exam-results/${resultId}: Result not found`);
      return NextResponse.json({ message: '시험 결과를 찾을 수 없습니다.' }, { status: 404 });
    }

    const examResult = results[0];

    // 5. 소유권 확인 (결과의 userId와 요청한 userId 비교)
    if (examResult.userId !== userId) {
      console.warn(`GET /api/exam-results/${resultId}: Forbidden attempt by user ${userId}. Result belongs to ${examResult.userId}`);
      return NextResponse.json({ message: '해당 결과에 접근할 권한이 없습니다.' }, { status: 403 });
    }

    console.log(`GET /api/exam-results/${resultId}: Result found and authorized. Returning data.`);
    // 6. 성공 응답
    return NextResponse.json(examResult, { status: 200 });

  } catch (error: any) {
    console.error(`GET /api/exam-results/${params.resultId}: An error occurred:`, error);
    return NextResponse.json({ message: error.message || '시험 결과 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 