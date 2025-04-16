import { NextRequest, NextResponse } from "next/server";
import { db, asyncDB, checkDBConnection } from "@/db";
import { questions } from "@/db/schema/questions";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs";

// 임시 사용자 ID (개발용)
const DEV_USER_ID = "dev_user_123";

// DB 연결 상태 확인 헬퍼 함수
const ensureDBConnection = async () => {
  let retries = 0;
  const maxRetries = 5;
  const retryDelay = 1000;

  while (retries < maxRetries) {
    try {
      // DB 연결 확인
      const dbInstance = await asyncDB.get();
      await dbInstance.query.questions.findFirst();
      return true;
    } catch (error) {
      console.log(`DB 연결 재시도 중... (${retries + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      retries++;
    }
  }
  
  return false;
};

// 단일 문제 조회
export async function GET(
  request: Request,
  { params }: { params: { questionId: string } }
) {
  try {
    const isDBConnectedGET = await checkDBConnection();
    if (!isDBConnectedGET) {
      console.error("데이터베이스 연결 실패 (GET)");
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
    
    const { questionId } = params;

    // 비동기 DB 인스턴스 가져오기
    const dbInstance = await asyncDB.get();
    
    // 문제 조회
    const question = await dbInstance.query.questions.findFirst({
      where: eq(questions.id, questionId)
    });

    // 문제가 없을 경우
    if (!question) {
      return NextResponse.json(
        { error: "문제를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ question });
  } catch (error) {
    console.error("GET /api/questions/[id] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "문제 조회 중 오류 발생" },
      { status: 500 }
    );
  }
}

// 단일 문제 업데이트
export async function PUT(
  request: NextRequest,
  { params }: { params: { questionId: string } }
) {
  try {
    const isDBConnectedPUT = await checkDBConnection();
    if (!isDBConnectedPUT) {
      console.error("데이터베이스 연결 실패 (PUT)");
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
    
    const { questionId } = params;
    const updateData = await request.json();
    
    // 비동기 DB 인스턴스 가져오기
    const dbInstance = await asyncDB.get();

    // 문제 존재 여부 확인
    const existingQuestion = await dbInstance.query.questions.findFirst({
      where: eq(questions.id, questionId)
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { error: "문제를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 문제 업데이트
    await dbInstance.update(questions)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(questions.id, questionId));

    console.log("문제 업데이트 성공:", questionId);

    // 업데이트된 문제 반환
    const updatedQuestion = await dbInstance.query.questions.findFirst({
      where: eq(questions.id, questionId)
    });

    return NextResponse.json({ question: updatedQuestion });
  } catch (error) {
    console.error("PUT /api/questions/[id] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "문제 업데이트 중 오류 발생" },
      { status: 500 }
    );
  }
}

// 단일 문제 삭제
export async function DELETE(
  request: Request,
  { params }: { params: { questionId: string } }
) {
  try {
    const isDBConnectedDELETE = await checkDBConnection();
    if (!isDBConnectedDELETE) {
      console.error("데이터베이스 연결 실패 (DELETE)");
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

    const { questionId } = params;
    
    // 비동기 DB 인스턴스 가져오기
    const dbInstance = await asyncDB.get();

    // 문제 존재 여부 확인
    const existingQuestion = await dbInstance.query.questions.findFirst({
      where: eq(questions.id, questionId)
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { error: "문제를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 문제 삭제
    await dbInstance.delete(questions)
      .where(eq(questions.id, questionId));

    console.log("문제 삭제 성공:", questionId);

    return NextResponse.json({
      message: "문제가 성공적으로 삭제되었습니다."
    });
  } catch (error) {
    console.error("DELETE /api/questions/[id] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "문제 삭제 중 오류 발생" },
      { status: 500 }
    );
  }
} 