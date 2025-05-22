import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userStats } from '@/db/schema/userStats';
import { userDailyStats } from '@/db/schema/userDailyStats';
import { eq, desc } from 'drizzle-orm';

export interface SummaryStat {
  totalStudyTime: number;
  totalSolved: number;
  correctRate: number;
  streak: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    // 전체 사용자 통계가 필요한 경우 (미구현)
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  try {
    // 1. userStats에서 정보 가져오기
    const stats = await db
      .select({
        totalQuestions: userStats.totalQuestions,
        totalCorrect: userStats.totalCorrect,
      })
      .from(userStats)
      .where(eq(userStats.userId, userId));

    const totalSolved = stats.length > 0 ? stats[0].totalQuestions || 0 : 0;
    const totalCorrect = stats.length > 0 ? stats[0].totalCorrect || 0 : 0;
    const correctRate = totalSolved > 0 ? totalCorrect / totalSolved : 0;

    // 2. userDailyStats에서 정보 가져오기
    const dailyStatsData = await db
      .select({
        totalStudyTime: userDailyStats.totalStudyTime,
        streak: userDailyStats.streak,
      })
      .from(userDailyStats)
      .where(eq(userDailyStats.userId, userId))
      .orderBy(desc(userDailyStats.date))
      .limit(1);

    let totalStudyTime = 0;
    let streak = 0;

    // 데이터베이스에 누적 학습 시간이 있는지 확인
    // 없으면 최근 30일치 userDailyStats 데이터를 합산
    const recentDailyStats = await db
      .select({
        totalStudyTime: userDailyStats.totalStudyTime,
      })
      .from(userDailyStats)
      .where(eq(userDailyStats.userId, userId))
      .orderBy(desc(userDailyStats.date))
      .limit(30);

    recentDailyStats.forEach(d => {
      totalStudyTime += d.totalStudyTime || 0;
    });

    // 연속 학습일은 가장 최근 데이터의 streak 필드 사용
    if (dailyStatsData.length > 0) {
      streak = dailyStatsData[0].streak || 0;
    }

    const summaryData: SummaryStat = {
      totalStudyTime,
      totalSolved,
      correctRate,
      streak,
    };

    return NextResponse.json(summaryData, { status: 200 });
  } catch (error) {
    console.error('Error fetching summary stats:', error);
    return NextResponse.json({ error: 'Failed to fetch summary stats' }, { status: 500 });
  }
} 