import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server'; // auth 임포트 주석 해제
import { db } from '@/db'; // DB 인스턴스 import
import { examResults, type InsertExamResult } from '@/db/schema'; // InsertExamResult 타입 추가
import type { INewExamResult, IAnswerDetail } from '@/types'; // 타입 import
// import { v4 as uuidv4 } from 'uuid'; // uuid 라이브러리 import 제거

export async function POST(request: NextRequest) {
  try {
    // 1. 사용자 인증 (Clerk auth 사용, await 추가)
    const { userId } = await auth(); // auth() 결과를 await
    if (!userId) {
      console.warn('POST /api/exam-results: Unauthorized attempt - No userId found');
      return NextResponse.json({ message: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }
    console.log(`POST /api/exam-results: User ${userId} attempting to save result`);

    // 2. 요청 본문 파싱
    let resultData: Omit<INewExamResult, 'userId'>; // userId를 제외한 타입 사용
    try {
      // userId가 포함될 수 있으나, 여기서는 사용하지 않음
      const body = await request.json(); 
      resultData = body;
      console.log('POST /api/exam-results: Parsed request body:', resultData);
    } catch (error) {
      console.error('POST /api/exam-results: Failed to parse request body:', error);
      return NextResponse.json({ message: '잘못된 요청 형식입니다.' }, { status: 400 });
    }

    // 임시: 요청 본문에서 userId 가져오기 코드 제거
    // const userId = resultData.userId; 
    // if (!userId) { ... }
    // console.log(`POST /api/exam-results: User ${userId} attempting to save result (temp mode)`);

    // 3. 데이터 유효성 검사 (userId 검사 불필요)
    const {
      examName,
      examYear,
      examSession,
      answers,
      score,
      correctCount,
      totalQuestions,
      elapsedTime
    } = resultData;

    if (
      !examName ||
      examYear === undefined || examYear === null ||
      !examSession ||
      !Array.isArray(answers) ||
      score === undefined || score === null ||
      correctCount === undefined || correctCount === null ||
      totalQuestions === undefined || totalQuestions === null ||
      elapsedTime === undefined || elapsedTime === null
    ) {
      console.warn('POST /api/exam-results: Missing required fields in request body:', resultData);
      return NextResponse.json({ message: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }

    // 4. DB에 저장할 데이터 준비
    const dataToInsert: InsertExamResult = {
      userId: userId, // Clerk에서 가져온 실제 userId 사용
      examName: examName,
      examYear: examYear,
      examSession: examSession,
      score: score,
      correctCount: correctCount,
      totalQuestions: totalQuestions,
      elapsedTime: elapsedTime,
      answers: answers,
    };

    // 5. 데이터베이스에 삽입
    console.log('POST /api/exam-results: Inserting data into database:', dataToInsert);
    const [insertedResult] = await db.insert(examResults).values(dataToInsert).returning();

    if (!insertedResult) {
        console.error('POST /api/exam-results: Failed to insert data or retrieve inserted data.');
        throw new Error('데이터 삽입 후 결과를 반환받지 못했습니다.');
    }

    console.log('POST /api/exam-results: Successfully inserted exam result:', insertedResult);

    // 6. 성공 응답 반환
    return NextResponse.json(insertedResult, { status: 201 });

  } catch (error: any) {
    console.error('POST /api/exam-results: An error occurred:', error);
    // 특정 오류 유형에 따라 다른 상태 코드 반환 고려 (예: DB 오류는 500)
    return NextResponse.json({ message: error.message || '시험 결과 저장 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// GET 핸들러 (결과 조회용, 추후 구현)
// export async function GET(request: NextRequest) {
//   // ... 결과 조회 로직 ...
// } 