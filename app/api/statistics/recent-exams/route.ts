import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db'; // db 인스턴스 경로 (프로젝트 구조에 맞게 수정 필요)
import { examResults } from '@/db/schema/examResults'; // 스키마 경로
import { exams } from '@/db/schema/exams'; // exams 스키마 경로 추가
import { eq, desc } from 'drizzle-orm';
import type { RecentExamStat } from '@/hooks/useRecentExamsStats';

// 날짜를 YYYY-MM-DD hh:mm:ss 형식으로 변환하는 함수
function formatDateTime(date: Date | string): string {
  if (!date) return '';
  
  const d = new Date(date);
  
  // 날짜 부분: YYYY-MM-DD
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  // 시간 부분: hh:mm:ss
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

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
        // 기존 date 필드 (호환성 유지)
        date: examResults.examDate, 
        // 실제 시험 날짜
        examDate: examResults.examDate,
        // 사용자가 응시한 날짜
        createdAt: examResults.createdAt,
        resultId: examResults.id,
        // exams 테이블과 조인하여 실제 examId를 가져오려면 스키마 관계 설정 및 조인 쿼리 필요
        // 우선 examResults.id를 examId로 사용
      })
      .from(examResults)
      .where(eq(examResults.userId, userId))
      .orderBy(desc(examResults.createdAt)) // 응시일 기준으로 정렬 (사용자가 응시한 순서)
      .limit(limit);

    if (!results || results.length === 0) {
      return NextResponse.json([], { status: 200 });
    }
    
    // 날짜 필드를 형식에 맞게 변환
    const formattedResults: RecentExamStat[] = results.map(r => ({
      ...r,
      // examDate는 YYYY-MM-DD 형식으로
      date: String(r.date), 
      examDate: String(r.examDate),
      // createdAt은 YYYY-MM-DD hh:mm:ss 형식으로
      createdAt: formatDateTime(r.createdAt),
    }));

    return NextResponse.json(formattedResults, { status: 200 });
  } catch (error) {
    console.error('Error fetching recent exams stats:', error);
    return NextResponse.json({ error: 'Failed to fetch recent exams stats' }, { status: 500 });
  }
} 