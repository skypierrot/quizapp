import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { questions } from "@/db/schema/questions";
import { eq, sql, and, inArray, SQL, Placeholder, desc, asc } from "drizzle-orm";
import { auth } from "@clerk/nextjs";
// import { auth } from "@clerk/nextjs"; // 인증은 프로젝트 후반부에 구현 예정
import { IQuestion } from '@/types'
// Node.js 모듈 import
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid'; // UUID 생성을 위해

// 임시 사용자 ID (개발용)
const DEV_USER_ID = "dev_user_123";
const TMP_DIR = path.join(process.cwd(), 'public', 'images', 'tmp');
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'images', 'uploaded');

// 디렉토리 생성 함수 (존재하지 않을 경우)
const ensureUploadDirExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
};

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

    // form-data 파싱
    const formData = await req.formData();
    // 텍스트 필드 파싱
    const content = formData.get('content') as string;
    const optionsRaw = formData.get('options') as string; // JSON string
    const answer = Number(formData.get('answer'));
    const explanation = formData.get('explanation') as string;
    const tagsRaw = formData.get('tags') as string; // JSON string

    // 유효성 검사
    if (!content || !optionsRaw || answer === undefined || answer < 0) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

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

    // 선택지 이미지에도 moveTmpToUploaded 적용 (문제/해설 이미지와 동일한 방식)
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

    // 문제 ID 및 디렉토리 생성
    const questionId = uuidv4();
    const questionImageDir = path.join(UPLOAD_DIR, questionId);
    ensureUploadDirExists(questionImageDir);

    // 문제 이미지/해설 이미지 파싱 (파일 X, URL 배열)
    const imagesRaw = formData.get('images') as string;
    const explanationImagesRaw = formData.get('explanationImages') as string;
    let imageObjects: { url: string; hash: string }[] = [];
    let explanationImageObjects: { url: string; hash: string }[] = [];
    try {
      imageObjects = imagesRaw ? JSON.parse(imagesRaw) : [];
      explanationImageObjects = explanationImagesRaw ? JSON.parse(explanationImagesRaw) : [];
    } catch (e) {
      return NextResponse.json(
        { error: "images/explanationImages 파싱 오류" },
        { status: 400 }
      );
    }
    // 임시폴더 이미지 이동 및 url 변경
    imageObjects = imageObjects.map(img => {
      if (img.url.startsWith('/images/tmp/')) {
        return { ...img, url: moveTmpToUploaded(img.url) };
      }
      return img;
    });
    explanationImageObjects = explanationImageObjects.map(img => {
      if (img.url.startsWith('/images/tmp/')) {
        return { ...img, url: moveTmpToUploaded(img.url) };
      }
      return img;
    });

    // Drizzle Insert
    const result = await db
      .insert(questions)
      .values({
        id: questionId,
        content,
        options,
        answer,
        explanation,
        tags,
        images: imageObjects,
        explanationImages: explanationImageObjects,
        userId: DEV_USER_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: questions.id, tags: questions.tags });

    return NextResponse.json(result[0], { status: 201 });
  } catch (error: any) {
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