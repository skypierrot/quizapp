import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db'; // db 인스턴스 경로 (프로젝트 구조에 맞게 수정 필요)
import { examResults } from '@/db/schema/examResults'; // 스키마 경로
import { exams } from '@/db/schema/exams'; // exams 스키마 경로 추가
import { eq, desc } from 'drizzle-orm';
import type { RecentExamStat } from '@/hooks/useRecentExamsStats';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : 5; // 기본값 5

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  try {
    const results = await db
      .select({
        // examResults.id를 examId 와 resultId로 사용
        examId: examResults.id, 
        examName: examResults.examName,
        score: examResults.score,
        // examResults.examDate는 Date 객체일 수 있으므로 ISO 문자열로 변환 필요
        // 실제 Drizzle 반환 타입 및 테이블 컬럼 타입(date vs timestamp)에 따라 조정 필요
        date: examResults.examDate, 
        resultId: examResults.id,
        // exams 테이블과 조인하여 실제 examId를 가져오려면 스키마 관계 설정 및 조인 쿼리 필요
        // 우선 examResults.id를 examId로 사용
      })
      .from(examResults)
      .where(eq(examResults.userId, userId))
      .orderBy(desc(examResults.examDate)) // examDate로 정렬
      .limit(limit);

    if (!results || results.length === 0) {
      return NextResponse.json([], { status: 200 });
    }
    
    // 날짜 필드를 ISO 문자열로 변환 (YYYY-MM-DD)
    const formattedResults: RecentExamStat[] = results.map(r => ({
      ...r,
      // r.date가 확실히 string이 되도록 명시적 변환
      date: String(r.date), 
    }));

    return NextResponse.json(formattedResults, { status: 200 });
  } catch (error) {
    console.error('Error fetching recent exams stats:', error);
    return NextResponse.json({ error: 'Failed to fetch recent exams stats' }, { status: 500 });
  }
} 