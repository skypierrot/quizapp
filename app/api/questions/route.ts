import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { questions } from "@/db/schema/questions";
import { eq, sql, and, inArray, SQL, Placeholder, desc, asc } from "drizzle-orm";
import { auth } from "@clerk/nextjs";
// import { auth } from "@clerk/nextjs"; // 인증은 프로젝트 후반부에 구현 예정
import { IQuestion, IManualQuestion } from '@/types'
// Node.js 모듈 import
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid'; // UUID 생성을 위해
import { saveQuestions } from "@/db/saveQuestions"; // saveQuestions import 추가

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
  // 입력 URL 로깅 (디버깅 목적)
  console.log(`[moveTmpToUploaded - single] Input: ${tmpUrl}`);

  const normalizedUrl = tmpUrl.replace(/\\/g, '/').replace(/\/{2,}/g, '/');

  // 1. 이미 업로드된 경로인 경우 ( '/images/uploaded/...' )
  if (normalizedUrl.startsWith('/images/uploaded/')) {
    console.log(`[moveTmpToUploaded - single] Output (already uploaded): ${normalizedUrl}`);
    return normalizedUrl; // 이미 올바른 경로이므로 그대로 반환
  }

  // 2. 임시 경로가 아닌 경우 ( '/images/tmp/' 로 시작하지 않음)
  if (!normalizedUrl.startsWith('/images/tmp/')) {
    console.log(`[moveTmpToUploaded - single] Output (not tmp path): ${normalizedUrl}`);
    return normalizedUrl; // Blob URL 등 다른 유형일 수 있으므로 그대로 반환
  }

  // 3. 임시 경로인 경우 ( '/images/tmp/...' )
  const filename = path.basename(normalizedUrl);
  const tmpPath = path.join(TMP_DIR, filename);
  const uploadedPath = path.join(UPLOAD_DIR, filename);

  // 3a. 임시 파일 존재 확인
  if (!fs.existsSync(tmpPath)) {
    console.error('[moveTmpToUploaded - single] Tmp file not found:', tmpPath);
    console.log(`[moveTmpToUploaded - single] Output (tmp not found): ${normalizedUrl}`);
    return normalizedUrl; // 임시 파일이 없으면 원본 URL 반환
  }

  // 3b. 파일 이동 시도
  try {
    ensureUploadDirExists(UPLOAD_DIR); // 이동 전 대상 디렉토리 확인/생성
    fs.renameSync(tmpPath, uploadedPath);
    console.log(`[moveTmpToUploaded - single] File moved: ${tmpPath} -> ${uploadedPath}`);
  } catch (e) {
    console.error('[moveTmpToUploaded - single] Failed to move file:', tmpPath, '->', uploadedPath, e);
    console.log(`[moveTmpToUploaded - single] Output (move failed): ${normalizedUrl}`);
    return normalizedUrl; // 이동 실패 시 원본 URL 반환
  }

  // 3c. 이동 후 파일 존재 확인 (부가 검증) - 오류 로깅만 하고 경로는 반환
  if (!fs.existsSync(uploadedPath)) {
    console.error('[moveTmpToUploaded - single] Moved file not found after rename:', uploadedPath);
    // 이동했다고 가정하고 새 경로 반환 시도 (혹시 모를 파일 시스템 지연 고려)
  }

  // 4. 이동 성공 시 최종 URL 반환
  const finalUrl = `/images/uploaded/${filename}`;
  console.log(`[moveTmpToUploaded - single] Output (success): ${finalUrl}`);
  return finalUrl;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // 단일 질문 데이터 파싱
    const content = formData.get('content') as string;
    const optionsRaw = formData.get('options') as string;
    const answer = Number(formData.get('answer'));
    const explanation = formData.get('explanation') as string;
    const tagsRaw = formData.get('tags') as string;
    const imagesRaw = formData.get('images') as string; // {url, hash}[] JSON
    const explanationImagesRaw = formData.get('explanationImages') as string; // {url, hash}[] JSON
    const examId = formData.get('examId') as string; // examId 추가

    // 유효성 검사 (필요시 추가)
    if (!content || !optionsRaw || answer === undefined || answer < 0) {
      return NextResponse.json({ error: "필수 필드가 누락되었습니다." }, { status: 400 });
    }

    // JSON 필드 파싱
    let options, tags, images, explanationImages;
    try {
      options = optionsRaw ? JSON.parse(optionsRaw) : [];
      tags = tagsRaw ? JSON.parse(tagsRaw) : [];
      images = imagesRaw ? JSON.parse(imagesRaw) : [];
      explanationImages = explanationImagesRaw ? JSON.parse(explanationImagesRaw) : [];
    } catch (e) {
      return NextResponse.json({ error: "JSON 데이터 파싱 오류" }, { status: 400 });
    }

    // saveQuestions에 전달할 단일 질문 객체 구성
    // IManualQuestion 타입 또는 saveQuestions가 기대하는 타입에 맞춰야 함
    const singleQuestion = {
      id: uuidv4(), // 새 ID 생성 또는 formData에서 받기
      content,
      options, // 파싱된 객체 배열
      answer,
      explanation: explanation || '',
      tags,
      images, // 파싱된 {url, hash} 배열
      explanationImages, // 파싱된 {url, hash} 배열
      examId: examId || undefined, // examId 추가
      userId: DEV_USER_ID,
      // number 필드는 IManualQuestion 에 있지만 questions 스키마에는 없음.
      // saveQuestions 내부에서 처리하거나 여기서 제외
    };

    // saveQuestions 함수 호출 (배열 형태로 전달)
    const result = await saveQuestions([singleQuestion]);

    // 결과 처리 (단일 결과만 반환)
    if (result && result.length > 0) {
      return NextResponse.json({ ok: true, result: result[0] }, { status: 201 });
    } else {
      throw new Error("문제 저장 후 결과 반환 실패");
    }

  } catch (error: any) {
    console.error("[/api/questions POST Error]:", error);
    return NextResponse.json({ error: error.message || '저장 중 오류 발생' }, { status: 500 });
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