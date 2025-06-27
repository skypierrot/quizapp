import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { userStats } from '@/db/schema/userStats';
import { userDailyStats } from '@/db/schema/userDailyStats';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';

// 테스트 사용자 ID (실제 로그인된 사용자 ID로 교체)
const TEST_USER_ID = '602deb82-7c1f-4626-8b77-d83ed752cebc';

// 로컬 개발 환경 데이터베이스 연결 설정
const connectionString = 'postgresql://postgres:postgres@quizapp-db-dev:5432/quizapp';
const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function createTestStats() {
  try {
    console.log('테스트 통계 데이터 생성 시작...');

    // 1. userStats 테이블에 기본 통계 데이터 생성
    const existingStats = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, TEST_USER_ID));

    if (existingStats.length === 0) {
      console.log('사용자 기본 통계 데이터 생성...');
      await db.insert(userStats).values({
        userId: TEST_USER_ID,
        totalExams: 15,
        totalQuestions: 450,
        totalCorrect: 375,
        averageScore: 83,
        subjectStats: {
          '데이터베이스': { total: 120, correct: 90, averageScore: 75 },
          '소프트웨어 공학': { total: 95, correct: 80, averageScore: 84 },
          '네트워크': { total: 110, correct: 95, averageScore: 86 },
          '알고리즘': { total: 80, correct: 70, averageScore: 87 },
          '운영체제': { total: 45, correct: 40, averageScore: 89 }
        }
      });
    } else {
      console.log('이미 사용자 기본 통계 데이터가 존재합니다.');
    }

    // 2. userDailyStats 테이블에 최근 30일 데이터 생성
    const existingDailyStats = await db
      .select()
      .from(userDailyStats)
      .where(eq(userDailyStats.userId, TEST_USER_ID));

    if (existingDailyStats.length < 10) { // 충분한 데이터가 없는 경우
      console.log('사용자 일별 통계 데이터 생성...');
      
      // 최근 30일 데이터 생성
      const today = new Date();
      const values = [];
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
        
        // 주말에는 더 적은 학습량
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        
        // 랜덤 데이터 생성 (실제 서비스에서는 실제 사용자 활동 데이터)
        const randomFactor = Math.random() * 0.5 + 0.5; // 0.5 ~ 1.0 사이 랜덤값
        const solvedCount = isWeekend ? Math.floor(5 * randomFactor) : Math.floor(15 * randomFactor);
        const correctCount = Math.floor(solvedCount * 0.75 * randomFactor); // 약 75% 정답률
        const studyTime = isWeekend ? Math.floor(1800 * randomFactor) : Math.floor(3600 * randomFactor); // 30분~1시간
        
        // 연속 학습일 계산 (실제로는 이전 기록 기반으로 계산)
        // 여기서는 간단하게 최근 날짜에 더 큰 streak 값 부여
        const streak = i < 7 ? 7 - i : 0; // 최근 7일은 연속 학습으로 설정
        
        values.push({
          id: `${TEST_USER_ID}-${dateStr}`, // 사용자ID-날짜 형식의 고유 ID
          userId: TEST_USER_ID,
          date: dateStr,
          totalStudyTime: studyTime,
          solvedCount,
          correctCount,
          streak,
          updatedAt: new Date()
        });
      }
      
      // 데이터 삽입 (중복 방지를 위해 기존 데이터 삭제)
      if (existingDailyStats.length > 0) {
        await db.delete(userDailyStats)
          .where(eq(userDailyStats.userId, TEST_USER_ID));
      }
      
      // 일괄 삽입
      for (const value of values) {
        await db.insert(userDailyStats).values(value);
      }
    } else {
      console.log('이미 충분한 사용자 일별 통계 데이터가 존재합니다.');
    }

    console.log('테스트 데이터 생성 완료!');
  } catch (error) {
    console.error('테스트 데이터 생성 중 오류 발생:', error);
  } finally {
    client.end(); // 데이터베이스 연결 종료
    process.exit(0);
  }
}

// 스크립트 실행
createTestStats(); 