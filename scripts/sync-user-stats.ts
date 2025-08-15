import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { examResults } from '@/db/schema/examResults';
import { userStats } from '@/db/schema/userStats';
import { userDailyStats } from '@/db/schema/userDailyStats';
import { eq, sql, desc } from 'drizzle-orm';
import * as schema from '@/db/schema';

// 로컬 개발 환경 데이터베이스 연결 설정
const connectionString = 'postgresql://postgres:postgres@localhost:5432/quizapp';
const client = postgres(connectionString);
const db = drizzle(client, { schema });

/**
 * 시험 결과를 분석하여 통계 데이터 생성
 * - userStats: 전체 통계
 * - userDailyStats: 일별 통계
 */
async function syncUserStats() {
  try {
    console.log('사용자 통계 동기화 시작...');

    // 모든 시험 결과 가져오기
    const allResults = await db.select().from(examResults);
    console.log(`총 ${allResults.length}개의 시험 결과 데이터를 발견했습니다.`);

    // 사용자별로 그룹화
    const userResultsMap = new Map();
    for (const result of allResults) {
      if (!userResultsMap.has(result.userId)) {
        userResultsMap.set(result.userId, []);
      }
      userResultsMap.get(result.userId).push(result);
    }

    console.log(`총 ${userResultsMap.size}명의 사용자 데이터를 처리합니다.`);

    // 각 사용자별로 통계 업데이트
    for (const [userId, userResults] of userResultsMap.entries()) {
      await updateUserStats(userId, userResults);
      await updateUserDailyStats(userId, userResults);
    }

    console.log('사용자 통계 동기화 완료!');
  } catch (error) {
    console.error('통계 동기화 중 오류 발생:', error);
  } finally {
    client.end();
    process.exit(0);
  }
}

/**
 * 사용자 전체 통계 업데이트
 */
async function updateUserStats(userId: string, results: any[]) {
  console.log(`사용자 ${userId}의 전체 통계 업데이트 중...`);

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
    if (subjectStats) {
      subjectStats.averageScore = subjectStats.total > 0 
        ? Math.round((subjectStats.correct / subjectStats.total) * 100) 
        : 0;
    }
  }

  // 마지막 시험 시간
  const lastExam = results.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];
  const lastExamAt = lastExam ? new Date(lastExam.createdAt) : null;

  // 기존 데이터 조회
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
    console.log(`사용자 ${userId}의 통계 데이터 생성 완료`);
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
    console.log(`사용자 ${userId}의 통계 데이터 업데이트 완료`);
  }
}

/**
 * 사용자 일별 통계 업데이트
 */
async function updateUserDailyStats(userId: string, results: any[]) {
  console.log(`사용자 ${userId}의 일별 통계 업데이트 중...`);

  // 일별로 그룹화
  const dailyResultsMap = new Map();
  
  for (const result of results) {
    // 시험 날짜 추출 (createdAt 사용)
    const examDate = new Date(result.createdAt);
    const dateStr = examDate.toISOString().split('T')[0]; // YYYY-MM-DD 형식
    
    if (!dailyResultsMap.has(dateStr)) {
      dailyResultsMap.set(dateStr, []);
    }
    dailyResultsMap.get(dateStr).push(result);
  }

  // 기존 데이터 삭제 (중복 방지)
  await db.delete(userDailyStats)
    .where(eq(userDailyStats.userId, userId));

  // 일별 통계 생성
  for (const [dateStr, dayResults] of dailyResultsMap.entries()) {
    const solvedCount = dayResults.reduce((sum: number, r: any) => sum + (r.totalQuestions || 0), 0);
    const correctCount = dayResults.reduce((sum: number, r: any) => sum + (r.correctCount || 0), 0);
    const totalStudyTime = dayResults.reduce((sum: number, r: any) => sum + (r.elapsedTime || 0) * 60, 0); // 분을 초로 변환

    // 연속 학습일 추가 로직 필요 (여기서는 생략, 모든 날짜 데이터가 없어서 계산 불가능)
    
    await db.insert(userDailyStats).values({
      id: `${userId}-${dateStr}`,
      userId,
      date: dateStr,
      solvedCount,
      correctCount,
      totalStudyTime,
      streak: 0, // 여기서는 0으로 설정
      updatedAt: new Date()
    });
  }

  console.log(`사용자 ${userId}의 일별 통계 업데이트 완료`);
}

// 스크립트 실행
syncUserStats(); 