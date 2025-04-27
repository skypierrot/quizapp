import { NextRequest, NextResponse } from "next/server";
import { db, asyncDB, checkDBConnection } from "@/db";
import { questions } from "@/db/schema/questions";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs";
import fs from 'fs';
import path from 'path';

// 임시 사용자 ID (개발용)
const DEV_USER_ID = "dev_user_123";

const TMP_DIR = path.join(process.cwd(), 'public', 'images', 'tmp');
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'images', 'uploaded');

function moveTmpToUploaded(tmpUrl: string): string {
  // 슬래시 중복 제거
  const normalizedUrl = tmpUrl.replace(/\\/g, '/').replace(/\/{2,}/g, '/');
  if (normalizedUrl.startsWith('/images/uploaded/')) {
    const filename = path.basename(normalizedUrl);
    return `/images/uploaded/${filename}`;
  }
  if (!normalizedUrl.startsWith('/images/tmp/')) return normalizedUrl;

  const filename = path.basename(normalizedUrl);
  const tmpPath = path.join(TMP_DIR, filename);
  const uploadedPath = path.join(UPLOAD_DIR, filename);

  if (!fs.existsSync(tmpPath)) {
    console.error('[이미지 이동 오류] 임시파일 없음:', tmpPath);
    return normalizedUrl;
  }

  try {
    fs.renameSync(tmpPath, uploadedPath);
  } catch (e) {
    console.error('[이미지 이동 오류] 파일 이동 실패:', tmpPath, '→', uploadedPath, e);
    return normalizedUrl;
  }

  if (!fs.existsSync(uploadedPath)) {
    console.error('[이미지 이동 오류] 이동 후 파일 없음:', uploadedPath);
    return normalizedUrl;
  }

  return `/images/uploaded/${filename}`;
}

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
    const formData = await request.formData();
    const content = formData.get('content') as string;
    const optionsRaw = formData.get('options') as string;
    const answer = Number(formData.get('answer'));
    const explanation = formData.get('explanation') as string;
    const tagsRaw = formData.get('tags') as string;
    // JSON 파싱
    let options;
    let tags;
    try {
      options = JSON.parse(optionsRaw);
      tags = tagsRaw ? JSON.parse(tagsRaw) : [];
    } catch (e) {
      return NextResponse.json(
        { error: "options/tags 파싱 오류" },
        { status: 400 }
      );
    }
    // options의 각 images에도 moveTmpToUploaded 적용 (POST와 동일)
    options = options.map((opt: any) => ({
      ...opt,
      images: (opt.images || []).map((img: any) => {
        if (typeof img === "string") {
          return moveTmpToUploaded(img);
        }
        if (
          img.url &&
          (img.url.startsWith('/images/tmp/') || img.url.startsWith('/images/uploaded/'))
        ) {
          return { ...img, url: moveTmpToUploaded(img.url) };
        }
        return img;
      })
    }));
    // 이미지 파싱
    const imagesRaw = formData.get('images') as string;
    const explanationImagesRaw = formData.get('explanationImages') as string;
    let imageObjects: { url: string; hash: string }[] = [];
    let explanationImageObjects: { url: string; hash: string }[] = [];
    try {
      imageObjects = imagesRaw ? JSON.parse(imagesRaw) : [];
      explanationImageObjects = explanationImagesRaw ? JSON.parse(explanationImagesRaw) : [];
      // tmp 경로를 uploaded로 이동 및 url 변경
      imageObjects = imageObjects.map(img => {
        if (img.url && img.url.startsWith('/images/tmp/')) {
          return { ...img, url: moveTmpToUploaded(img.url) };
        }
        return img;
      });
      explanationImageObjects = explanationImageObjects.map(img => {
        if (img.url && img.url.startsWith('/images/tmp/')) {
          return { ...img, url: moveTmpToUploaded(img.url) };
        }
        return img;
      });
    } catch (e) {
      return NextResponse.json(
        { error: "images/explanationImages 파싱 오류" },
        { status: 400 }
      );
    }
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
        content,
        options,
        answer,
        explanation,
        tags,
        images: imageObjects,
        explanationImages: explanationImageObjects,
        updatedAt: new Date()
      })
      .where(eq(questions.id, questionId));
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