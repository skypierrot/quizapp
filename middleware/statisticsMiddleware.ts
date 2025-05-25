import { updateStatsFromExamResult, updateUserDailyStats } from '@/utils/statistics';

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
    totalQuestions: number;
    elapsedTime?: number;
    createdAt: Date;
  }
) {
  try {
    // 시험 결과를 기반으로 통계 업데이트
    await updateStatsFromExamResult({
      userId,
      examDate: examResult.createdAt,
      totalQuestions: examResult.totalQuestions,
      correctAnswers: examResult.score,
      elapsedTime: examResult.elapsedTime,
    });
    
    console.log(`Successfully updated daily stats for user: ${userId}, exam: ${examResult.id}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to update stats on exam result save:', error);
    // 통계 업데이트 실패는 시험 결과 저장에 영향을 주지 않도록 에러를 전파하지 않음
    return { success: false, error };
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