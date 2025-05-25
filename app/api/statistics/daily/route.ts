import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userDailyStats } from '@/db/schema/userDailyStats';
import { examResults } from '@/db/schema/examResults';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import type { DailyStat } from '@/hooks/useDailyStats';

// 데이터베이스에서 가져온 통계 타입 정의
interface DbDailyStat {
  date: string | Date;
  solvedCount: number | null;
  totalStudyTime: number | null;
  correctCount: number | null;
}

interface DbExamStat {
  date: string | null;
  solvedCount: number | null;
  correctCount: number | null;
  totalQuestions: number | null; // 추가: 전체 문제 수
}

// 확장된 일별 통계 타입
interface ExtendedDailyStat extends DailyStat {
  totalQuestions?: number; // 전체 문제 수 추가
}

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
    // 현재 날짜를 기준으로 days일 전 날짜 계산
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - days);
    
    // 날짜를 YYYY-MM-DD 형식의 문자열로 변환
    const startDateStr = startDate.toISOString().split('T')[0];
    
    // userDailyStats에서 최근 N일 데이터 가져오기
    let dailyStats: DbDailyStat[] = [];
    try {
      dailyStats = await db
        .select({
          date: userDailyStats.date,
          solvedCount: userDailyStats.solvedCount,
          totalStudyTime: userDailyStats.totalStudyTime,
          correctCount: userDailyStats.correctCount,
        })
        .from(userDailyStats)
        .where(
          and(
            eq(userDailyStats.userId, userId),
            gte(userDailyStats.date, startDateStr) // 문자열로 변환된 날짜 사용
          )
        )
        .orderBy(desc(userDailyStats.date));
    } catch (error) {
      console.error('Error fetching from userDailyStats:', error);
      dailyStats = [];
    }

    // examResults에서 최근 N일 데이터 가져오기
    let examStats: DbExamStat[] = [];
    try {
      // 날짜를 ISO 문자열로 변환
      const startDateIso = startDate.toISOString();
      
      console.log('[Statistics API] Querying exam results with correctCount field');
      
      examStats = await db
        .select({
          // PostgreSQL에서는 cast(createdAt as date)를 사용
          date: sql<string>`cast(${examResults.createdAt} as date)`.as('date'),
          // 각 날짜별 응시한 시험 문제 수를 합산
          solvedCount: sql<number>`COUNT(*)`.as('solved_count'),
          // 시험 점수가 아닌 정답 수 합산
          correctCount: sql<number>`SUM(${examResults.correctCount})`.as('correct_count'),
          // 전체 문제 수 합산 추가
          totalQuestions: sql<number>`SUM(${examResults.totalQuestions})`.as('total_questions'),
        })
        .from(examResults)
        .where(
          and(
            eq(examResults.userId, userId),
            sql`${examResults.createdAt} >= ${startDateIso}` // Date 객체 대신 ISO 문자열 사용
          )
        )
        .groupBy(sql`cast(${examResults.createdAt} as date)`)
        .orderBy(desc(sql`cast(${examResults.createdAt} as date)`));
      
      // 디버깅을 위해 결과 로그 출력
      console.log(`[Statistics API] Found ${examStats.length} exam stats entries with correctCount`);
      examStats.forEach(stat => {
        const correctCount = stat.correctCount || 0;
        const totalQuestions = stat.totalQuestions || 1; // 0으로 나누기 방지
        const accuracyRate = (correctCount / totalQuestions * 100).toFixed(2);
        console.log(`[Statistics API] Exam date: ${stat.date}, solved: ${stat.solvedCount}, correct: ${correctCount}, total: ${totalQuestions}, 정답률: ${accuracyRate}%`);
      });
      
    } catch (error) {
      console.error('Error fetching from examResults:', error);
      examStats = [];
    }

    // 날짜별로 데이터를 합치기 위한 맵 생성
    const statsMap = new Map<string, ExtendedDailyStat>();
    
    // userDailyStats 데이터 먼저 맵에 추가
    dailyStats.forEach(stat => {
      const dateStr = String(stat.date);
      statsMap.set(dateStr, {
        date: dateStr,
        solvedCount: Number(stat.solvedCount || 0),
        totalStudyTime: Number(stat.totalStudyTime || 0),
        correctCount: Number(stat.correctCount || 0),
        totalQuestions: 0, // 초기화
      });
    });
    
    // examStats 데이터를 맵에 추가 또는 합산
    examStats.forEach(stat => {
      if (!stat.date) {
        return;
      }
      
      const dateStr = String(stat.date);
      const correctCount = Number(stat.correctCount || 0);
      const totalQuestions = Number(stat.totalQuestions || 0);
      
      if (statsMap.has(dateStr)) {
        // 기존 데이터가 있으면 합산
        const existingStat = statsMap.get(dateStr)!;
        statsMap.set(dateStr, {
          ...existingStat,
          solvedCount: existingStat.solvedCount + Number(stat.solvedCount || 0),
          correctCount: existingStat.correctCount + correctCount,
          totalQuestions: (existingStat.totalQuestions || 0) + totalQuestions,
        });
      } else {
        // 기존 데이터가 없으면 새로 추가
        statsMap.set(dateStr, {
          date: dateStr,
          solvedCount: Number(stat.solvedCount || 0),
          totalStudyTime: 0, // 시험 시간은 별도로 기록되지 않음
          correctCount: correctCount,
          totalQuestions: totalQuestions,
        });
      }
    });
    
    // 맵에서 배열로 변환하고 날짜 기준 오름차순으로 정렬
    const formattedResults: ExtendedDailyStat[] = Array.from(statsMap.values())
      .sort((a, b) => a.date.localeCompare(b.date));

    // 최종 결과 확인
    console.log(`[Statistics API] Final results count: ${formattedResults.length}`);
    
    // 5월 23일 데이터 확인
    const may23Data = formattedResults.find(result => result.date.includes('2025-05-23'));
    if (may23Data) {
      console.log(`[Statistics API] May 23 final data:`, JSON.stringify(may23Data));
      // 정답률 계산 (맞은 문제 수 / 전체 문제 수)
      const accuracy = may23Data.totalQuestions ? 
        (may23Data.correctCount / may23Data.totalQuestions * 100).toFixed(2) :
        '계산 불가';
      console.log(`[Statistics API] May 23 정답률(맞은 문제/전체 문제): ${accuracy}%`);
    }

    return NextResponse.json(formattedResults, { status: 200 });
  } catch (error) {
    console.error('Error fetching daily stats:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json({ 
      error: 'Failed to fetch daily stats',
      details: errorMessage
    }, { status: 500 });
  }
} 