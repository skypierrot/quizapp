import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db'; // db 인스턴스 경로 (프로젝트 구조에 맞게 수정 필요)
import { examResults } from '@/db/schema/examResults'; // 스키마 경로
import { eq, sql } from 'drizzle-orm';
import type { SubjectPerformanceStat } from '@/hooks/useSubjectPerformanceStats';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  try {
    const results = await db
      .select({
        subjectStats: examResults.subjectStats,
      })
      .from(examResults)
      .where(eq(examResults.userId, userId));

    if (!results || results.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const performanceMap = new Map<string, { solvedCount: number; correctCount: number }>();

    results.forEach(result => {
      if (result.subjectStats) {
        // subjectStats는 Record<string, { correct: number; total: number }> 타입
        for (const [subject, stats] of Object.entries(result.subjectStats)) {
          const current = performanceMap.get(subject) || { solvedCount: 0, correctCount: 0 };
          current.solvedCount += stats.total;
          current.correctCount += stats.correct;
          performanceMap.set(subject, current);
        }
      }
    });

    const performanceStats: SubjectPerformanceStat[] = Array.from(performanceMap.entries()).map(
      ([subject, counts]) => ({
        subject,
        solvedCount: counts.solvedCount,
        correctCount: counts.correctCount,
        correctRate: counts.solvedCount > 0 ? counts.correctCount / counts.solvedCount : 0,
      })
    );

    return NextResponse.json(performanceStats, { status: 200 });
  } catch (error) {
    console.error('Error fetching subject performance stats:', error);
    return NextResponse.json({ error: 'Failed to fetch subject performance stats' }, { status: 500 });
  }
} 