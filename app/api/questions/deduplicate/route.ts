import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { eq, inArray } from 'drizzle-orm';
import { questions, exams } from '@/db/schema';

// Helper: 문제를 직렬화하여 중복 판단용 키 생성
function serializeQuestion(q: {
  content: string | null;
  options: any; // 실제 타입으로 변경 권장 (예: IOption[])
  answer: number | null;
  explanation: string | null;
  images: any; // 실제 타입으로 변경 권장 (예: string[] | {url:string, hash:string}[])
  explanationImages: any; // 실제 타입으로 변경 권장
  tags: string[] | null;
  // examId: string | null; // examId 대신 examName, examDate, examSubject를 직접 사용
  examName: string | null; // 추가
  examDate: string | null; // 추가
  examSubject: string | null; // 추가
}) {
  return JSON.stringify({
    content: q.content,
    options: q.options,
    answer: q.answer,
    explanation: q.explanation,
    images: q.images,
    explanationImages: q.explanationImages,
    tags: q.tags,
    // examId: q.examId, 
    examName: q.examName, // 추가
    examDate: q.examDate, // 추가
    examSubject: q.examSubject, // 추가
  });
}

// GET: 중복 문제 그룹 반환
export async function GET() {
  const allQuestionsRaw = await db
    .select({
      // questions 테이블의 주요 컬럼 명시적 나열
      id: questions.id,
      content: questions.content,
      options: questions.options,
      answer: questions.answer,
      explanation: questions.explanation,
      images: questions.images,
      explanationImages: questions.explanationImages,
      tags: questions.tags,
      examId: questions.examId, // 여전히 필요할 수 있음 (예: 프론트에서 examId로 다른 정보 조회 등)
      userId: questions.userId,
      createdAt: questions.createdAt,
      updatedAt: questions.updatedAt,
      // exams 테이블 컬럼
      examName: exams.name,
      examDate: exams.date,
      examSubject: exams.subject,
    })
    .from(questions)
    .leftJoin(exams, eq(questions.examId, exams.id));

  const map = new Map<string, any[]>();
  // allQuestionsRaw의 각 요소 q는 위 select에서 정의한 모든 필드를 포함합니다.
  for (const q of allQuestionsRaw) {
    // q 객체에는 examName, examDate, examSubject가 포함되어 있음
    const key = serializeQuestion(q);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(q);
  }
  const duplicates = Array.from(map.values()).filter(arr => arr.length > 1);
  return NextResponse.json({ duplicates, hasDuplicates: duplicates.length > 0 });
}

// POST: 중복 문제 정리(한 개만 남기고 삭제)
export async function POST() {
  // POST에서도 GET과 동일하게 exams 테이블과 조인하여 examName, examDate, examSubject를 가져옴
  const allQuestionsForPost = await db
    .select({
      id: questions.id,
      content: questions.content,
      options: questions.options,
      answer: questions.answer,
      explanation: questions.explanation,
      images: questions.images,
      explanationImages: questions.explanationImages,
      tags: questions.tags,
      examId: questions.examId, // serializeQuestion에는 직접 사용 안하지만, 객체에는 포함
      userId: questions.userId,
      createdAt: questions.createdAt,
      updatedAt: questions.updatedAt,
      examName: exams.name,
      examDate: exams.date,
      examSubject: exams.subject,
    })
    .from(questions)
    .leftJoin(exams, eq(questions.examId, exams.id));

  const map = new Map<string, any[]>();
  for (const q of allQuestionsForPost) {
    // q 객체에는 examName, examDate, examSubject가 포함되어 있음
    const key = serializeQuestion(q);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(q);
  }
  const toDelete: string[] = [];
  let deletedCount = 0;
  for (const arr of map.values()) {
    if (arr.length > 1) {
      arr.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      for (let i = 1; i < arr.length; ++i) {
        if (arr[i].id) {
          toDelete.push(arr[i].id);
        }
      }
    }
  }
  if (toDelete.length > 0) {
    const deleteResult = await db.delete(questions).where(
      inArray(questions.id, toDelete)
    ).returning({id: questions.id});
    deletedCount = deleteResult.length;
  }
  return NextResponse.json({ 
    deleted: deletedCount, 
    message: `${deletedCount}개의 중복 문제가 삭제되었습니다.` 
  });
}
