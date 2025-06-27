import { updateStatsFromExamResult, updateUserDailyStats } from '@/utils/statistics';
import { db } from '@/db';
import { userStats } from '@/db/schema/userStats';
import { examResults } from '@/db/schema/examResults';
import { eq } from 'drizzle-orm';

/**
 * 시험 결과가 저장될 때 호출되어 사용자의 일별 학습 통계를 업데이트하는 미들웨어
 * 
 * 시험 결과 저장 API에서 이 함수를 호출하여 통계를 업데이트합니다.
 */
export async function updateStatsOnExamResultSave(
  userId: string, 
  examResult: { 
    id: string;
    examId: string;
    score: number;
    correctCount: number;
    totalQuestions: number;
    elapsedTime?: number;
    createdAt: Date;
  }
) {
  try {
    // 1. 시험 결과를 기반으로 일별 통계 업데이트
    await updateStatsFromExamResult({
      userId,
      examDate: examResult.createdAt,
      totalQuestions: examResult.totalQuestions,
      correctAnswers: examResult.correctCount,
      elapsedTime: examResult.elapsedTime,
    });
    
    // 2. userStats 전체 통계도 업데이트
    await updateUserStatsFromExamResults(userId);
    
    console.log(`Successfully updated daily stats and userStats for user: ${userId}, exam: ${examResult.id}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to update stats on exam result save:', error);
    // 통계 업데이트 실패는 시험 결과 저장에 영향을 주지 않도록 에러를 전파하지 않음
    return { success: false, error };
  }
}

/**
 * 사용자의 모든 시험 결과를 기반으로 userStats를 업데이트하는 함수
 */
async function updateUserStatsFromExamResults(userId: string) {
  try {
    // 해당 사용자의 모든 시험 결과 조회
    const results = await db
      .select()
      .from(examResults)
      .where(eq(examResults.userId, userId));

    if (!results || results.length === 0) {
      console.warn(`No exam results found for user: ${userId}`);
      return;
    }

    // 통계 계산
    const totalExams = results.length;
    const totalQuestions = results.reduce((sum, r) => sum + (r.totalQuestions || 0), 0);
    const totalCorrect = results.reduce((sum, r) => sum + (r.correctCount || 0), 0);
    const averageScore = totalQuestions > 0 
      ? Math.round((totalCorrect / totalQuestions) * 100) 
      : 0;

    // 과목별 통계 집계
    const subjectStatsMap: Record<string, { total: number; correct: number; averageScore: number }> = {};
    for (const result of results) {
      if (result.subjectStats) {
        for (const [subject, stats] of Object.entries(result.subjectStats)) {
          if (!subjectStatsMap[subject]) {
            subjectStatsMap[subject] = { total: 0, correct: 0, averageScore: 0 };
          }
          subjectStatsMap[subject].total += (stats as any).total || 0;
          subjectStatsMap[subject].correct += (stats as any).correct || 0;
        }
      }
    }

    // 과목별 평균 점수 계산
    for (const subject in subjectStatsMap) {
      const subjectStats = subjectStatsMap[subject];
      subjectStats.averageScore = subjectStats.total > 0 
        ? Math.round((subjectStats.correct / subjectStats.total) * 100) 
        : 0;
    }

    // 마지막 시험 시간
    const lastExam = results.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
    const lastExamAt = lastExam ? new Date(lastExam.createdAt) : null;

    // userStats 테이블 업데이트
    const existingStats = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, userId));

    if (existingStats.length === 0) {
      // 새 데이터 생성
      await db.insert(userStats).values({
        userId,
        totalExams,
        totalQuestions,
        totalCorrect,
        averageScore,
        subjectStats: subjectStatsMap,
        lastExamAt,
        updatedAt: new Date()
      });
      console.log(`Created new userStats for user: ${userId}`);
    } else {
      // 기존 데이터 업데이트
      await db.update(userStats)
        .set({
          totalExams,
          totalQuestions,
          totalCorrect,
          averageScore,
          subjectStats: subjectStatsMap,
          lastExamAt,
          updatedAt: new Date()
        })
        .where(eq(userStats.userId, userId));
      console.log(`Updated userStats for user: ${userId}`);
    }
  } catch (error) {
    console.error('Failed to update userStats from exam results:', error);
    throw error;
  }
}

/**
 * 학습 세션이 완료될 때 호출되어 사용자의 일별 학습 통계를 업데이트하는 미들웨어
 * 
 * 학습 세션 완료 API에서 이 함수를 호출하여 통계를 업데이트합니다.
 */
export async function updateStatsOnStudySessionComplete(
  userId: string,
  sessionData: {
    solvedCount: number;
    correctCount: number;
    studyTime: number; // 초 단위
    date?: Date;
  }
) {
  try {
    // 학습 세션 결과를 기반으로 통계 업데이트
    const { solvedCount, correctCount, studyTime, date } = sessionData;
    
    await updateUserDailyStats({
      userId,
      date: date || new Date(),
      solvedCount,
      correctCount,
      studyTime,
    });
    
    console.log(`Successfully updated daily stats for user: ${userId}, session completed`);
    return { success: true };
  } catch (error) {
    console.error('Failed to update stats on study session complete:', error);
    return { success: false, error };
  }
} 