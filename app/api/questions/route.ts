import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { questions } from "@/db/schema/questions";
import { eq, sql, and, inArray, SQL, Placeholder, desc, asc } from "drizzle-orm";
import { auth } from "@clerk/nextjs";
// import { auth } from "@clerk/nextjs"; // 인증은 프로젝트 후반부에 구현 예정
import { IQuestion } from '@/types'

// 임시 사용자 ID (개발용)
const DEV_USER_ID = "dev_user_123";

// DB 연결 상태 확인 헬퍼 함수 - 간소화된 버전
const ensureDBConnection = async () => {
  try {
    // 간단한 쿼리로 연결 확인
    await db.select({ count: sql`COUNT(*)` }).from(questions).limit(1);
    return true;
  } catch (error) {
    console.error("DB 연결 확인 오류:", error);
    return false;
  }
};

export async function POST(req: NextRequest) {
  try {
    // DB 연결 확인
    const isDBConnected = await ensureDBConnection();
    if (!isDBConnected) {
      console.error("데이터베이스 연결 실패");
      return NextResponse.json(
        { error: "서버 연결 오류. 잠시 후 다시 시도해주세요." },
        { status: 503 }
      );
    }

    // 인증 확인 (임시로 비활성화)
    // const { userId } = auth();
    
    // if (!userId) {
    //   return NextResponse.json(
    //     { error: "인증되지 않은 사용자입니다." },
    //     { status: 401 }
    //   );
    // }

    // 요청 본문 파싱
    const body = await req.json();
    const questionData: IQuestion = body;
    console.log("수신된 문제 데이터:", questionData);
    // tags 타입 확인 로그 추가
    console.log('[DEBUG] Type of questionData.tags:', typeof questionData.tags, 'Is Array:', Array.isArray(questionData.tags));
    
    // 기본 유효성 검사
    if (!questionData.content || !questionData.options || questionData.answer === undefined || questionData.answer < 0) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    // --- 데이터 흐름 추적 로그 ---
    console.log('[API Route] Received tags:', questionData.tags);
    console.log('[API Route] Received tags type:', typeof questionData.tags, Array.isArray(questionData.tags));
    // --- 로그 추가 끝 ---

    // --- DB Insert 직전 값 확인 로그 ---
    console.log('[API Route] Value before DB Insert (tags):', questionData.tags);
    console.log('[API Route] Type before DB Insert (tags):', typeof questionData.tags, Array.isArray(questionData.tags));
    // --- 로그 추가 끝 ---

    // Drizzle 표준 방식으로 Insert (JavaScript 배열 직접 전달)
    const result = await db
    .insert(questions)
    .values({
      content: questionData.content,
      options: questionData.options,
      answer: questionData.answer,
      explanation: questionData.explanation,
      tags: questionData.tags, // <<--- JavaScript 배열 그대로 전달
      images: questionData.images || [],
      explanationImages: questionData.explanationImages || [],
      userId: DEV_USER_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning({ id: questions.id, tags: questions.tags })

    // 로그 메시지도 표준 방식임을 명시하도록 수정
    console.log('[API Route] DB Insert Result (Standard Drizzle):', result);

    return NextResponse.json(result[0], { status: 201 })
  } catch (error: any) {
    console.error("문제 저장 중 오류 발생:", error);
    // --- 에러 상세 로그 ---
    console.error('[API Route] Error Message:', error instanceof Error ? error.message : error);
    console.error('[API Route] Error Stack:', error instanceof Error ? error.stack : null);
    // --- 로그 추가 끝 ---
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "문제 저장 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 모든 문제 조회 (GET)
export async function GET(req: NextRequest) {
  try {
    // DB 연결 확인
    const isDBConnected = await ensureDBConnection();
    if (!isDBConnected) {
      console.error("데이터베이스 연결 실패");
      return NextResponse.json(
        { error: "서버 연결 오류. 잠시 후 다시 시도해주세요." },
        { status: 503 }
      );
    }

    // 인증 확인 (임시로 비활성화)
    // const { userId } = auth();
    
    // if (!userId) {
    //   return NextResponse.json(
    //     { error: "인증되지 않은 사용자입니다." },
    //     { status: 401 }
    //   );
    // }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    const tagsParam = url.searchParams.get("tags");
    
    let conditions: SQL<unknown> | undefined = undefined;

    if (tagsParam) {
      const tagsArray = tagsParam.split(',').map(t => t.trim()).filter(t => t);
      
      if (tagsArray.length > 0) {
        const tagsJsonbArray = JSON.stringify(tagsArray);
        const tagsCondition = sql`questions.tags @> ${tagsJsonbArray}::jsonb`;
        
        conditions = conditions ? and(conditions, tagsCondition) : tagsCondition;
      }
    }

    const baseCondition = eq(questions.userId, DEV_USER_ID);
    conditions = conditions ? and(baseCondition, conditions) : baseCondition;

    const fetchedQuestions = await db.select().from(questions)
      .where(conditions)
      .orderBy(asc(questions.createdAt))
      .limit(limit)
      .offset(skip);

    const countResult = await db.select({ count: sql`count(*)` }).from(questions).where(conditions);
    const total = Number(countResult[0].count);
    const totalPages = Math.ceil(total / limit);

    console.log(`문제 조회 성공 (조건 적용됨): ${fetchedQuestions.length}개 조회됨, 총 ${total}개`);

    return NextResponse.json({
      questions: fetchedQuestions,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });

  } catch (error) {
    console.error("문제 조회 중 오류 발생:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "문제 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 