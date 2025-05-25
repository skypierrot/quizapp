import { db } from '@/db';
import { userDailyStats } from '@/db/schema/userDailyStats';
import { eq, and } from 'drizzle-orm';
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
          eq(userDailyStats.date, dateString)
        )
      )
      .limit(1);

    if (existingStats.length > 0) {
      // 기존 통계가 있으면 업데이트
      const currentStats = existingStats[0];
      
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
            eq(userDailyStats.date, dateString)
          )
        );
    } else {
      // 기존 통계가 없으면 새로 생성
      await db.insert(userDailyStats).values({
        id: uuidv4(),
        userId,
        date: dateString,
        solvedCount,
        correctCount,
        totalStudyTime: studyTime,
        streak: 0, // 별도 로직으로 streak 업데이트 필요
        updatedAt: new Date(),
      });
      
      // TODO: 연속 학습일(streak) 업데이트 로직 추가
      // 별도 함수로 분리하거나 여기에 추가할 수 있음
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating user daily stats:', error);
    return { success: false, error };
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