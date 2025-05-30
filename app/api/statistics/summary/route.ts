import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userStats } from '@/db/schema/userStats';
import { userDailyStats } from '@/db/schema/userDailyStats';
import { eq, desc, sql, avg, sum, count } from 'drizzle-orm';

export interface SummaryStat {
  totalStudyTime: number;
  totalSolved: number;
  correctRate: number;
  streak: number;
  isGlobal?: boolean;
  totalUsers?: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  try {
    if (!userId) {
      // 전체 사용자 통계 제공
      // 1. 전체 사용자의 평균 정보 계산
      const globalStats = await db
        .select({
          avgCorrectRate: sql<number>`AVG(${userStats.totalCorrect}::float / NULLIF(${userStats.totalQuestions}, 0))`,
          avgSolved: sql<number>`AVG(${userStats.totalQuestions})`,
          totalUsers: count(userStats.userId),
        })
        .from(userStats);

      // 2. 전체 사용자의 총 학습 시간 (최근 30일)
      const studyTimeStats = await db
        .select({
          userId: userDailyStats.userId,
          sumStudyTime: sum(userDailyStats.totalStudyTime).mapWith(Number),
          avgStreak: avg(userDailyStats.streak).mapWith(Number),
        })
        .from(userDailyStats)
        .groupBy(userDailyStats.userId);

      // 3. 통계 데이터 집계
      const totalUsers = globalStats[0]?.totalUsers || 0;
      const avgCorrectRate = globalStats[0]?.avgCorrectRate || 0;
      const avgSolved = Math.round(globalStats[0]?.avgSolved || 0);
      
      let avgStudyTime = 0;
      let avgStreak = 0;
      
      if (studyTimeStats.length > 0) {
        const totalSumStudyTime = studyTimeStats.reduce((acc, curr) => acc + (curr.sumStudyTime || 0), 0);
        const totalAvgStreak = studyTimeStats.reduce((acc, curr) => acc + (curr.avgStreak || 0), 0);
        
        avgStudyTime = totalUsers > 0 ? Math.round(totalSumStudyTime / totalUsers) : 0;
        avgStreak = totalUsers > 0 ? Math.round(totalAvgStreak / totalUsers) : 0;
      }

      const globalSummaryData: SummaryStat = {
        totalStudyTime: avgStudyTime,
        totalSolved: avgSolved,
        correctRate: avgCorrectRate,
        streak: avgStreak,
        isGlobal: true,
        totalUsers: totalUsers,
      };

      return NextResponse.json(globalSummaryData, { status: 200 });
    }

    // 개별 사용자 통계 - 기존 코드 유지
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
      isGlobal: false,
    };

    return NextResponse.json(summaryData, { status: 200 });
  } catch (error) {
    console.error('Error fetching summary stats:', error);
    return NextResponse.json({ error: 'Failed to fetch summary stats' }, { status: 500 });
  }
} 