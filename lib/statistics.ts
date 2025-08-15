import { db } from '@/db';
import { statisticsSummary } from '@/db/schema/statisticsSummary';
import { userStats } from '@/db/schema/userStats';
import { userDailyStats } from '@/db/schema/userDailyStats';
import { examResults } from '@/db/schema/examResults';
import { eq, and, gte, desc, sql, sum, count, type InferSelectModel } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

/**
 * 시험 결과를 기반으로 통계 데이터를 업데이트하는 함수
 * 
 * 이 함수는 시험 결과가 저장될 때마다 호출됩니다.
 * 해당 날짜의 통계 데이터가 있으면 업데이트하고, 없으면 새로 생성합니다.
 */
export async function updateStatisticsForExam(userId: string, examResult: {
  id: string;
  correctCount: number;
  totalQuestions: number;
  subjectStats: Record<string, { correct: number; total: number }>;
  createdAt: string | Date;
}) {
  try {
    // 날짜 추출 (YYYY-MM-DD 형식)
    const date = new Date(examResult.createdAt);
    const dateStr = date.toISOString().split('T')[0];

    console.log(`[Statistics] Updating stats for user ${userId} on ${dateStr}`);
    console.log(`[Statistics] Exam result: ${examResult.correctCount}/${examResult.totalQuestions}`);

    // 1. 기존 통계 데이터 조회
    const existingStats = await db
      .select()
      .from(statisticsSummary)
      .where(
        and(
          eq(statisticsSummary.userId, userId),
          eq(statisticsSummary.date, dateStr || '')
        )
      );

    // 과목별 통계 처리
    let subjectStatsObj: Record<string, { total: number; correct: number }> = {};
    if (existingStats.length > 0 && existingStats[0]?.subjectStats) {
      try {
        subjectStatsObj = JSON.parse(existingStats[0].subjectStats);
      } catch (e) {
        console.error('[Statistics] Error parsing existing subject stats:', e);
        subjectStatsObj = {};
      }
    }

    // 새 과목별 통계 병합
    Object.entries(examResult.subjectStats || {}).forEach(([subject, stats]) => {
      if (!subjectStatsObj[subject]) {
        subjectStatsObj[subject] = { total: 0, correct: 0 };
      }
      subjectStatsObj[subject].total += stats.total;
      subjectStatsObj[subject].correct += stats.correct;
    });

    if (existingStats.length > 0 && existingStats[0]) {
      const existingStat = existingStats[0];
      // 2. 기존 데이터가 있으면 업데이트
      await db
        .update(statisticsSummary)
        .set({
          examCount: (existingStat.examCount || 0) + 1,
          totalQuestions: (existingStat.totalQuestions || 0) + examResult.totalQuestions,
          correctQuestions: (existingStat.correctQuestions || 0) + examResult.correctCount,
          subjectStats: JSON.stringify(subjectStatsObj),
          lastUpdated: new Date(),
        })
        .where(eq(statisticsSummary.id, existingStat.id));

      console.log(`[Statistics] Updated existing stats for ${dateStr}`);
    } else {
      // 3. 기존 데이터가 없으면 새로 생성
      // 연속 학습일(streak) 계산
      const streak = await calculateStreak(userId, dateStr || '');

      await db.insert(statisticsSummary).values({
        userId,
        date: dateStr || '',
        examCount: 1,
        totalQuestions: examResult.totalQuestions,
        correctQuestions: examResult.correctCount,
        subjectStats: JSON.stringify(subjectStatsObj),
        streak,
        lastUpdated: new Date(),
      });

      console.log(`[Statistics] Created new stats for ${dateStr} with streak ${streak}`);
    }

    // 4. userStats 테이블도 업데이트 (전체 통계)
    await updateUserStats(userId, {
      examCount: 1,
      totalQuestions: examResult.totalQuestions,
      correctCount: examResult.correctCount,
      subjectStats: examResult.subjectStats,
    });

    return true;
  } catch (error) {
    console.error('[Statistics] Error updating statistics:', error);
    return false;
  }
}

/**
 * 학습 시간을 기반으로 통계 데이터를 업데이트하는 함수
 * 
 * 이 함수는 학습 시간이 기록될 때마다 호출됩니다.
 */
export async function updateStatisticsForStudyTime(
  userId: string,
  dateStr: string,
  studyTimeSeconds: number
) {
  try {
    console.log(`[Statistics] Updating study time for user ${userId} on ${dateStr}: ${studyTimeSeconds}s`);

    // 1. 기존 통계 데이터 조회
    const existingStats = await db
      .select()
      .from(statisticsSummary)
      .where(
        and(
          eq(statisticsSummary.userId, userId),
          eq(statisticsSummary.date, dateStr || '')
        )
      );

    if (existingStats.length > 0 && existingStats[0]) {
      const existingStat = existingStats[0];
      // 2. 기존 데이터가 있으면 업데이트
      await db
        .update(statisticsSummary)
        .set({
          studyTimeSeconds: (existingStat.studyTimeSeconds || 0) + studyTimeSeconds,
          lastUpdated: new Date(),
        })
        .where(eq(statisticsSummary.id, existingStat.id));

      console.log(`[Statistics] Updated study time for ${dateStr}`);
    } else {
      // 3. 기존 데이터가 없으면 새로 생성
      // 연속 학습일(streak) 계산
      const streak = await calculateStreak(userId, dateStr || '');

      await db.insert(statisticsSummary).values({
        userId,
        date: dateStr || '',
        studyTimeSeconds,
        streak,
        lastUpdated: new Date(),
      });

      console.log(`[Statistics] Created new stats for ${dateStr} with study time and streak ${streak}`);
    }

    return true;
  } catch (error) {
    console.error('[Statistics] Error updating study time statistics:', error);
    return false;
  }
}

/**
 * 사용자의 연속 학습일(streak)을 계산하는 함수
 */
async function calculateStreak(userId: string, currentDateStr: string): Promise<number> {
  try {
    // 현재 날짜
    const currentDate = new Date(currentDateStr);
    
    // 이전 통계 데이터 조회 (날짜 역순으로 최대 30일)
    const previousStats = await db
      .select({
        date: statisticsSummary.date,
      })
      .from(statisticsSummary)
      .where(
        and(
          eq(statisticsSummary.userId, userId),
          sql`${statisticsSummary.date} < ${currentDateStr}`,
        )
      )
      .orderBy(desc(statisticsSummary.date))
      .limit(30);
    
    if (previousStats.length === 0) {
      // 이전 데이터가 없으면 첫 학습일이므로 streak = 1
      return 1;
    }
    
    // 가장 최근 학습일
    const lastStudyDate = new Date(previousStats[0]?.date || '');
    
    // 어제 날짜
    const yesterday = new Date(currentDate);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (
      lastStudyDate.getFullYear() === yesterday.getFullYear() &&
      lastStudyDate.getMonth() === yesterday.getMonth() &&
      lastStudyDate.getDate() === yesterday.getDate()
    ) {
      // 어제 학습했다면, 연속 학습일 + 1
      // 가장 최근 데이터의 streak 값 조회
      const lastStats = await db
        .select({
          streak: statisticsSummary.streak,
        })
        .from(statisticsSummary)
        .where(
          and(
            eq(statisticsSummary.userId, userId),
            eq(statisticsSummary.date, lastStudyDate.toISOString().split('T')[0] || '')
          )
        )
        .limit(1);
      
      return lastStats.length > 0 ? (lastStats[0]?.streak || 0) + 1 : 1;
    } else if (
      lastStudyDate.getFullYear() === currentDate.getFullYear() &&
      lastStudyDate.getMonth() === currentDate.getMonth() &&
      lastStudyDate.getDate() === currentDate.getDate()
    ) {
      // 오늘 이미 학습했다면, 기존 streak 값 유지
      const lastStats = await db
        .select({
          streak: statisticsSummary.streak,
        })
        .from(statisticsSummary)
        .where(
          and(
            eq(statisticsSummary.userId, userId),
            eq(statisticsSummary.date, currentDateStr || '')
          )
        )
        .limit(1);
      
      return lastStats.length > 0 ? lastStats[0]?.streak || 1 : 1;
    } else {
      // 연속되지 않았다면 streak = 1로 리셋
      return 1;
    }
  } catch (error) {
    console.error('[Statistics] Error calculating streak:', error);
    return 1;
  }
}

/**
 * 사용자의 종합 통계를 업데이트하는 함수
 */
async function updateUserStats(
  userId: string,
  data: {
    examCount: number;
    totalQuestions: number;
    correctCount: number;
    subjectStats: Record<string, { correct: number; total: number }>;
  }
) {
  try {
    // 기존 userStats 조회
    const existingStats = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, userId));

    // 과목별 통계 처리
    let subjectStatsObj: Record<string, { total: number; correct: number; averageScore: number }> = {};
    if (existingStats.length > 0 && existingStats[0]?.subjectStats) {
      try {
        // 기존 형식이 Record<string, { total: number; correct: number; averageScore: number }>임
        subjectStatsObj = existingStats[0].subjectStats;
      } catch (e) {
        console.error('[Statistics] Error processing existing subject stats:', e);
        subjectStatsObj = {};
      }
    }

    // 새 과목별 통계 병합
    Object.entries(data.subjectStats || {}).forEach(([subject, stats]) => {
      if (!subjectStatsObj[subject]) {
        subjectStatsObj[subject] = { total: 0, correct: 0, averageScore: 0 };
      }
      
      const existingTotal = subjectStatsObj[subject].total || 0;
      const existingCorrect = subjectStatsObj[subject].correct || 0;
      
      subjectStatsObj[subject].total = existingTotal + stats.total;
      subjectStatsObj[subject].correct = existingCorrect + stats.correct;
      
      // 평균 점수 업데이트 (백분율)
      if (subjectStatsObj[subject].total > 0) {
        subjectStatsObj[subject].averageScore = Math.round(
          (subjectStatsObj[subject].correct / subjectStatsObj[subject].total) * 100
        );
      }
    });

    if (existingStats.length > 0) {
      // 기존 데이터가 있으면 업데이트
      const totalExams = (existingStats[0]?.totalExams || 0) + data.examCount;
      const totalQuestions = (existingStats[0]?.totalQuestions || 0) + data.totalQuestions;
      const totalCorrect = (existingStats[0]?.totalCorrect || 0) + data.correctCount;
      
      // 평균 점수 계산 (백분율)
      const averageScore = totalQuestions > 0
        ? Math.round((totalCorrect / totalQuestions) * 100)
        : 0;

      await db
        .update(userStats)
        .set({
          totalExams,
          totalQuestions,
          totalCorrect,
          averageScore,
          subjectStats: subjectStatsObj,
          lastExamAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userStats.id, existingStats[0]?.id || ''));

      console.log(`[Statistics] Updated user stats for ${userId}`);
    } else {
      // 기존 데이터가 없으면 새로 생성
      await db.insert(userStats).values({
        userId,
        totalExams: data.examCount,
        totalQuestions: data.totalQuestions,
        totalCorrect: data.correctCount,
        averageScore: data.totalQuestions > 0
          ? Math.round((data.correctCount / data.totalQuestions) * 100)
          : 0,
        subjectStats: subjectStatsObj,
        lastExamAt: new Date(),
      });

      console.log(`[Statistics] Created new user stats for ${userId}`);
    }

    return true;
  } catch (error) {
    console.error('[Statistics] Error updating user stats:', error);
    return false;
  }
}

/**
 * 특정 날짜 범위의 통계 데이터를 조회하는 함수
 */
export async function getStatisticsForDateRange(
  userId: string,
  startDate: string,
  endDate: string
) {
  try {
    const stats = await db
      .select()
      .from(statisticsSummary)
      .where(
        and(
          eq(statisticsSummary.userId, userId),
          gte(statisticsSummary.date, startDate),
          sql`${statisticsSummary.date} <= ${endDate}`
        )
      )
      .orderBy(statisticsSummary.date);

    return stats;
  } catch (error) {
    console.error('[Statistics] Error fetching statistics for date range:', error);
    return [];
  }
}

/**
 * 특정 사용자의 통계 데이터를 시험 결과를 기반으로 처음부터 재구축하는 함수
 * (statisticsSummary 테이블에 일별/시험별 통계 데이터 생성)
 */
export async function rebuildStatistics(userId: string) {
  try {
    console.log(`[Statistics] Starting rebuild for user ${userId}`);

    // 1. 기존 statisticsSummary 및 userDailyStats 데이터 삭제
    await db.delete(statisticsSummary).where(eq(statisticsSummary.userId, userId));
    console.log(`[Statistics] Deleted existing statisticsSummary for user ${userId}`);
    await db.delete(userDailyStats).where(eq(userDailyStats.userId, userId)); // userDailyStats 삭제 추가
    console.log(`[Statistics] Deleted existing userDailyStats for user ${userId}`);

    // 2. examResults 테이블에서 해당 사용자의 모든 시험 결과 조회 (statisticsSummary용)
    const dailyExamSummaryStats = await db
      .select({
        date: sql<string>`cast(${examResults.createdAt} as date)`.as('date'),
        examName: examResults.examName,
        examCount: sql<number>`COUNT(${examResults.id})`.as('exam_count'),
        totalQuestions: sql<number>`SUM(${examResults.totalQuestions})`.as('total_questions'),
        correctQuestions: sql<number>`SUM(${examResults.correctCount})`.as('correct_questions'),
      })
      .from(examResults)
      .where(eq(examResults.userId, userId))
      .groupBy(sql`cast(${examResults.createdAt} as date)`, examResults.examName)
      .orderBy(sql`cast(${examResults.createdAt} as date)`, examResults.examName);

    console.log(`[Statistics] Found ${dailyExamSummaryStats.length} daily/exam stats entries for statisticsSummary for user ${userId}`);

    // 3. 집계된 데이터를 statisticsSummary 테이블에 삽입
    if (dailyExamSummaryStats.length > 0) {
      const studyTimeRecordsForSummary = await db
        .select({
          date: sql<string>`cast(${examResults.createdAt} as date)`.as('date'),
          totalStudyTime: sql<number>`SUM(${examResults.elapsedTime})`.as('total_study_time'),
        })
        .from(examResults)
        .where(eq(examResults.userId, userId))
        .groupBy(sql`cast(${examResults.createdAt} as date)`)
        .orderBy(sql`cast(${examResults.createdAt} as date)`);

      const studyTimeMapForSummary = studyTimeRecordsForSummary.reduce((map, record) => {
        map[record.date] = Number(record.totalStudyTime || 0);
        return map;
      }, {} as Record<string, number>);

      const summaryValuesToInsert = dailyExamSummaryStats.map(stat => ({
        userId: userId,
        date: stat.date,
        examId: stat.examName, 
        examName: stat.examName,
        examCount: Number(stat.examCount || 0),
        totalQuestions: Number(stat.totalQuestions || 0),
        correctQuestions: Number(stat.correctQuestions || 0),
        studyTimeSeconds: studyTimeMapForSummary[stat.date] || 0,
        subjectStats: '{}', 
        streak: 0, 
        lastUpdated: new Date(),
        isProcessed: true,
      }));
      await db.insert(statisticsSummary).values(summaryValuesToInsert);
      console.log(`[Statistics] Inserted ${summaryValuesToInsert.length} entries into statisticsSummary for user ${userId}`);
    }

    // 4. userDailyStats 재구축 (examResults 기반)
    console.log(`[Statistics] Rebuilding userDailyStats for user ${userId} from examResults...`);
    const dailyStatsForUserDaily = await db
      .select({
        date: sql<string>`cast(${examResults.createdAt} as date)`.as('date'),
        solvedCount: sql<number>`SUM(${examResults.totalQuestions})`.as('solved_count'),
        correctCount: sql<number>`SUM(${examResults.correctCount})`.as('correct_count'),
        totalStudyTime: sql<number>`SUM(${examResults.elapsedTime})`.as('total_study_time'), // elapsedTime을 studyTime으로 사용
      })
      .from(examResults)
      .where(eq(examResults.userId, userId))
      .groupBy(sql`cast(${examResults.createdAt} as date)`)
      .orderBy(sql`cast(${examResults.createdAt} as date)`);

    if (dailyStatsForUserDaily.length > 0) {
      const userDailyValuesToInsert = dailyStatsForUserDaily.map(stat => ({
        id: uuidv4(), // userDailyStats는 id가 필요
        userId: userId,
        date: stat.date,
        solvedCount: Number(stat.solvedCount || 0),
        correctCount: Number(stat.correctCount || 0),
        totalStudyTime: Number(stat.totalStudyTime || 0),
        streak: 0, // Streak 계산은 별도 로직 또는 필요시 여기서 구현 (일단 0)
        // userDailyStats 스키마에 맞게 필드 확인 필요 (예: createdAt, updatedAt)
        createdAt: new Date(), // 임시 값, 실제로는 stat.date 기준으로 설정 가능
        updatedAt: new Date(),
      }));
      await db.insert(userDailyStats).values(userDailyValuesToInsert);
      console.log(`[Statistics] Inserted ${userDailyValuesToInsert.length} entries into userDailyStats for user ${userId}`);
    } else {
      console.log(`[Statistics] No data from examResults to rebuild userDailyStats for user ${userId}`);
    }

    // 5. userStats (종합 통계) 재구축
    console.log(`[Statistics] Rebuilding userStats for user ${userId}`);
    await rebuildUserStats(userId); // rebuildUserStats 함수는 이미 examResults를 기반으로 잘 작동함

    console.log(`[Statistics] Finished ALL statistics rebuild for user ${userId}`);
    return true;

  } catch (error) {
    console.error(`[Statistics] Error rebuilding ALL statistics for user ${userId}:`, error);
    return false;
  }
}

/**
 * 사용자 종합 통계를 재계산하는 함수
 */
async function rebuildUserStats(userId: string) {
  try {
    // 1. 모든 시험 결과의 합계 계산
    const totals = await db
      .select({
        totalExams: count(),
        totalQuestions: sum(examResults.totalQuestions),
        totalCorrect: sum(examResults.correctCount),
      })
      .from(examResults)
      .where(eq(examResults.userId, userId));

    // 2. 과목별 통계 계산
    const examsBySubject = await db
      .select({
        subject: examResults.examSubject,
        subjectStats: examResults.subjectStats,
      })
      .from(examResults)
      .where(eq(examResults.userId, userId));

    // 과목별 통계 집계
    const subjectStats: Record<string, { total: number; correct: number; averageScore: number }> = {};

    examsBySubject.forEach(exam => {
      const subject = exam.subject;
      const stats = exam.subjectStats as Record<string, { correct: number; total: number }>;

      Object.entries(stats || {}).forEach(([subjectName, data]) => {
        const name = subjectName || subject; // 과목명이 없으면 시험 과목명 사용

        if (!subjectStats[name]) {
          subjectStats[name] = { total: 0, correct: 0, averageScore: 0 };
        }

        subjectStats[name].total += data.total;
        subjectStats[name].correct += data.correct;
      });
    });

    // 평균 점수 계산
    Object.keys(subjectStats).forEach(subject => {
      const subjectData = subjectStats[subject];
      if (subjectData && subjectData.total > 0) {
        subjectData.averageScore = Math.round(
          (subjectData.correct / subjectData.total) * 100
        );
      }
    });

    // 3. 기존 통계 삭제 후 재생성
    await db.delete(userStats).where(eq(userStats.userId, userId));
    
    // 안전 장치: 값이 없으면 0으로 설정
    const totalExams = totals[0]?.totalExams || 0;
    const totalQuestions = Number(totals[0]?.totalQuestions || 0);
    const totalCorrect = Number(totals[0]?.totalCorrect || 0);
    
    // 평균 점수 계산
    const averageScore = totalQuestions > 0
      ? Math.round((totalCorrect / totalQuestions) * 100)
      : 0;
    
    // 4. 새 통계 데이터 저장
    await db.insert(userStats).values({
      userId,
      totalExams,
      totalQuestions,
      totalCorrect,
      averageScore,
      subjectStats,
      lastExamAt: new Date(),
    });
    
    console.log(`[Statistics] Rebuilt user stats for ${userId}`);
    return true;
  } catch (error) {
    console.error('[Statistics] Error rebuilding user stats:', error);
    return false;
  }
} 