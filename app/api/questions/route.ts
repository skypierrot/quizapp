import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { questions } from "@/db/schema/questions";
import { eq, sql, and, inArray, SQL, Placeholder, desc, asc } from "drizzle-orm";
// import { auth } from "@clerk/nextjs"; // Clerk 인증 주석 완전 삭제
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
      console.error("GET /api/questions: Database connection failed");
      return NextResponse.json(
        { error: "서버 연결 오류. 잠시 후 다시 시도해주세요." },
        { status: 503 }
      );
    }

    // 인증 확인 (임시로 개발용 ID 사용)
    // const { userId } = auth();
    const userId = DEV_USER_ID; // 임시
    // if (!userId) { ... }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    const tagsParam = url.searchParams.get("tags");
    const idsParam = url.searchParams.get("ids");

    let fetchedQuestions: any[];
    let totalQuestions = 0;

    // 1. ID 목록으로 조회
    if (idsParam) {
      console.log(`GET /api/questions: Fetching by IDs: ${idsParam}`);
      // ID를 문자열로 유지하고 앞뒤 공백 제거, 빈 문자열 필터링
      const idArray = idsParam
        .split(',')
        .map(id => id.trim())
        .filter(id => id.length > 0); // UUID는 비어있지 않음

      if (idArray.length === 0) {
        console.warn("GET /api/questions: Invalid or empty IDs provided");
        return NextResponse.json({ error: "유효한 문제 ID가 제공되지 않았습니다." }, { status: 400 });
      }

      // UUID는 문자열이므로 idArray는 string[] 타입
      fetchedQuestions = await db
        .select()
        .from(questions)
        // userId 조건과 ID 목록 조건을 AND로 결합
        .where(and(eq(questions.userId, userId), inArray(questions.id, idArray)));

      totalQuestions = fetchedQuestions.length;
      console.log(`GET /api/questions: Found ${totalQuestions} questions by IDs`);

    }
    // 2. 태그로 조회 (기존 로직)
    else if (tagsParam) {
      console.log(`GET /api/questions: Fetching by tags: ${tagsParam}`);
      let conditions: SQL<unknown> | undefined = undefined;
      const tagsArray = tagsParam.split(',').map(t => t.trim()).filter(t => t);

      if (tagsArray.length > 0) {
        // jsonb 배열 형태로 정확히 일치하는 태그 검색 ('["태그1", "태그2"]') -> ['태그1', '태그2']
        // Drizzle은 배열 직접 비교를 지원하지 않으므로, @> 연산자 사용 또는 개별 태그 검사 필요
        // 여기서는 @> 연산자 (배열 포함) 사용
        const tagsJsonbArray = JSON.stringify(tagsArray);
        const tagsCondition = sql`tags @> ${tagsJsonbArray}::jsonb`;
        conditions = tagsCondition;
      }

      // 기본 사용자 ID 조건과 태그 조건을 AND로 결합
      const baseCondition = eq(questions.userId, userId);
      conditions = conditions ? and(baseCondition, conditions) : baseCondition;

      // 태그 검색 결과와 총 개수 조회
      const results = await db
        .select()
        .from(questions)
        .where(conditions)
        .orderBy(desc(questions.createdAt)) // 정렬 추가 (최신순)
        .limit(limit)
        .offset(skip);

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(questions)
        .where(conditions);

      fetchedQuestions = results;
      totalQuestions = countResult[0]?.count || 0;
      console.log(`GET /api/questions: Found ${fetchedQuestions.length} questions (total ${totalQuestions}) by tags`);

    }
    // 3. 파라미터 없는 경우 (또는 다른 잘못된 경우)
    else {
      console.warn("GET /api/questions: Missing 'ids' or 'tags' parameter");
      // 페이지네이션으로 전체 목록 조회 (기존 GET의 기본 동작이었던 것으로 추정)
       const results = await db
        .select()
        .from(questions)
        .where(eq(questions.userId, userId)) // 사용자 조건만 적용
        .orderBy(desc(questions.createdAt)) // 정렬 추가 (최신순)
        .limit(limit)
        .offset(skip);

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(questions)
        .where(eq(questions.userId, userId));

      fetchedQuestions = results;
      totalQuestions = countResult[0]?.count || 0;
      console.log(`GET /api/questions: No specific params, returning paginated list (total ${totalQuestions})`);
       // 또는 400 오류 반환
       // return NextResponse.json({ error: "조회를 위한 'ids' 또는 'tags' 파라미터가 필요합니다." }, { status: 400 });
    }

    // 최종 결과 반환
    return NextResponse.json({
      questions: fetchedQuestions,
      total: totalQuestions,
      page: idsParam ? 1 : page,
      limit: idsParam ? totalQuestions : limit,
    });

  } catch (error: any) {
    console.error("GET /api/questions Error:", error);
    return NextResponse.json(
      { error: error.message || "문제 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 