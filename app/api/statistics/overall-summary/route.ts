import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema/auth'; // userId 타입 확인용
import { userStats } from '@/db/schema/userStats';
import { userDailyStats } from '@/db/schema/userDailyStats';
import { eq, desc, sum, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

// 응답 타입 정의 (프론트엔드에서 사용할 타입에 맞춰 정의)
export interface OverallStatsData {
  totalStudyTime: number; // 초 단위
  totalSolvedProblems: number;
  averageCorrectRate: number; // 0.0 ~ 1.0 (또는 0 ~ 100)
  consecutiveStudyDays: number;
  dailyStudyTrend: { date: string; solvedCount: number }[]; // 최근 30일
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  try {
    // 1. userStats에서 정보 가져오기 (totalQuestions, totalCorrect)
    // userStats.userId가 text 타입으로 변경되었으므로 타입 일치
    const stats = await db
      .select({
        totalQuestions: userStats.totalQuestions,
        totalCorrect: userStats.totalCorrect,
      })
      .from(userStats)
      .where(eq(userStats.userId, userId)); // 이제 userId 타입 일치

    const totalSolvedProblems = stats.length > 0 ? stats[0]?.totalQuestions || 0 : 0;
    const totalCorrectProblems = stats.length > 0 ? stats[0]?.totalCorrect || 0 : 0;
    const averageCorrectRate = totalSolvedProblems > 0 ? (totalCorrectProblems / totalSolvedProblems) * 100 : 0;

    // 2. userDailyStats에서 정보 가져오기 (totalStudyTime, consecutiveStudyDays, dailyStudyTrend)
    // userDailyStats.userId는 text 타입
    const dailyStatsData = await db
      .select({
        date: userDailyStats.date,
        totalStudyTime: userDailyStats.totalStudyTime,
        solvedCount: userDailyStats.solvedCount,
        streak: userDailyStats.streak,
      })
      .from(userDailyStats)
      .where(eq(userDailyStats.userId, userId))
      .orderBy(desc(userDailyStats.date)); // 최신 날짜부터 정렬

    let totalStudyTime = 0;
    dailyStatsData.forEach(d => {
      totalStudyTime += d.totalStudyTime || 0;
    });

    const consecutiveStudyDays = dailyStatsData.length > 0 ? dailyStatsData[0]?.streak || 0 : 0;

    const dailyStudyTrend = dailyStatsData
      .slice(0, 30) // 최근 30일 데이터
      .map(d => ({
        date: String(d.date), // date는 string YYYY-MM-DD 예상
        solvedCount: d.solvedCount || 0,
      }))
      .reverse(); // 날짜 오름차순으로 변경 (그래프 표시용)
      
    const overallData: OverallStatsData = {
      totalStudyTime,
      totalSolvedProblems,
      averageCorrectRate,
      consecutiveStudyDays,
      dailyStudyTrend,
    };

    return NextResponse.json(overallData, { status: 200 });

  } catch (error) {
    console.error('Error fetching overall stats:', error);
    // userId 타입 불일치 관련 에러 처리는 이제 필요 없음
    // if (error instanceof Error && error.message.includes('invalid input syntax for type uuid')) {
    //     return NextResponse.json({ error: 'Invalid userId format for userStats lookup.' }, { status: 400 });
    // }
    return NextResponse.json({ error: 'Failed to fetch overall stats' }, { status: 500 });
  }
} 