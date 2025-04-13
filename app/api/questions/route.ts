import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { questions } from "@/db/schema/questions";
import { eq, sql, and, inArray } from "drizzle-orm";
import { auth } from "@clerk/nextjs";
import { desc } from "drizzle-orm";
// import { auth } from "@clerk/nextjs"; // 인증은 프로젝트 후반부에 구현 예정

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
    const questionData = await req.json();
    console.log("수신된 문제 데이터:", questionData);
    
    // 기본 유효성 검사
    if (!questionData.content || !questionData.options || questionData.answer === undefined || questionData.answer < 0) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 데이터베이스에 저장
    const insertedQuestion = await db.insert(questions).values({
      content: questionData.content,
      options: questionData.options,
      answer: questionData.answer,
      explanation: questionData.explanation || null,
      images: questionData.images || [],
      explanationImages: questionData.explanationImages || [],
      tags: questionData.tags || [],
      userId: DEV_USER_ID, // 임시 사용자 ID
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning({
      id: questions.id,
      content: questions.content
    });

    console.log("문제 저장 성공:", insertedQuestion[0].id);

    return NextResponse.json(
      { 
        message: "문제가 성공적으로 저장되었습니다.",
        question: insertedQuestion[0]
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("문제 저장 중 오류 발생:", error);
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

    // URL 쿼리 파라미터 파싱
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    const tag = url.searchParams.get("tag");
    
    // 조건 설정
    let conditions = eq(questions.userId, DEV_USER_ID);
    
    // tag 필터링이 있을 경우 추가
    if (tag) {
      // JSON 배열에서 특정 값을 찾는 SQL 표현식 (PostgreSQL)
      const tagValue = JSON.stringify([tag]);
      const tagCondition = sql`${questions.tags}::jsonb @> ${tagValue}::jsonb`;
      conditions = and(conditions, tagCondition);
    }

    // 데이터베이스에서 문제 조회
    const fetchedQuestions = await db.select().from(questions)
      .where(conditions)
      .orderBy(desc(questions.createdAt))
      .limit(limit)
      .offset(skip);

    // 전체 개수 조회 - 단순화된 방식
    const countQuery = await db.select()
      .from(questions)
      .where(conditions);
    
    const total = countQuery.length;
    const totalPages = Math.ceil(total / limit);

    console.log(`문제 조회 성공: ${fetchedQuestions.length}개 조회됨`);

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