import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/db'; // DB 인스턴스 import
import { examResults, type InsertExamResult } from '@/db/schema'; // InsertExamResult 타입 추가
import type { INewExamResult, IAnswerDetail } from '@/types'; // 타입 import

export async function POST(request: NextRequest) {
  try {
    // Clerk 인증 제거: userId는 요청 본문에서 받거나, 추후 Authentik 인증으로 대체
    let resultData: INewExamResult;
    try {
      const body = await request.json(); 
      resultData = body;
      console.log('POST /api/exam-results: Parsed request body:', resultData);
    } catch (error) {
      console.error('POST /api/exam-results: Failed to parse request body:', error);
      return NextResponse.json({ message: '잘못된 요청 형식입니다.' }, { status: 400 });
    }

    // 데이터 유효성 검사 (userId 등)
    const {
      userId,
      examName,
      examYear,
      examSession,
      answers,
      score,
      correctCount,
      totalQuestions,
      elapsedTime
    } = resultData;
    if (!userId) {
      return NextResponse.json({ message: 'userId가 필요합니다.' }, { status: 400 });
    }

    // DB 저장
    const insertData: InsertExamResult = {
      userId,
      examName,
      examYear,
      examSession,
      answers,
      score,
      correctCount,
      totalQuestions,
      elapsedTime,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const [saved] = await db.insert(examResults).values(insertData).returning();
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error('POST /api/exam-results: Internal error:', error);
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// GET 핸들러 (결과 조회용, 추후 구현)
// export async function GET(request: NextRequest) {
//   // ... 결과 조회 로직 ...
// } 