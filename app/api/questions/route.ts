import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { questions } from "@/db/schema/questions";
import { exams } from "@/db/schema/exams"; // exams 스키마 import 추가
import { eq, sql, and, inArray, SQL, Placeholder, desc, asc, getTableColumns } from "drizzle-orm";
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

// Helper function to find or create an exam and return its ID
async function findOrCreateExamId(examName: string, examDate: string, examSubject: string): Promise<string> {
  const existingExam = await db
    .select({ id: exams.id })
    .from(exams)
    .where(
      and(
        eq(exams.name, examName),
        eq(exams.date, examDate),
        eq(exams.subject, examSubject)
      )
    )
    .limit(1);

  if (existingExam && existingExam.length > 0 && existingExam[0].id) {
    return existingExam[0].id;
  } else {
    const newExam = await db
      .insert(exams)
      .values({
        name: examName,
        date: examDate,
        subject: examSubject,
      })
      .returning({ id: exams.id });
    if (!newExam || newExam.length === 0 || !newExam[0].id) {
      // console.error("Failed to create or retrieve exam ID. New exam result:", newExam); // 디버깅용 로그
      throw new Error("Failed to create or retrieve exam ID");
    }
    return newExam[0].id;
  }
}

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

    const content = formData.get('content') as string;
    const optionsRaw = formData.get('options') as string;
    const answer = Number(formData.get('answer'));
    const explanation = formData.get('explanation') as string;
    const tagsRaw = formData.get('tags') as string;
    const imagesRaw = formData.get('images') as string;
    const explanationImagesRaw = formData.get('explanationImages') as string;

    console.log("[API /questions POST] Received tagsRaw from formData:", tagsRaw);

    if (!content || !optionsRaw || answer === undefined || answer < 0) {
      return NextResponse.json({ error: "필수 필드가 누락되었습니다." }, { status: 400 });
    }

    let options, tags, images, explanationImages;
    try {
      options = optionsRaw ? JSON.parse(optionsRaw) : [];
      tags = tagsRaw ? JSON.parse(tagsRaw) : [];
      console.log("[API /questions POST] Parsed tags array:", JSON.stringify(tags));
      images = imagesRaw ? JSON.parse(imagesRaw) : [];
      explanationImages = explanationImagesRaw ? JSON.parse(explanationImagesRaw) : [];
    } catch (e) {
      console.error("[API /questions POST] JSON Parsing Error:", e);
      return NextResponse.json({ error: "JSON 데이터 파싱 오류" }, { status: 400 });
    }

    let examNameFromTags: string | undefined;
    let examDateFromTags: string | undefined;
    let examSubjectFromTags: string | undefined;
    const otherTags: string[] = [];

    if (Array.isArray(tags)) {
      tags.forEach((tag: any) => {
        if (typeof tag === 'string') {
          console.log("[API /questions POST] Processing tag:", tag);
          if (tag.startsWith("시험명:")) {
            examNameFromTags = tag.substring("시험명:".length).trim();
          } else if (tag.startsWith("날짜:")) {
            examDateFromTags = tag.substring("날짜:".length).trim();
            if (!/^\d{4}-\d{2}-\d{2}$/.test(examDateFromTags)) {
                console.warn("[API /questions POST] Invalid date format in tag:", examDateFromTags);
                examDateFromTags = undefined;
            }
          } else if (tag.startsWith("과목:")) {
            examSubjectFromTags = tag.substring("과목:".length).trim();
          } else {
            otherTags.push(tag);
          }
        } else {
          console.warn(`[API /questions POST] Invalid tag type encountered: ${typeof tag}`, tag);
        }
      });
    }
    console.log("[API /questions POST] Extracted examName:", examNameFromTags);
    console.log("[API /questions POST] Extracted examDate:", examDateFromTags);
    console.log("[API /questions POST] Extracted examSubject:", examSubjectFromTags);
    console.log("[API /questions POST] Other tags:", JSON.stringify(otherTags));

    if (!examNameFromTags || !examDateFromTags || !examSubjectFromTags) {
      console.error("[API /questions POST] Validation failed: Missing required exam tags or invalid date format.");
      return NextResponse.json({ error: "필수 태그(시험명, 날짜(YYYY-MM-DD), 과목)가 누락되었거나 형식이 잘못되었습니다." }, { status: 400 });
    }
    
    const determinedExamId = await findOrCreateExamId(examNameFromTags, examDateFromTags, examSubjectFromTags);

    // saveQuestions에 전달할 단일 질문 객체 구성
    const singleQuestion: IManualQuestion = { // 타입 명시
      id: uuidv4(), 
      content,
      options, 
      answer,
      explanation: explanation || '',
      tags: otherTags, // 시험, 년도, 과목 태그 제외한 나머지 태그
      images, 
      explanationImages, 
      examId: determinedExamId, // 동적으로 찾거나 생성한 examId 사용
      userId: DEV_USER_ID, // Clerk 사용 시 실제 userId로 교체 필요
      // number: 0, // IManualQuestion에 있지만 questions 스키마에 없는 필드. saveQuestions 에서 처리 필요
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

    const userId = DEV_USER_ID; // 개발용 ID, 필요시 실제 인증 사용자로 교체
    const url = new URL(req.url);
    const currentPage = parseInt(url.searchParams.get("page") || "1");
    const limitParam = url.searchParams.get("limit");
    const effectiveLimit = limitParam === "0" ? undefined : parseInt(limitParam || "10");
    const skip = effectiveLimit !== undefined ? (currentPage - 1) * effectiveLimit : 0;
    const tagsParam = url.searchParams.get("tags");
    const idsParam = url.searchParams.get("ids");

    let fetchedQuestions: IQuestion[] = [];
    let totalQuestions = 0;
    let conditions: SQL<unknown>[] = [];

    const selectFields = {
      ...getTableColumns(questions),
      examName: exams.name,
      examDate: exams.date,
      examSubject: exams.subject
    };

    // 1. ID 목록으로 조회
    if (idsParam) {
      console.log(`[API /questions GET] Fetching by IDs: ${idsParam}`);
      const idArray = idsParam.split(',').map(id => id.trim()).filter(id => id.length > 0);

      if (idArray.length === 0) {
        console.warn("[API /questions GET] Invalid or empty IDs provided");
        return NextResponse.json({ error: "유효한 문제 ID가 제공되지 않았습니다." }, { status: 400 });
      }
      conditions.push(inArray(questions.id, idArray));
      
      // ID 조회 시에는 바로 쿼리 실행 (아래 태그 기반 로직과 분리)
      const resultsById = await db
        .select(selectFields)
        .from(questions)
        .leftJoin(exams, eq(questions.examId, exams.id))
        .where(and(...conditions)); // conditions에는 idArray 조건만 있음

      fetchedQuestions = resultsById.map(q => ({
        ...q,
        images: q.images ?? [], 
        explanationImages: q.explanationImages ?? [],
        tags: q.tags ?? [], 
      }));
      totalQuestions = fetchedQuestions.length;
      console.log(`[API /questions GET] Found ${totalQuestions} questions by IDs.`);

    }
    // 2. 태그로 조회
    else if (tagsParam) {
      console.log(`[API /questions GET] Fetching by tags: ${tagsParam}`);
      const tagsToFilter = tagsParam.split(',').map(tag => tag.trim()).filter(t => t);
      console.log(`[API /questions GET] Parsed tagsToFilter: ${JSON.stringify(tagsToFilter)}`);

      const examNameTags = tagsToFilter.filter(tag => tag.startsWith("시험명:")).map(tag => tag.substring("시험명:".length).trim());
      const dateTags = tagsToFilter.filter(tag => tag.startsWith("날짜:")).map(tag => tag.substring("날짜:".length).trim());
      const subjectTags = tagsToFilter.filter(tag => tag.startsWith("과목:")).map(tag => tag.substring("과목:".length).trim());
      const otherTags = tagsToFilter.filter(tag => !tag.startsWith("시험명:") && !tag.startsWith("날짜:") && !tag.startsWith("과목:"));

      console.log(`[API /questions GET] Parsed examNameTags: ${JSON.stringify(examNameTags)}`);
      console.log(`[API /questions GET] Parsed dateTags: ${JSON.stringify(dateTags)}`);
      console.log(`[API /questions GET] Parsed subjectTags: ${JSON.stringify(subjectTags)}`);
      console.log(`[API /questions GET] Parsed otherTags: ${JSON.stringify(otherTags)}`);

      // examId를 찾기 위한 조건 (시험명, 날짜, 과목 기준)
      if (examNameTags.length > 0 || dateTags.length > 0 || subjectTags.length > 0) {
        let examSubQueryConditions: SQL<unknown>[] = [];
        if (examNameTags.length > 0) {
          examSubQueryConditions.push(inArray(exams.name, examNameTags));
        }
        if (dateTags.length > 0) {
          examSubQueryConditions.push(inArray(exams.date, dateTags));
        }
        if (subjectTags.length > 0) { // 과목 태그가 있는 경우에만 조건 추가
          examSubQueryConditions.push(inArray(exams.subject, subjectTags));
        }
        
        console.log(`[API /questions GET] Number of examSubQueryConditions for examId lookup: ${examSubQueryConditions.length}`);

        if (examSubQueryConditions.length > 0) {
            const subQuery = db
                .select({ id: exams.id })
                .from(exams)
                .where(and(...examSubQueryConditions));
            
            console.log(`[API /questions GET] Executing Subquery for examIds (params will be bound by Drizzle)`);

            try {
                const examIdsFromSubQueryResult = await subQuery;
                console.log(`[API /questions GET] Subquery Result (examIdsFromSubQueryResult): ${JSON.stringify(examIdsFromSubQueryResult)}`);
                
                if (examIdsFromSubQueryResult && examIdsFromSubQueryResult.length > 0) {
                    conditions.push(inArray(questions.examId, examIdsFromSubQueryResult.map(e => e.id)));
                    console.log(`[API /questions GET] Added examId condition to main query. Current conditions count: ${conditions.length}`);
                } else {
                    console.log(`[API /questions GET] Subquery returned no examIds. No questions will be fetched based on these exam criteria.`);
                    // 중요: examId를 못찾으면 해당 태그로는 결과가 없어야 함.
                    // 이를 보장하기 위해 절대 참이 될 수 없는 조건을 추가 (예: 1=0)
                    // 또는, 여기서 바로 빈 결과를 반환할 수도 있습니다.
                    conditions.push(sql`1=0`); // 해당 시험 조건으로 결과 없음을 명시
                }
            } catch (e: any) {
                console.error(`[API /questions GET] Error executing subquery for examIds: ${e.message}`, e.stack);
                conditions.push(sql`1=0`); // 에러 발생 시에도 결과 없도록 처리
            }
        } else {
          console.log("[API /questions GET] examSubQueryConditions array was empty. No subquery for examIds executed based on examName/date/subject.");
        }
      }

      // 기타 태그 조건 추가 (otherTags)
      if (otherTags.length > 0) {
        // PostgreSQL의 경우 배열 포함 연산자 사용 가능
        // otherTags.forEach(tag => conditions.push(sql`${questions.tags} @> ${JSON.stringify([tag])}`));
        // 일반적인 JSON 문자열 포함 검색 (LIKE) - 성능에 주의
        otherTags.forEach(tag => {
            const escapedTag = tag.replace(/[\\%_]/g, char => `\\\\${char}`); // Escape special characters for LIKE
            conditions.push(sql`${questions.tags}::text LIKE ${`%\"${escapedTag}\"%`}`);
        });
        console.log(`[API /questions GET] Added otherTags conditions. Current conditions count: ${conditions.length}`);
      }
      
      console.log(`[API /questions GET] Total number of conditions for main query (tagsParam branch): ${conditions.length}`);

      if (conditions.length === 0 && tagsToFilter.length > 0) {
        // 태그가 있었지만 유효한 조건이 하나도 만들어지지 않은 경우
        console.warn("[API /questions GET] Tags were provided, but no effective query conditions were built. Returning empty results.");
        return NextResponse.json({ questions: [], totalQuestions: 0, page: currentPage, limit: effectiveLimit === undefined ? 0 : effectiveLimit });
      }
       if (conditions.length === 0 && tagsToFilter.length === 0) {
        // tagsParam은 있었지만 분리 후 tagsToFilter가 빈 경우 (예: tags=", , ")
        // 이 경우는 아래 전체 조회 로직으로 빠지게 될 것임.
        console.log("[API /questions GET] tagsParam was present but resulted in empty tagsToFilter. Will proceed to fetch all if no other branches hit.");
      }


      // 조건에 따라 쿼리 실행 (태그 기반)
      const combinedConditionForTags = conditions.length > 0 ? and(...conditions) : sql`1=1`; // 조건이 없으면 모든 문제 (하지만 아래 전체조회와 중복 가능성 체크)

      const baseQueryForTags = db
        .select(selectFields)
        .from(questions)
        .leftJoin(exams, eq(questions.examId, exams.id))
        .where(combinedConditionForTags)
        .orderBy(desc(questions.createdAt));
      
      let finalQueryForTags;
      if (effectiveLimit !== undefined) {
        finalQueryForTags = baseQueryForTags.limit(effectiveLimit).offset(skip);
      } else {
        finalQueryForTags = baseQueryForTags;
      }
      
      console.log(`[API /questions GET] Executing main query for tags - SQL: ${finalQueryForTags.toSQL().sql} with params: ${JSON.stringify(finalQueryForTags.toSQL().params)}`);
      const resultsByTags = await finalQueryForTags;

      const countResultForTags = await db
        .select({ count: sql`count(*)::int` }) // PostgreSQL specific cast
        .from(questions)
        .leftJoin(exams, eq(questions.examId, exams.id))
        .where(combinedConditionForTags);

      fetchedQuestions = resultsByTags.map(q => ({
        ...q,
        images: q.images ?? [], 
        explanationImages: q.explanationImages ?? [], 
        tags: q.tags ?? [], 
      }));
      totalQuestions = Number(countResultForTags[0]?.count) || 0;
      console.log(`[API /questions GET] Found ${fetchedQuestions.length} questions (total ${totalQuestions}) by tags.`);

    }
    // 3. 파라미터 없는 경우 (전체 목록 조회 - 페이지네이션)
    else {
      // 이 부분은 idsParam도 없고 tagsParam도 없을 때 실행됩니다.
      console.log(`[API /questions GET] Fetching all questions (paginated) as no ids or tags were provided.`);
      
      const baseQueryForAll = db
        .select(selectFields)
        .from(questions)
        .leftJoin(exams, eq(questions.examId, exams.id))
        // .where(and(...conditions)) // conditions가 비어있으므로 모든 데이터 대상. 필요 시 사용자별 필터 등 추가.
        .orderBy(desc(questions.createdAt));
      
      let finalQueryForAll;
      if (effectiveLimit !== undefined) {
        finalQueryForAll = baseQueryForAll.limit(effectiveLimit).offset(skip);
      } else {
        finalQueryForAll = baseQueryForAll;
      }

      console.log(`[API /questions GET] Executing query for all questions - SQL: ${finalQueryForAll.toSQL().sql} with params: ${JSON.stringify(finalQueryForAll.toSQL().params)}`);
      fetchedQuestions = (await finalQueryForAll).map(q => ({
        ...q,
        images: q.images ?? [],
        explanationImages: q.explanationImages ?? [],
        tags: q.tags ?? [],
      }));

      const countResultForAll = await db
        .select({ count: sql`count(*)::int` }) // PostgreSQL specific cast
        .from(questions)
        .leftJoin(exams, eq(questions.examId, exams.id)); // Count 쿼리에도 join 적용
        // .where(and(...conditions)); // 위와 동일

      totalQuestions = Number(countResultForAll[0]?.count) || 0;
      console.log(`[API /questions GET] Found ${fetchedQuestions.length} questions (total ${totalQuestions}) - all questions (paginated).`);
    }

    return NextResponse.json({ questions: fetchedQuestions, totalQuestions, page: currentPage, limit: effectiveLimit === undefined ? 0 : effectiveLimit });

  } catch (error: any) {
    console.error("[/api/questions GET Error]:", error.message, error.stack);
    // findOrCreateExamId 에서 발생하는 에러 메시지인지 확인 (POST 핸들러 관련이지만, GET에서도 유사한 로직이 있다면...)
    // 현재 GET 핸들러에서는 findOrCreateExamId를 직접 호출하지 않으므로, 이 조건은 크게 의미 없을 수 있음.
    if (error.message === "Failed to create or retrieve exam ID") { 
      return NextResponse.json({ error: "요청 처리 중 시험 정보 관련 오류 발생" }, { status: 500 });
    }
    return NextResponse.json(
      { error: "문제를 가져오는 중 서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 