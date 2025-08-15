import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db'; // db 인스턴스 경로 (프로젝트 구조에 맞게 수정 필요)
import { examResults } from '@/db/schema/examResults'; // 스키마 경로
import { eq, sql } from 'drizzle-orm';
import type { SubjectPerformanceStat } from '@/hooks/useSubjectPerformanceStats';

// 확장된 타입 정의
export interface SubjectPerformanceStatWithExam extends SubjectPerformanceStat {
  examName: string;
  examSubject: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  try {
    const results = await db
      .select({
        examName: examResults.examName,
        examSubject: examResults.examSubject,
        subjectStats: examResults.subjectStats,
      })
      .from(examResults)
      .where(eq(examResults.userId, userId));

    if (!results || results.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const performanceMap = new Map<string, { solvedCount: number; correctCount: number; examName: string; examSubject: string }>();

    results.forEach(result => {
      if (result.subjectStats) {
        // subjectStats는 Record<string, { correct: number; total: number }> 타입
        for (const [subject, stats] of Object.entries(result.subjectStats)) {
          const key = `${result.examName}-${subject}`; // 시험명-과목명 조합으로 키 생성
          const current = performanceMap.get(key) || { 
            solvedCount: 0, 
            correctCount: 0, 
            examName: result.examName, 
            examSubject: result.examSubject 
          };
          current.solvedCount += stats.total;
          current.correctCount += stats.correct;
          performanceMap.set(key, current);
        }
      }
    });

    const performanceStats: SubjectPerformanceStatWithExam[] = Array.from(performanceMap.entries())
      .map(([key, data]) => {
        const subject = key.split('-')[1] || '미분류'; // 안전하게 기본값 제공
        return {
          subject,
          solvedCount: data.solvedCount,
          correctCount: data.correctCount,
          correctRate: data.solvedCount > 0 ? data.correctCount / data.solvedCount : 0,
          examName: data.examName,
          examSubject: data.examSubject,
        };
      });

    return NextResponse.json(performanceStats, { status: 200 });
  } catch (error) {
    console.error('Error fetching subject performance stats:', error);
    return NextResponse.json({ error: 'Failed to fetch subject performance stats' }, { status: 500 });
  }
} 