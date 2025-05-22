import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userDailyStats } from '@/db/schema/userDailyStats';
import { eq, desc } from 'drizzle-orm';
import type { DailyStat } from '@/hooks/useDailyStats';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const daysParam = searchParams.get('days');
  const days = daysParam ? parseInt(daysParam, 10) : 30; // 기본값 30일

  if (!userId) {
    // 전체 사용자 통계가 필요한 경우 (미구현)
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  try {
    // userDailyStats에서 최근 N일 데이터 가져오기
    const dailyStats = await db
      .select({
        date: userDailyStats.date,
        solvedCount: userDailyStats.solvedCount,
        totalStudyTime: userDailyStats.totalStudyTime,
        correctCount: userDailyStats.correctCount,
      })
      .from(userDailyStats)
      .where(eq(userDailyStats.userId, userId))
      .orderBy(desc(userDailyStats.date))
      .limit(days);

    // 날짜 기준 오름차순으로 재정렬 (그래프 표시 등을 위해)
    const formattedResults: DailyStat[] = dailyStats
      .map(d => ({
        date: String(d.date), // date를 문자열로 변환
        solvedCount: d.solvedCount || 0,
        totalStudyTime: d.totalStudyTime || 0,
        correctCount: d.correctCount || 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date)); // 날짜 오름차순 정렬

    return NextResponse.json(formattedResults, { status: 200 });
  } catch (error) {
    console.error('Error fetching daily stats:', error);
    return NextResponse.json({ error: 'Failed to fetch daily stats' }, { status: 500 });
  }
} 