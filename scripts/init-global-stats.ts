import { db } from '../db';
import { globalStats } from '../db/schema/globalStats';
import { userDailyStats } from '../db/schema/userDailyStats';
import { userStats } from '../db/schema/userStats';
import { eq, desc, sql, sum, count, avg } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

/**
 * 기존 사용자 데이터를 기반으로 전역 통계를 초기화하는 스크립트
 */
async function initializeGlobalStats() {
  try {
    console.log('🚀 전역 통계 초기화 시작...');

    // 1. 기존 전역 통계 삭제 (재초기화)
    await db.delete(globalStats).where(eq(globalStats.statType, 'summary'));
    console.log('✅ 기존 전역 통계 삭제 완료');

    // 2. 모든 사용자의 통계 데이터 수집
    const allUserStats = await db
      .select({
        totalUsers: count(userStats.userId),
        avgCorrectRate: sql<number>`AVG(${userStats.totalCorrect}::float / NULLIF(${userStats.totalQuestions}, 0))`,
        avgSolved: sql<number>`AVG(${userStats.totalQuestions})`,
        totalSolved: sum(userStats.totalQuestions).mapWith(Number),
        totalCorrect: sum(userStats.totalCorrect).mapWith(Number),
      })
      .from(userStats);

    // 3. 모든 사용자의 일별 통계 데이터 수집
    const allDailyStats = await db
      .select({
        userId: userDailyStats.userId,
        totalStudyTime: sum(userDailyStats.totalStudyTime).mapWith(Number),
      })
      .from(userDailyStats)
      .groupBy(userDailyStats.userId);

    // 4. 모든 사용자의 연속학습일 계산
    console.log('📊 모든 사용자의 연속학습일 계산 중...');
    const allUserIds = await db
      .select({ userId: userDailyStats.userId })
      .from(userDailyStats)
      .groupBy(userDailyStats.userId);

    const allStreaks: number[] = [];
    
    for (const { userId } of allUserIds) {
      const userStreakStats = await db
        .select({
          date: userDailyStats.date,
          solvedCount: userDailyStats.solvedCount,
        })
        .from(userDailyStats)
        .where(eq(userDailyStats.userId, userId))
        .orderBy(desc(userDailyStats.date));

      let userStreak = 0;
      if (userStreakStats.length > 0) {
        let prevDate = new Date(userStreakStats[0].date);
        userStreak = userStreakStats[0].solvedCount > 0 ? 1 : 0;
        
        for (let i = 1; i < userStreakStats.length; i++) {
          const currDate = new Date(userStreakStats[i].date);
          const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1 && userStreakStats[i].solvedCount > 0) {
            userStreak++;
            prevDate = currDate;
          } else {
            break;
          }
        }
      }
      
      allStreaks.push(userStreak);
      
      // 개별 사용자의 streak도 업데이트
      if (userStreakStats.length > 0) {
        await db
          .update(userDailyStats)
          .set({ streak: userStreak })
          .where(eq(userDailyStats.userId, userId));
      }
    }

    // 5. 전역 통계 계산
    const totalUsers = Math.max(allUserStats[0]?.totalUsers || 0, allUserIds.length);
    const avgCorrectRate = allUserStats[0]?.avgCorrectRate || 0;
    const avgSolved = Math.round(allUserStats[0]?.avgSolved || 0);
    const totalSolved = allUserStats[0]?.totalSolved || 0;
    const totalCorrect = allUserStats[0]?.totalCorrect || 0;
    
    const totalStudyTime = allDailyStats.reduce((sum, stat) => sum + (stat.totalStudyTime || 0), 0);
    const avgStudyTime = totalUsers > 0 ? Math.round(totalStudyTime / totalUsers) : 0;
    
    const totalStreak = allStreaks.reduce((sum, streak) => sum + streak, 0);
    const avgStreak = allStreaks.length > 0 ? Math.round(totalStreak / allStreaks.length) : 0;

    // 6. 전역 통계 테이블에 데이터 삽입
    await db.insert(globalStats).values({
      id: uuidv4(),
      statType: 'summary',
      totalUsers: totalUsers,
      avgStudyTime: avgStudyTime,
      avgSolvedCount: avgSolved,
      avgCorrectRate: avgCorrectRate,
      avgStreak: avgStreak,
      totalStudyTime: totalStudyTime,
      totalSolvedCount: totalSolved,
      totalCorrectCount: totalCorrect,
      totalStreak: totalStreak,
      lastUpdated: new Date(),
      version: 1,
    });

    console.log('✅ 전역 통계 초기화 완료!');
    console.log(`📈 통계 요약:`);
    console.log(`   - 총 사용자 수: ${totalUsers}`);
    console.log(`   - 평균 학습 시간: ${avgStudyTime}초`);
    console.log(`   - 평균 문제 풀이 수: ${avgSolved}`);
    console.log(`   - 평균 정답률: ${(avgCorrectRate * 100).toFixed(2)}%`);
    console.log(`   - 평균 연속학습일: ${avgStreak}일`);

  } catch (error) {
    console.error('❌ 전역 통계 초기화 실패:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  initializeGlobalStats()
    .then(() => {
      console.log('🎉 전역 통계 초기화 스크립트 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

export { initializeGlobalStats }; 