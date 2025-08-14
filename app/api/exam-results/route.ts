import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { examResults, type InsertExamResult } from '@/db/schema';
import type { INewExamResult, IExamResult } from '@/types';
import { eq, desc, and, gt } from 'drizzle-orm';
import { updateStatsOnExamResultSave } from '@/middleware/statisticsMiddleware';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results = await db
      .select()
      .from(examResults)
      .where(eq(examResults.userId, userId))
      .orderBy(desc(examResults.createdAt));
    
    return NextResponse.json(results as IExamResult[]);
  } catch (error) {
    console.error('Error fetching exam results:', error);
    return NextResponse.json({ message: '시험 결과를 불러오는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  let resultData: INewExamResult;
  try {
    resultData = await req.json();
  } catch (error) {
    return NextResponse.json({ message: '잘못된 요청 형식입니다.' }, { status: 400 });
  }

  const { examName, examYear, examDate, examSubject, answers, score, correctCount, totalQuestions, elapsedTime, limitTime, subjectStats } = resultData;
  
  if (!examName || typeof examYear !== 'number' || !examDate || !examSubject || !answers || 
      typeof score !== 'number' || typeof correctCount !== 'number' || 
      typeof totalQuestions !== 'number' || typeof elapsedTime !== 'number') {
    return NextResponse.json({ message: '필수 데이터가 누락되었습니다.' }, { status: 400 });
  }

  try {
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
    
    const existingResults = await db
      .select()
      .from(examResults)
      .where(
        and(
          eq(examResults.userId, userId),
          eq(examResults.examName, examName),
          eq(examResults.examYear, examYear),
          eq(examResults.examDate, examDate),
          eq(examResults.examSubject, examSubject),
          eq(examResults.score, score),
          eq(examResults.correctCount, correctCount),
          eq(examResults.totalQuestions, totalQuestions),
          gt(examResults.createdAt, tenMinutesAgo) // Ensure date comparison is correct
        )
      )
      .orderBy(desc(examResults.createdAt))
      .limit(1);
    
    if (existingResults.length > 0) {
      const existingResult = existingResults[0];
      if (existingResult) {
        console.log('[API] 중복 결과 감지:', existingResult.id);
        return NextResponse.json(existingResult);
      }
    }
    
    const insertData: InsertExamResult = {
      userId,
      examName,
      examYear,
      examDate,
      examSubject,
      answers,
      score,
      correctCount,
      totalQuestions,
      subjectStats: subjectStats || {},
      elapsedTime,
      limitTime: limitTime === undefined ? null : limitTime,
    };
    
    const [saved] = await db.insert(examResults).values(insertData).returning();
    
    if (!saved) {
      return NextResponse.json({ message: '시험 결과 저장에 실패했습니다.' }, { status: 500 });
    }
    
    // 시험 결과가 저장된 후 통계 업데이트
    await updateStatsOnExamResultSave(userId, {
      id: saved.id,
      examId: `${saved.examName}-${saved.examYear}-${saved.examSubject}`, // examId 조합
      score: saved.score, // 실제 점수 필드 사용
      correctCount: saved.correctCount, // 실제 맞힌 문제 수 전달
      totalQuestions: saved.totalQuestions,
      elapsedTime: saved.elapsedTime,
      createdAt: saved.createdAt,
    });
    
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error('Error saving exam result:', error);
    return NextResponse.json({ message: '시험 결과를 저장하는 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 