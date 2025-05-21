import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { questions } from "@/db/schema/questions";
import { exams } from "@/db/schema/exams"; // exams 스키마 import 추가
import { eq, sql, and, inArray, SQL, Placeholder, desc, asc, getTableColumns } from "drizzle-orm";
// import { auth } from "@clerk/nextjs"; // Clerk 인증 주석 완전 삭제
import { IQuestion, IManualQuestion } from '@/types' // IOptionImage, IQuestionImage 제거
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

// API 응답을 위한 이미지 데이터 정규화 함수
function normalizeDbImages(dbImages: any): { url: string; hash: string }[] {
  if (!dbImages) return [];
  // DB에서 문자열 또는 객체 배열 형태로 올 수 있음
  let imagesArray: any[];
  if (typeof dbImages === 'string') {
    try {
      imagesArray = JSON.parse(dbImages);
    } catch (e) {
      // 단일 URL 문자열일 경우 (레거시 또는 단순 필드)
      if (dbImages.startsWith('/') || dbImages.startsWith('http')) {
        return [{ url: moveTmpToUploaded(dbImages), hash: '' }];
      }
      console.error('Failed to parse images string and not a URL:', dbImages, e);
      return [];
    }
  } else if (Array.isArray(dbImages)) {
    imagesArray = dbImages;
  } else {
    console.warn('Unexpected images format in DB:', dbImages);
    return [];
  }

  return imagesArray.map(img => {
    if (typeof img === 'string') {
      return { url: moveTmpToUploaded(img), hash: '' };
    } else if (img && typeof img.url === 'string') {
      return { url: moveTmpToUploaded(img.url), hash: img.hash || '' };
    }
    console.warn('Invalid image object in array:', img);
    return { url: '', hash: '' }; // 유효하지 않은 항목에 대한 기본값
  }).filter(img => img.url); // URL이 없는 항목 제거
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
      examName: examNameFromTags,
      examDate: examDateFromTags,
      examSubject: examSubjectFromTags
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
    const randomStart = url.searchParams.get("randomStart") === "true";

    const examNameSearch = url.searchParams.get("examNameSearch")?.trim();
    const dateSearch = url.searchParams.get("dateSearch")?.trim();
    const subjectSearch = url.searchParams.get("subjectSearch")?.trim();
    const tagSearch = url.searchParams.get("tagSearch")?.trim();

    let fetchedQuestions: IQuestion[] = [];
    let totalQuestions = 0;
    let conditions: SQL<unknown>[] = [];

    // selectFields를 핸들러 상단에 정의
    const selectFields = {
      ...getTableColumns(questions),
      examName: exams.name,
      examDate: exams.date,
      examSubject: exams.subject,
    };

    if (idsParam) {
      console.log(`[API /questions GET] Fetching by IDs: ${idsParam}`);
      const idArray = idsParam.split(',').map(id => id.trim()).filter(id => id.length > 0);

      if (idArray.length === 0) {
        console.warn("[API /questions GET] Invalid or empty IDs provided");
        return NextResponse.json({ error: "유효한 문제 ID가 제공되지 않았습니다." }, { status: 400 });
      }
      conditions.push(inArray(questions.id, idArray));
      
      const resultsById = await db
        .select(selectFields)
        .from(questions)
        .leftJoin(exams, eq(questions.examId, exams.id))
        .where(and(...conditions))
        .orderBy(asc(questions.questionNumber), asc(questions.createdAt));

      fetchedQuestions = resultsById.map(q => ({
        ...q,
        options: q.options ? (Array.isArray(q.options) ? q.options : JSON.parse(q.options as string || '[]')).map((opt: any) => ({ ...opt, images: normalizeDbImages(opt.images) })) : [],
        images: normalizeDbImages(q.images),
        explanationImages: normalizeDbImages(q.explanationImages),
        tags: q.tags || [], 
      })) as IQuestion[];
      totalQuestions = fetchedQuestions.length;
      console.log(`[API /questions GET] Found ${totalQuestions} questions by IDs.`);

    } else if (tagsParam) {
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

      let currentConditions: SQL<unknown>[] = []; // 이 분기에서 사용할 조건 배열

      if (examNameTags.length > 0 || dateTags.length > 0 || subjectTags.length > 0) {
        let examSubQueryConditions: SQL<unknown>[] = [];
        if (examNameTags.length > 0) examSubQueryConditions.push(inArray(exams.name, examNameTags));
        if (dateTags.length > 0) examSubQueryConditions.push(inArray(exams.date, dateTags));
        if (subjectTags.length > 0) examSubQueryConditions.push(inArray(exams.subject, subjectTags));
        
        if (examSubQueryConditions.length > 0) {
            const subQuery = db.select({ id: exams.id }).from(exams).where(and(...examSubQueryConditions));
            const examIdsFromSubQueryResult = await subQuery;
            if (examIdsFromSubQueryResult && examIdsFromSubQueryResult.length > 0) {
                currentConditions.push(inArray(questions.examId, examIdsFromSubQueryResult.map(e => e.id)));
            } else {
                currentConditions.push(sql`1=0`); 
            }
        } else {
            // No specific exam tags, might be only otherTags or empty
        }
      }

      if (otherTags.length > 0) {
        otherTags.forEach(tag => {
            const escapedTag = tag.replace(/[\\%_]/g, char => `\\\\${char}`);
            currentConditions.push(sql`${questions.tags}::text LIKE ${`%\""${escapedTag}\""%`}`);
        });
      }
      
      if (currentConditions.length === 0 && tagsToFilter.length > 0) {
        return NextResponse.json({ questions: [], totalQuestions: 0, page: currentPage, totalPages: 1, limit: effectiveLimit === undefined ? 0 : effectiveLimit });
      }
      const combinedConditionForTags = currentConditions.length > 0 ? and(...currentConditions) : sql`1=1`;

      if (randomStart && currentPage === 1 && effectiveLimit !== undefined) {
        console.log(`[API /questions GET] Applying special random logic for first page with tags.`);
        // 1. 조건에 맞는 모든 문제 ID 조회
        const allMatchingQuestionIdsResult = await db
          .select({ id: questions.id })
          .from(questions)
          .leftJoin(exams, eq(questions.examId, exams.id))
          .where(combinedConditionForTags);
        
        let allMatchingQuestionIds = allMatchingQuestionIdsResult.map(q => q.id);
        totalQuestions = allMatchingQuestionIds.length;

        if (totalQuestions > 0) {
          // 2. ID 목록 셔플 (Fisher-Yates shuffle)
          for (let i = allMatchingQuestionIds.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allMatchingQuestionIds[i], allMatchingQuestionIds[j]] = [allMatchingQuestionIds[j], allMatchingQuestionIds[i]];
          }

          // 3. 첫 페이지 분량의 ID 추출
          const firstPageIds = allMatchingQuestionIds.slice(0, effectiveLimit);

          if (firstPageIds.length > 0) {
            // 4. 추출된 ID로 실제 문제 데이터 조회 (정렬은 ID 배열 순서 따름 - DB에 따라 다를 수 있음)
            const resultsByShuffledIds = await db
              .select(selectFields)
              .from(questions)
              .leftJoin(exams, eq(questions.examId, exams.id))
              .where(inArray(questions.id, firstPageIds)); // ID로 조회
            
            // Drizzle의 inArray는 순서를 보장하지 않을 수 있으므로, 필요시 직접 정렬
            const orderedResults = firstPageIds.map(id => resultsByShuffledIds.find(r => r.id === id)).filter(r => r !== undefined) as (typeof resultsByShuffledIds[0])[];

            fetchedQuestions = orderedResults.map(q => ({
              ...q,
              options: q.options ? (Array.isArray(q.options) ? q.options : JSON.parse(q.options as string || '[]')).map((opt: any) => ({ ...opt, images: normalizeDbImages(opt.images) })) : [],
              images: normalizeDbImages(q.images),
              explanationImages: normalizeDbImages(q.explanationImages),
              tags: q.tags || [],
            })) as IQuestion[];
          } else {
            fetchedQuestions = []; // ID는 있었으나, 모종의 이유로 첫 페이지 ID를 못가져온 경우 (이론상 발생 어려움)
          }
        } else {
          fetchedQuestions = []; // 조건에 맞는 문제 없음
        }
      } else {
        // 일반적인 태그 기반 조회 (첫 페이지가 아니거나, randomStart가 아니거나, limit이 없는 경우)
        const countResultForTags = await db
          .select({ count: sql`count(*)::int` })
          .from(questions)
          .leftJoin(exams, eq(questions.examId, exams.id))
          .where(combinedConditionForTags);
        
        totalQuestions = Number(countResultForTags[0]?.count) || 0;

        // 1. 기본 쿼리 구성
        let query = db
          .select(selectFields) // selectFields는 questions 테이블 컬럼 + exam 관련 컬럼을 포함
          .from(questions)
          .leftJoin(exams, eq(questions.examId, exams.id))
          .where(combinedConditionForTags);

        // 2. 정렬 적용 (타입을 명확히 하기 위해 query를 재할당)
        let orderedQuery;
        if (randomStart) {
          orderedQuery = query.orderBy(sql`RANDOM()`);
        } else {
          orderedQuery = query.orderBy(asc(questions.questionNumber), asc(questions.createdAt));
        }

        // 3. 페이지네이션 적용 (타입을 명확히 하기 위해 orderedQuery를 재할당)
        let paginatedQuery;
        if (effectiveLimit !== undefined) {
          paginatedQuery = orderedQuery.limit(effectiveLimit).offset(skip);
        } else {
          paginatedQuery = orderedQuery;
        }
        
        // Drizzle 쿼리 결과의 예상 타입 정의
        // questions 스키마의 모든 필드와 exams에서 가져온 추가 필드를 포함
        type DbQueryResult = typeof questions.$inferSelect & {
          examName: string | null;
          examDate: string | null;
          examSubject: string | null;
          // options, images, explanationImages는 jsonb[] 또는 유사 타입일 수 있음
          // Drizzle은 이를 string 또는 object로 가져올 수 있으므로, 실제 DB 스키마와 라이브러리 동작 확인 필요
        };

        const resultsByTags: DbQueryResult[] = await paginatedQuery;
        
        fetchedQuestions = resultsByTags.map((q: DbQueryResult) => {
          // IQuestion에 맞게 이미지 및 옵션 구조 변환
          const mappedOptions = q.options ? 
            (Array.isArray(q.options) ? q.options : JSON.parse(q.options as string || '[]')).map((opt: any) => ({
              number: opt.number, 
              text: opt.text,
              images: normalizeDbImages(opt.images)
            })) : [];

          const mappedImages = normalizeDbImages(q.images);
          const mappedExplanationImages = normalizeDbImages(q.explanationImages);

          return {
            id: q.id,
            content: q.content,
            options: mappedOptions,
            answer: q.answer,
            explanation: q.explanation,
            tags: q.tags || [],
            images: mappedImages,
            explanationImages: mappedExplanationImages,
            createdAt: q.createdAt,
            updatedAt: q.updatedAt,
            userId: q.userId,
            examId: q.examId,
            questionNumber: q.questionNumber,
            // difficulty: q.difficulty, // DbQueryResult에 없으므로 제거 또는 스키마/selectFields 확인 필요
            // source: q.source,       // DbQueryResult에 없으므로 제거 또는 스키마/selectFields 확인 필요
            // selectFields로 가져온 exam 정보 추가
            examName: q.examName,
            examDate: q.examDate,
            examSubject: q.examSubject,
          } as IQuestion; // 최종적으로 IQuestion 타입으로 단언
        });
      }
      console.log(`[API /questions GET] Found ${fetchedQuestions.length} questions (total ${totalQuestions}) by tags.`);
    }
    // 3. 파라미터 없는 경우 (전체 목록 조회 - 페이지네이션)
    else {
      console.log(`[API /questions GET] Fetching all questions (paginated) as no ids or tags were provided.`);
      
      // 검색 조건들을 먼저 conditions 배열에 추가
      if (examNameSearch) {
        conditions.push(sql`lower(${exams.name}) LIKE lower(${'%' + examNameSearch + '%'})`);
      }
      if (dateSearch) {
        conditions.push(sql`lower(${exams.date}) LIKE lower(${'%' + dateSearch + '%'})`);
      }
      if (subjectSearch) {
        conditions.push(sql`lower(${exams.subject}) LIKE lower(${'%' + subjectSearch + '%'})`);
      }
      if (tagSearch) {
        conditions.push(sql`EXISTS (SELECT 1 FROM unnest(${questions.tags}) AS t WHERE lower(t) LIKE lower(${'%' + tagSearch + '%'}))`);
      }
      const combinedConditionForAllOrSearch = conditions.length > 0 ? and(...conditions) : undefined; // undefined면 모든 문제

      const baseQueryForAll = db
        .select(selectFields)
        .from(questions)
        .leftJoin(exams, eq(questions.examId, exams.id))
        .where(combinedConditionForAllOrSearch) // 통합된 조건 사용
        .orderBy(asc(exams.name), asc(exams.date), asc(exams.subject), asc(questions.questionNumber), asc(questions.createdAt));
      
      let finalQueryForAll;
      if (effectiveLimit !== undefined) {
        finalQueryForAll = baseQueryForAll.limit(effectiveLimit).offset(skip);
      } else {
        finalQueryForAll = baseQueryForAll;
      }

      console.log(`[API /questions GET] Executing query for all questions - SQL: ${finalQueryForAll.toSQL().sql} with params: ${JSON.stringify(finalQueryForAll.toSQL().params)}`);
      fetchedQuestions = (await finalQueryForAll).map(q => ({
        ...q,
        options: q.options ? q.options.map(opt => ({ ...opt, images: normalizeDbImages(opt.images) })) : [],
        images: normalizeDbImages(q.images),
        explanationImages: normalizeDbImages(q.explanationImages),
        tags: q.tags || [],
      }));

      const countResultForAll = await db
        .select({ count: sql`count(*)::int` }) // PostgreSQL specific cast
        .from(questions)
        .leftJoin(exams, eq(questions.examId, exams.id)); // Count 쿼리에도 join 적용
        // .where(and(...conditions)); // 위와 동일

      totalQuestions = Number(countResultForAll[0]?.count) || 0;
      console.log(`[API /questions GET] Found ${fetchedQuestions.length} questions (total ${totalQuestions}) - all questions (paginated).`);
    }

    // totalPages 계산은 effectiveLimit 유무에 따라
    const calculatedTotalPages = effectiveLimit !== undefined && totalQuestions > 0
        ? Math.ceil(totalQuestions / effectiveLimit)
        : (totalQuestions > 0 ? 1 : 0); // limit이 없으면 1페이지 또는 0페이지

    return NextResponse.json({
      questions: fetchedQuestions,
      page: currentPage,
      limit: effectiveLimit === undefined ? 0 : effectiveLimit, // limit 0은 전체를 의미
      totalPages: calculatedTotalPages,
      totalQuestions,
    });

  } catch (error: any) {
    console.error("[/api/questions GET Error]:", error);
    return NextResponse.json(
      { error: error.message || "문제를 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 