import { db } from '@/db';
import { userDailyStats } from '@/db/schema/userDailyStats';
import { globalStats } from '@/db/schema/globalStats';
import { eq, and, desc, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

/**
 * 사용자의 일별 학습 통계를 업데이트하는 함수
 * 
 * 이 함수는 시험 결과나 학습 세션이 완료될 때 호출되어,
 * 해당 날짜의 사용자 학습 통계를 업데이트합니다.
 */
export async function updateUserDailyStats({
  userId,
  date,
  solvedCount = 0,
  correctCount = 0,
  studyTime = 0,
}: {
  userId: string;
  date?: Date | string; // 날짜를 제공하지 않으면 현재 날짜 사용
  solvedCount?: number; // 푼 문제 수
  correctCount?: number; // 맞춘 문제 수
  studyTime?: number; // 학습 시간 (초 단위)
}) {
  try {
    // 날짜 처리
    const targetDate = date 
      ? new Date(date) 
      : new Date();
    
    // YYYY-MM-DD 형식으로 변환
    const dateString = targetDate.toISOString().split('T')[0];

    // 현재 사용자의 해당 날짜 통계 조회
    const existingStats = await db
      .select()
      .from(userDailyStats)
              .where(
          and(
            eq(userDailyStats.userId, userId),
            eq(userDailyStats.date, dateString || '')
          )
        )
      .limit(1);

    let isNewRecord = false;
    let oldStreak = 0;
    let newStreak = 0;

    if (existingStats.length > 0) {
      // 기존 통계가 있으면 업데이트
      const currentStats = existingStats[0];
      if (currentStats) {
        oldStreak = currentStats.streak || 0;
        
        await db
          .update(userDailyStats)
          .set({
            solvedCount: (currentStats.solvedCount || 0) + solvedCount,
            correctCount: (currentStats.correctCount || 0) + correctCount,
            totalStudyTime: (currentStats.totalStudyTime || 0) + studyTime,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(userDailyStats.userId, userId),
              eq(userDailyStats.date, dateString || '')
            )
          );
      }
    } else {
      // 기존 통계가 없으면 새로 생성
      isNewRecord = true;
      const id = `${userId}_${dateString || new Date().toISOString().split('T')[0]}`;
      const dateValue = dateString || new Date().toISOString().split('T')[0];
      
      await db.insert(userDailyStats).values({
        id,
        userId,
        date: dateValue,
        solvedCount,
        correctCount,
        totalStudyTime: studyTime,
        streak: 0, // 아래에서 계산하여 업데이트
        updatedAt: new Date(),
      } as any); // 임시 타입 강제 캐스팅
    }

    // 연속학습일 계산 및 업데이트
    const dateValue = dateString || new Date().toISOString().split('T')[0];
    if (dateValue) {
      newStreak = await calculateAndUpdateStreak(userId, dateValue);
    }
    
    // 전역 통계 업데이트 (연속학습일 변화가 있을 때만)
    if (isNewRecord || oldStreak !== newStreak) {
      await updateGlobalStats({
        userCount: isNewRecord ? 1 : 0,
        studyTime: studyTime,
        solvedCount: solvedCount,
        correctCount: correctCount,
        streakChange: newStreak - oldStreak,
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating user daily stats:', error);
    return { success: false, error };
  }
}

/**
 * 사용자의 연속학습일을 계산하고 업데이트하는 함수
 */
async function calculateAndUpdateStreak(userId: string, currentDate: string): Promise<number> {
  try {
    // 사용자의 모든 학습 기록을 날짜 내림차순으로 조회
    const userStats = await db
      .select({
        date: userDailyStats.date,
        solvedCount: userDailyStats.solvedCount,
      })
      .from(userDailyStats)
      .where(eq(userDailyStats.userId, userId))
      .orderBy(desc(userDailyStats.date));

    if (userStats.length === 0) {
      return 0;
    }

    // 연속학습일 계산
    let streak = 0;
    let prevDate = new Date(userStats[0]?.date || '');
    
    // 첫 번째 날짜부터 시작
    if (userStats[0]?.solvedCount && userStats[0].solvedCount > 0) {
      streak = 1;
    }

    // 나머지 날짜들 확인
    for (let i = 1; i < userStats.length; i++) {
      const currStat = userStats[i];
      if (currStat) {
        const currDate = new Date(currStat.date);
        const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1 && currStat.solvedCount && currStat.solvedCount > 0) {
          streak++;
          prevDate = currDate;
        } else {
          break;
        }
      }
    }

    // 계산된 연속학습일로 현재 날짜의 streak 업데이트
    await db
      .update(userDailyStats)
      .set({
        streak: streak,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userDailyStats.userId, userId),
          eq(userDailyStats.date, currentDate)
        )
      );

    return streak;
  } catch (error) {
    console.error('Error calculating streak:', error);
    return 0;
  }
}

/**
 * 전역 통계를 증분 업데이트하는 함수
 */
async function updateGlobalStats({
  userCount = 0,
  studyTime = 0,
  solvedCount = 0,
  correctCount = 0,
  streakChange = 0,
}: {
  userCount?: number;
  studyTime?: number;
  solvedCount?: number;
  correctCount?: number;
  streakChange?: number;
}) {
  try {
    // 현재 전역 통계 조회
    const currentGlobalStats = await db
      .select()
      .from(globalStats)
      .where(eq(globalStats.statType, 'summary'))
      .limit(1);

    if (currentGlobalStats.length === 0) {
      // 전역 통계가 없으면 새로 생성
      const avgCorrectRate = solvedCount > 0 ? correctCount / solvedCount : 0;
      const avgStreak = userCount > 0 ? Math.max(streakChange, 0) : 0;
      
      await db.insert(globalStats).values({
        id: uuidv4(),
        statType: 'summary',
        totalUsers: Math.max(userCount, 0),
        avgStudyTime: studyTime,
        avgSolvedCount: solvedCount,
        avgCorrectRate: avgCorrectRate,
        avgStreak: avgStreak,
        totalStudyTime: studyTime,
        totalSolvedCount: solvedCount,
        totalCorrectCount: correctCount,
        totalStreak: Math.max(streakChange, 0),
        lastUpdated: new Date(),
        version: 1,
      });
    } else {
      // 기존 전역 통계 업데이트
      const current = currentGlobalStats[0];
      if (current) {
        const newTotalUsers = Math.max(current.totalUsers + userCount, 1);
        const newTotalStudyTime = current.totalStudyTime + studyTime;
        const newTotalSolvedCount = current.totalSolvedCount + solvedCount;
        const newTotalCorrectCount = current.totalCorrectCount + correctCount;
        const newTotalStreak = Math.max(current.totalStreak + streakChange, 0);

      // 평균 계산
      const newAvgStudyTime = Math.round(newTotalStudyTime / newTotalUsers);
      const newAvgSolvedCount = Math.round(newTotalSolvedCount / newTotalUsers);
      const newAvgCorrectRate = newTotalSolvedCount > 0 ? newTotalCorrectCount / newTotalSolvedCount : 0;
      const newAvgStreak = Math.round(newTotalStreak / newTotalUsers);

      await db
        .update(globalStats)
        .set({
          totalUsers: newTotalUsers,
          avgStudyTime: newAvgStudyTime,
          avgSolvedCount: newAvgSolvedCount,
          avgCorrectRate: newAvgCorrectRate,
          avgStreak: newAvgStreak,
          totalStudyTime: newTotalStudyTime,
          totalSolvedCount: newTotalSolvedCount,
          totalCorrectCount: newTotalCorrectCount,
          totalStreak: newTotalStreak,
          lastUpdated: new Date(),
          version: current.version + 1,
        })
        .where(eq(globalStats.id, current.id));
      }
    }

    console.log(`Global stats updated: userCount=${userCount}, studyTime=${studyTime}, solvedCount=${solvedCount}, correctCount=${correctCount}, streakChange=${streakChange}`);
  } catch (error) {
    console.error('Error updating global stats:', error);
  }
}

/**
 * 시험 결과를 기반으로 일별 학습 통계를 업데이트하는 함수
 * 
 * 시험 결과가 저장될 때 이 함수를 호출하여 일별 통계에 반영합니다.
 */
export async function updateStatsFromExamResult({
  userId,
  examDate,
  totalQuestions,
  correctAnswers,
  elapsedTime,
}: {
  userId: string;
  examDate: Date | string; // 시험 응시 날짜
  totalQuestions: number; // 전체 문제 수
  correctAnswers: number; // 맞은 문제 수
  elapsedTime?: number; // 소요 시간 (초 단위, 옵션)
}) {
  return updateUserDailyStats({
    userId,
    date: examDate,
    solvedCount: totalQuestions,
    correctCount: correctAnswers,
    studyTime: elapsedTime || 0,
  });
} 