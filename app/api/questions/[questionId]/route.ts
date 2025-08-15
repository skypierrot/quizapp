import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { questions } from "@/db/schema/questions";
import { exams } from "@/db/schema/exams";
import { eq, and } from "drizzle-orm";
import fs from 'fs';
import path from 'path';
import { questionImageUsage } from '@/db/schema/questionImageUsage';
import { saveQuestions } from '@/db/saveQuestions';

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

  if (existingExam && existingExam.length > 0 && existingExam[0]?.id) {
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
    if (!newExam || newExam.length === 0 || !newExam[0]?.id) {
      throw new Error("Failed to create or retrieve exam ID");
    }
    return newExam[0].id;
  }
}

// 단일 문제 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const { questionId } = await params;

    // 문제 조회 (다른 API와 일관된 방식 사용)
    const questionResult = await db
      .select({
        id: questions.id,
        content: questions.content,
        options: questions.options,
        answer: questions.answer,
        explanation: questions.explanation,
        images: questions.images,
        explanationImages: questions.explanationImages,
        tags: questions.tags,
        examId: questions.examId,
        userId: questions.userId,
        createdAt: questions.createdAt,
        updatedAt: questions.updatedAt,
        // exams 테이블 컬럼 (leftJoin으로 가져옴)
        examName: exams.name,
        examDate: exams.date,
        examSubject: exams.subject,
      })
      .from(questions)
      .leftJoin(exams, eq(questions.examId, exams.id))
      .where(eq(questions.id, questionId))
      .limit(1);

    // 문제가 없을 경우
    if (!questionResult || questionResult.length === 0) {
      return NextResponse.json(
        { error: "문제를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const question = questionResult[0];

    // 이미지 데이터 정규화
    const normalizeImages = (imgs: any): { url: string; hash: string }[] => {
      if (!imgs) return [];
      let imagesArray: any[];
      if (typeof imgs === 'string') {
        try {
          imagesArray = JSON.parse(imgs);
        } catch (e) {
          if (imgs.startsWith('/') || imgs.startsWith('http')) {
            return [{ url: moveTmpToUploaded(imgs), hash: '' }];
          }
          return [];
        }
      } else if (Array.isArray(imgs)) {
        imagesArray = imgs;
      } else {
        return [];
      }

      return imagesArray.map(img => {
        if (typeof img === 'string') {
          return { url: moveTmpToUploaded(img), hash: '' };
        } else if (img && typeof img.url === 'string') {
          return { url: moveTmpToUploaded(img.url), hash: img.hash || '' };
        }
        return { url: '', hash: '' };
      }).filter(img => img.url);
    };

    if (!question) {
      return NextResponse.json({ error: '문제를 찾을 수 없습니다.' }, { status: 404 });
    }

    // API 응답 형식에 맞게 데이터 가공
    const responseQuestion = {
      ...question,
      options: question.options ? (Array.isArray(question.options) ? question.options : JSON.parse(question.options as string || '[]')).map((opt: any) => ({ ...opt, images: normalizeImages(opt.images) })) : [],
      images: normalizeImages(question.images),
      explanationImages: normalizeImages(question.explanationImages),
      tags: question.tags || [],
    };

    return NextResponse.json({ question: responseQuestion });
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
  { params }: { params: Promise<{ questionId: string }> }
) {
  const { questionId } = await params;
  const formData = await request.formData();
  
  const examName = formData.get('examName') as string;
  const examDate = formData.get('examDate') as string;
  const examSubject = formData.get('examSubject') as string;

  // 필수 시험 정보 유효성 검사 (빈 문자열 또는 null 체크)
  if (!examName || !examDate || !examSubject) {
    return NextResponse.json({ error: '시험명, 날짜, 과목은 필수 항목입니다.' }, { status: 400 });
  }

  // 날짜 형식 검증
  if (!/^\d{4}-\d{2}-\d{2}$/.test(examDate)) {
    return NextResponse.json({ error: '날짜 형식이 잘못되었습니다. YYYY-MM-DD 형식으로 입력해주세요.' }, { status: 400 });
  }

  let questionObj;
  try {
    questionObj = {
      id: questionId,
      content: formData.get('content') as string,
      options: JSON.parse(formData.get('options') as string || '[]'),
      answer: Number(formData.get('answer') as string),
      explanation: formData.get('explanation') as string || '',
      tags: JSON.parse(formData.get('tags') as string || '[]'),
      images: JSON.parse(formData.get('images') as string || '[]'),
      explanationImages: JSON.parse(formData.get('explanationImages') as string || '[]'),
      // 유효성 검사를 통과했으므로, null이 아님을 보장
      examName: examName,
      examDate: examDate,
      examSubject: examSubject,
    };
  } catch (e) {
    console.error("Error parsing formData in PUT:", e);
    return NextResponse.json({ error: '요청 데이터 파싱 중 오류가 발생했습니다.' }, { status: 400 });
  }
  
  try {
    const [savedQuestion] = await saveQuestions([questionObj]);
    
    const responseData = {
      ...savedQuestion,
      examName: examName,
      examDate: examDate,
      examSubject: examSubject,
    };

    return NextResponse.json({ question: responseData });
  } catch (error) {
    console.error("Error during saveQuestions in PUT handler:", error);
    // saveQuestions 내부에서 발생하는 `is missing examName...` 오류는 이제 여기서 먼저 잡힘.
    // 따라서 아래의 복잡한 오류 메시지 분기보다는 일반적인 오류 메시지로 통일 가능.
    return NextResponse.json({ error: '문제 업데이트 중 내부 서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 단일 문제 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const { questionId } = await params;

    // 문제 존재 여부 확인
    const existingQuestion = await db
      .select({ id: questions.id })
      .from(questions)
      .where(eq(questions.id, questionId))
      .limit(1);

    if (!existingQuestion || existingQuestion.length === 0) {
      return NextResponse.json(
        { error: "문제를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 문제 삭제
    await db.delete(questions)
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