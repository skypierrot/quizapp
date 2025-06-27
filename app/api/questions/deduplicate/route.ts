import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { eq, inArray } from 'drizzle-orm';
import { questions, exams } from '@/db/schema';

// Helper: 문제를 직렬화하여 중복 판단용 키 생성
function serializeQuestion(q: {
  content: string | null;
  options: any;
  answer: number | null;
  explanation: string | null;
  images: any;
  explanationImages: any;
  tags: string[] | null;
  examName: string | null; // exams 테이블에서 가져온 필드
  examDate: string | null; // exams 테이블에서 가져온 필드
  examSubject: string | null; // exams 테이블에서 가져온 필드
}) {
  return JSON.stringify({
    content: q.content,
    options: q.options,
    answer: q.answer,
    explanation: q.explanation,
    images: q.images,
    explanationImages: q.explanationImages,
    tags: q.tags,
    examName: q.examName,
    examDate: q.examDate,
    examSubject: q.examSubject,
  });
}

// GET: 중복 문제 그룹 반환
export async function GET() {
  try {
    const allQuestionsRaw = await db
      .select({
        // questions 테이블의 주요 컬럼
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
      .leftJoin(exams, eq(questions.examId, exams.id));

    const map = new Map<string, any[]>();
    for (const q of allQuestionsRaw) {
      const key = serializeQuestion(q);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(q);
    }
    const duplicates = Array.from(map.values()).filter(arr => arr.length > 1);
    return NextResponse.json({ duplicates, hasDuplicates: duplicates.length > 0 });
  } catch (error) {
    console.error('Error in deduplicate GET:', error);
    return NextResponse.json(
      { error: 'Failed to check duplicates', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST: 중복 문제 정리(한 개만 남기고 삭제)
export async function POST() {
  try {
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
        examId: questions.examId,
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
      const key = serializeQuestion(q);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(q);
    }
    
    const toDelete: string[] = [];
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
    
    let deletedCount = 0;
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
  } catch (error) {
    console.error('Error in deduplicate POST:', error);
    return NextResponse.json(
      { error: 'Failed to delete duplicates', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
