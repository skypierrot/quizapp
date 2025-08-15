import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userStats } from '@/db/schema/userStats';
import { userDailyStats } from '@/db/schema/userDailyStats';
import { globalStats } from '@/db/schema/globalStats';
import { eq, desc, sql, avg, sum, count } from 'drizzle-orm';
import { examResults } from '@/db/schema/examResults';

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
      // 전체 사용자 통계 제공 - 캐시된 전역 통계 사용
      const cachedGlobalStats = await db
        .select()
        .from(globalStats)
        .where(eq(globalStats.statType, 'summary'))
        .limit(1);

      if (cachedGlobalStats.length > 0) {
        const stats = cachedGlobalStats[0];
        if (stats) {
          const globalSummaryData: SummaryStat = {
            totalStudyTime: stats.avgStudyTime,
            totalSolved: stats.avgSolvedCount,
            correctRate: stats.avgCorrectRate,
            streak: stats.avgStreak,
            isGlobal: true,
            totalUsers: stats.totalUsers,
          };
        
          console.log(`[API] Using cached global stats: avgStreak=${stats.avgStreak}, totalUsers=${stats.totalUsers}`);
          return NextResponse.json(globalSummaryData, { status: 200 });
        }
      }

      // 캐시된 전역 통계가 없으면 기본값 반환
      console.warn('[API] No cached global stats found, returning default values');
      const defaultGlobalSummaryData: SummaryStat = {
        totalStudyTime: 0,
        totalSolved: 0,
        correctRate: 0,
        streak: 1, // 기본값
        isGlobal: true,
        totalUsers: 0,
      };

      return NextResponse.json(defaultGlobalSummaryData, { status: 200 });
    }

    // 개별 사용자 통계 - 기존 코드 유지 + Fallback 추가
    // 1. userStats에서 정보 가져오기
    const stats = await db
      .select({
        totalQuestions: userStats.totalQuestions,
        totalCorrect: userStats.totalCorrect,
      })
      .from(userStats)
      .where(eq(userStats.userId, userId));

    let totalSolved = 0;
    let totalCorrect = 0;
    let correctRate = 0;

    if (stats.length > 0 && stats[0]?.totalQuestions && (stats[0].totalQuestions > 0)) {
      totalSolved = stats[0].totalQuestions || 0;
      totalCorrect = stats[0].totalCorrect || 0;
      correctRate = totalSolved > 0 ? totalCorrect / totalSolved : 0;
    } else {
      // userStats가 없거나 값이 0이면 userDailyStats의 합산 사용
      const dailyStats = await db
        .select({
          solvedCount: userDailyStats.solvedCount,
          correctCount: userDailyStats.correctCount,
        })
        .from(userDailyStats)
        .where(eq(userDailyStats.userId, userId));

      totalSolved = dailyStats.reduce((sum, d) => sum + (d.solvedCount || 0), 0);
      totalCorrect = dailyStats.reduce((sum, d) => sum + (d.correctCount || 0), 0);
      correctRate = totalSolved > 0 ? totalCorrect / totalSolved : 0;
      
      // userDailyStats도 비어있다면 examResults에서 직접 계산
      if (totalSolved === 0) {
        console.log(`[API] userStats와 userDailyStats 모두 비어있음. examResults에서 직접 계산: ${userId}`);
        const examStats = await db
          .select({
            totalQuestions: examResults.totalQuestions,
            correctCount: examResults.correctCount,
          })
          .from(examResults)
          .where(eq(examResults.userId, userId));
        
        totalSolved = examStats.reduce((sum, e) => sum + (e.totalQuestions || 0), 0);
        totalCorrect = examStats.reduce((sum, e) => sum + (e.correctCount || 0), 0);
        correctRate = totalSolved > 0 ? totalCorrect / totalSolved : 0;
      }
    }

    // 최근 30일(또는 전체) 학습 기록을 날짜 내림차순으로 가져옴
    const streakStats = await db
      .select({
        date: userDailyStats.date,
        solvedCount: userDailyStats.solvedCount,
      })
      .from(userDailyStats)
      .where(eq(userDailyStats.userId, userId))
      .orderBy(desc(userDailyStats.date));

    // streak 계산
    let streak = 0;
    if (streakStats.length > 0) {
      const firstStat = streakStats[0];
      if (firstStat) {
        let prevDate = new Date(firstStat.date);
        streak = firstStat.solvedCount > 0 ? 1 : 0;
        for (let i = 1; i < streakStats.length; i++) {
          const currentStat = streakStats[i];
          if (currentStat) {
            const currDate = new Date(currentStat.date);
            const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays === 1 && currentStat.solvedCount > 0) {
              streak++;
              prevDate = currDate;
            } else {
              break;
            }
          }
        }
      }
    }

    // 최근 30일치 userDailyStats 데이터를 합산
    const recentDailyStats = await db
      .select({
        totalStudyTime: userDailyStats.totalStudyTime,
      })
      .from(userDailyStats)
      .where(eq(userDailyStats.userId, userId))
      .orderBy(desc(userDailyStats.date))
      .limit(30);

    const totalStudyTime = recentDailyStats.reduce((sum, d) => sum + (d.totalStudyTime || 0), 0);

    // 응답 데이터 구성
    const summaryData: SummaryStat = {
      totalStudyTime: totalStudyTime,
      totalSolved: totalSolved,
      correctRate: correctRate,
      streak: streak,
      isGlobal: false,
    };

    console.log(`[API] Summary for user ${userId}:`, summaryData);
    return NextResponse.json(summaryData, { status: 200 });
  } catch (error) {
    console.error('Error fetching summary stats:', error);
    return NextResponse.json({ error: 'Failed to fetch summary stats' }, { status: 500 });
  }
} 