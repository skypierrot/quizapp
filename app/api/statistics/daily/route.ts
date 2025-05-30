import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userDailyStats } from '@/db/schema/userDailyStats';
import { examResults } from '@/db/schema/examResults';
import { eq, desc, and, gte, lte, sql, avg } from 'drizzle-orm';
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
  isGlobal?: boolean; // 전체 사용자 통계 여부
  userCount?: number; // 해당 날짜의 사용자 수
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const daysParam = searchParams.get('days');
  const days = daysParam ? parseInt(daysParam, 10) : 30;

  try {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    if (!userId) {
      // 전체 사용자 일별 통계 계산
      // userDailyStats에서 날짜별 평균 통계 가져오기
      const globalDailyStats = await db
        .select({
          date: userDailyStats.date,
          avgSolvedCount: sql<number>`AVG(${userDailyStats.solvedCount})`,
          avgStudyTime: sql<number>`AVG(${userDailyStats.totalStudyTime})`,
          avgCorrectCount: sql<number>`AVG(${userDailyStats.correctCount})`,
          userCount: sql<number>`COUNT(DISTINCT ${userDailyStats.userId})`,
        })
        .from(userDailyStats)
        .where(gte(userDailyStats.date, startDateStr))
        .groupBy(userDailyStats.date)
        .orderBy(desc(userDailyStats.date));

      // examResults에서 날짜별 평균 통계 가져오기
      const startDateIso = startDate.toISOString();
      const globalExamStats = await db
        .select({
          date: sql<string>`cast(${examResults.createdAt} as date)`.as('date'),
          avgSolvedCount: sql<number>`AVG(1)`.as('avg_solved_count'), // 응시한 시험 수의 평균
          avgCorrectCount: sql<number>`AVG(${examResults.correctCount})`.as('avg_correct_count'),
          avgTotalQuestions: sql<number>`AVG(${examResults.totalQuestions})`.as('avg_total_questions'),
          userCount: sql<number>`COUNT(DISTINCT ${examResults.userId})`.as('user_count'),
        })
        .from(examResults)
        .where(sql`${examResults.createdAt} >= ${startDateIso}`)
        .groupBy(sql`cast(${examResults.createdAt} as date)`)
        .orderBy(desc(sql`cast(${examResults.createdAt} as date)`));

      // 결과 합치기
      const statsMap = new Map<string, ExtendedDailyStat>();
      
      // userDailyStats 데이터 추가
      globalDailyStats.forEach(stat => {
        const dateStr = String(stat.date);
        statsMap.set(dateStr, {
          date: dateStr,
          solvedCount: Math.round(Number(stat.avgSolvedCount || 0)),
          totalStudyTime: Math.round(Number(stat.avgStudyTime || 0)),
          correctCount: Math.round(Number(stat.avgCorrectCount || 0)),
          totalQuestions: 0,
          isGlobal: true,
          userCount: Number(stat.userCount || 0),
        });
      });
      
      // examResults 데이터 추가 또는 합산
      globalExamStats.forEach(stat => {
        if (!stat.date) return;
        
        const dateStr = String(stat.date);
        const avgCorrectCount = Math.round(Number(stat.avgCorrectCount || 0));
        const avgTotalQuestions = Math.round(Number(stat.avgTotalQuestions || 0));
        
        if (statsMap.has(dateStr)) {
          const existingStat = statsMap.get(dateStr)!;
          statsMap.set(dateStr, {
            ...existingStat,
            solvedCount: existingStat.solvedCount + Math.round(Number(stat.avgSolvedCount || 0)),
            correctCount: existingStat.correctCount + avgCorrectCount,
            totalQuestions: (existingStat.totalQuestions || 0) + avgTotalQuestions,
            userCount: Math.max(existingStat.userCount || 0, Number(stat.userCount || 0)),
          });
        } else {
          statsMap.set(dateStr, {
            date: dateStr,
            solvedCount: Math.round(Number(stat.avgSolvedCount || 0)),
            totalStudyTime: 0,
            correctCount: avgCorrectCount,
            totalQuestions: avgTotalQuestions,
            isGlobal: true,
            userCount: Number(stat.userCount || 0),
          });
        }
      });
      
      // 결과를 배열로 변환하고 날짜순으로 정렬
      const formattedResults: ExtendedDailyStat[] = Array.from(statsMap.values())
        .sort((a, b) => a.date.localeCompare(b.date));
      
      return NextResponse.json(formattedResults, { status: 200 });
    }

    // --- 개별 사용자 통계 로직 수정 시작 ---
    const statsMap = new Map<string, ExtendedDailyStat>();
    
    // 1. userDailyStats에서 최근 N일 데이터 가져오기
    const dailyStatsFromDb: DbDailyStat[] = await db
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
          gte(userDailyStats.date, startDateStr)
        )
      )
      .orderBy(desc(userDailyStats.date));

    console.log(`[API DEBUG] Fetched dailyStatsFromDb for userId: ${userId}`, JSON.stringify(dailyStatsFromDb));

    dailyStatsFromDb.forEach(stat => {
      const dateStr = String(stat.date);
      statsMap.set(dateStr, {
        date: dateStr,
        solvedCount: Number(stat.solvedCount || 0),
        totalStudyTime: Number(stat.totalStudyTime || 0),
        correctCount: Number(stat.correctCount || 0),
        // totalQuestions는 userDailyStats의 solvedCount를 사용 (rebuild 스크립트가 이미 계산함)
        totalQuestions: Number(stat.solvedCount || 0), 
      });
      console.log(`[API DEBUG] Populated statsMap for date ${dateStr} from dailyStatsFromDb:`, JSON.stringify(statsMap.get(dateStr)));
    });
    
    // 2. examResults를 추가로 조회하여 합산하는 로직 제거 또는 수정
    // rebuild-statistics.ts가 userDailyStats를 정확히 계산하므로,
    // 여기서는 examResults를 다시 집계하여 더할 필요가 없습니다.
    // 만약 userDailyStats에 없는 날짜에 대해 examResults를 보여주고 싶다면,
    // 아래 로직은 statsMap에 해당 날짜가 없을 때만 실행되도록 변경해야 합니다.
    // 지금은 가장 간단하게 userDailyStats만 사용하는 것으로 수정합니다.

    /*  <-- 기존 examResults 조회 및 병합 로직 주석 처리 또는 삭제 시작 -->
    let examStats: DbExamStat[] = [];
    try {
      const startDateIso = startDate.toISOString();
      examStats = await db
      .select({
          date: sql<string>`cast(${examResults.createdAt} as date)`.as('date'),
          solvedCount: sql<number>`COUNT(*)`.as('solved_count'),
          correctCount: sql<number>`SUM(${examResults.correctCount})`.as('correct_count'),
          totalQuestions: sql<number>`SUM(${examResults.totalQuestions})`.as('total_questions'),
        })
        .from(examResults)
        .where(
          and(
            eq(examResults.userId, userId),
            sql`${examResults.createdAt} >= ${startDateIso}`
          )
        )
        .groupBy(sql`cast(${examResults.createdAt} as date)`)
        .orderBy(desc(sql`cast(${examResults.createdAt} as date)`));
      console.log(`[API DEBUG] Fetched examStats for userId: ${userId}`, JSON.stringify(examStats));
    } catch (error) {
      console.error('Error fetching from examResults (now optional):', error);
      examStats = [];
    }

    examStats.forEach(stat => {
      if (!stat.date) return;
      const dateStr = String(stat.date); 
      const examCorrectCount = Number(stat.correctCount || 0); 
      const examTotalQuestionsFromDb = Number(stat.totalQuestions || 0);

      // userDailyStats에 이미 해당 날짜 데이터가 있다면, examResults 값을 더하지 않음
      // 만약 userDailyStats에 해당 날짜 데이터가 *없을 때만* examResults 데이터를 사용하고 싶다면,
      // if (!statsMap.has(dateStr)) { ... } 와 같이 조건을 추가할 수 있음.
      // 현재는 userDailyStats의 값을 최종으로 간주하므로 이 부분은 실행되지 않도록 함.

      // 아래는 기존의 중복 합산 로직이 있던 부분입니다.
      // if (statsMap.has(dateStr)) {
      //   const existingStat = statsMap.get(dateStr)!;
      //   statsMap.set(dateStr, {
      //     ...existingStat,
      //     solvedCount: existingStat.solvedCount + examTotalQuestionsFromDb, // 중복 합산
      //     correctCount: existingStat.correctCount + examCorrectCount,     // 중복 합산
      //     totalQuestions: (existingStat.totalQuestions || 0) + examTotalQuestionsFromDb, // 중복 합산
      //   });
      // } else {
      //   statsMap.set(dateStr, {
      //     date: dateStr,
      //     solvedCount: examTotalQuestionsFromDb,
      //     totalStudyTime: 0, 
      //     correctCount: examCorrectCount, 
      //     totalQuestions: examTotalQuestionsFromDb, 
      //   });
      // }
    });
     <-- 기존 examResults 조회 및 병합 로직 주석 처리 또는 삭제 끝 -->
    */
    
    const formattedResults: ExtendedDailyStat[] = Array.from(statsMap.values())
      .sort((a, b) => a.date.localeCompare(b.date));

    console.log(`[API DEBUG] Final formattedResults for userId ${userId}:`, JSON.stringify(formattedResults));
    
    return NextResponse.json(formattedResults, { status: 200 });
    // --- 개별 사용자 통계 로직 수정 끝 ---

  } catch (error) {
    console.error('Error fetching daily stats:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json({ 
      error: 'Failed to fetch daily stats',
      details: errorMessage
    }, { status: 500 });
  }
} 