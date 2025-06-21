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
      // 비로그인 상태의 전체 사용자 통계 조회
      console.log('전체 사용자 통계 조회: 로그인 사용자와 일관된 방식으로 계산');
      
      // 1. userDailyStats에서 사용자별 데이터 조회
      const userDailyData = await db
        .select({
          date: userDailyStats.date,
          userId: userDailyStats.userId,
          solvedCount: userDailyStats.solvedCount,
          correctCount: userDailyStats.correctCount,
          totalStudyTime: userDailyStats.totalStudyTime,
        })
        .from(userDailyStats)
        .where(
          and(
            gte(userDailyStats.date, startDateStr),
            // ALL_USERS_STATS와 같은 특수 사용자 ID 제외
            sql`${userDailyStats.userId} NOT LIKE 'ALL_USERS%'`
          )
        );
      
      // 2. 날짜별로 통계 집계
      const dailyStatsMap = new Map<string, {
        date: string,
        userIds: Set<string>,
        totalSolvedCount: number,
        totalCorrectCount: number,
        totalStudyTime: number,
      }>();
      
      // userDailyStats에서 날짜별 데이터 집계
      userDailyData.forEach(stat => {
        const dateStr = String(stat.date);
        if (!dailyStatsMap.has(dateStr)) {
          dailyStatsMap.set(dateStr, {
            date: dateStr,
            userIds: new Set(),
            totalSolvedCount: 0,
            totalCorrectCount: 0,
            totalStudyTime: 0,
          });
        }
        
        const entry = dailyStatsMap.get(dateStr)!;
        if (stat.userId) entry.userIds.add(stat.userId);
        entry.totalSolvedCount += stat.solvedCount || 0;
        entry.totalCorrectCount += stat.correctCount || 0;
        entry.totalStudyTime += stat.totalStudyTime || 0;
      });
      
      // 3. 평균 계산 및 결과 포맷팅
      const formattedResults: ExtendedDailyStat[] = Array.from(dailyStatsMap.values())
        .map(stat => {
          const userCount = stat.userIds.size;
          // 사용자 수로 나누어 평균 계산 (사용자가 없으면 0)
          const avgSolvedCount = userCount > 0 ? Math.round(stat.totalSolvedCount / userCount) : 0;
          const avgCorrectCount = userCount > 0 ? Math.round(stat.totalCorrectCount / userCount) : 0;
          const avgStudyTime = userCount > 0 ? Math.round(stat.totalStudyTime / userCount) : 0;
          
          return {
            date: stat.date,
            solvedCount: avgSolvedCount,
            correctCount: avgCorrectCount,
            totalStudyTime: avgStudyTime,
            // solvedCount를 totalQuestions로 사용 (개인 통계와 일관성 유지)
            totalQuestions: avgSolvedCount,
            isGlobal: true,
            userCount: userCount,
          };
        })
        .sort((a, b) => a.date.localeCompare(b.date));
      
      return NextResponse.json(formattedResults, { status: 200 });
    }

    // --- 개별 사용자 통계 로직 유지 ---
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