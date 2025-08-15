import { db } from '../db';
import { userStats } from '../db/schema/userStats';
import { userDailyStats } from '../db/schema/userDailyStats';
import { rebuildStatistics } from '../lib/statistics';
import { eq, gte } from 'drizzle-orm';

async function main() {
  console.log("=== 통계 데이터 재구축 시작 ===");
  console.log("이 스크립트는 모든 사용자의 통계 데이터를 재구축합니다.");
  console.log("데이터가 많은 경우 시간이 오래 걸릴 수 있습니다.");
  
  // 1. 모든 사용자 ID 가져오기
  console.log("모든 사용자 ID 조회 중...");
  
  const users = await db
    .select({
      userId: userStats.userId
    })
    .from(userStats);
  
  console.log(`총 ${users.length}명의 사용자에 대한 통계를 재구축합니다.`);
  
  // 2. 각 사용자별 통계 재구축
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    if (!user) continue;
    
    const userId = user.userId;
    console.log(`[${i+1}/${users.length}] 사용자 ${userId} 통계 재구축 중...`);
    
    try {
      const success = await rebuildStatistics(userId);
      
      if (success) {
        console.log(`✅ 사용자 ${userId} 통계 재구축 완료`);
        successCount++;
      } else {
        console.error(`❌ 사용자 ${userId} 통계 재구축 실패`);
        failCount++;
      }
    } catch (error) {
      console.error(`❌ 사용자 ${userId} 통계 재구축 중 오류 발생:`, error);
      failCount++;
    }
    
    // 메모리 누수 방지를 위한 짧은 대기
    if (i % 10 === 0 && i > 0) {
      console.log(`${i}명의 사용자 처리 완료. 잠시 대기...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // 3. 결과 보고
  console.log("=== 통계 데이터 재구축 완료 ===");
  console.log(`성공: ${successCount}명`);
  console.log(`실패: ${failCount}명`);
  
  // 실패한 경우 경고
  if (failCount > 0) {
    console.warn("일부 사용자의 통계 재구축에 실패했습니다. 로그를 확인하세요.");
  }
  
  // --- 전체 사용자 일일 통계 재구축 로직 추가 (현재 API는 statisticsSummary를 사용하므로 이 로직은 사용되지 않을 수 있음) ---
  /*
  console.log("\\n=== 전체 사용자 일일 통계 재구축 시작 ===");
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoString = thirtyDaysAgo.toISOString().split('T')[0];

    console.log(`지난 30일(${thirtyDaysAgoString} 이후)간의 모든 사용자 일일 통계 조회 중...`);
    
    const allIndividualDailyStats = await db
      .select({
        date: userDailyStats.date,
        solvedCount: userDailyStats.solvedCount,
        correctCount: userDailyStats.correctCount,
        totalStudyTime: userDailyStats.totalStudyTime,
        userId: userDailyStats.userId,
      })
      .from(userDailyStats)
      .where(gte(userDailyStats.date, thirtyDaysAgoString));

    const filteredStats = allIndividualDailyStats.filter(stat => stat.userId !== 'ALL_USERS_STATS');

    if (filteredStats.length > 0) {
      console.log(`집계 대상 사용자별 일일 통계 ${filteredStats.length}건 발견.`);
      const aggregatedStats: Record<string, {
        date: string;
        totalSolvedCount: number;
        totalCorrectCount: number;
        totalStudyTime: number;
        totalTotalQuestions: number; 
        contributingUserIds: Set<string>;
      }> = {};

      for (const stat of filteredStats) {
        if (!aggregatedStats[stat.date]) {
          aggregatedStats[stat.date] = {
            date: stat.date,
            totalSolvedCount: 0,
            totalCorrectCount: 0,
            totalStudyTime: 0,
            totalTotalQuestions: 0,
            contributingUserIds: new Set<string>(),
          };
        }
        aggregatedStats[stat.date].totalSolvedCount += stat.solvedCount;
        aggregatedStats[stat.date].totalCorrectCount += stat.correctCount;
        aggregatedStats[stat.date].totalStudyTime += stat.totalStudyTime;
        aggregatedStats[stat.date].totalTotalQuestions += stat.solvedCount;
        if(stat.userId) {
            aggregatedStats[stat.date].contributingUserIds.add(stat.userId);
        }
      }
      
      const globalDailyStatsToInsert = Object.values(aggregatedStats).map(agg => {
        const userCountForDate = agg.contributingUserIds.size;
        if (userCountForDate === 0) return null;

        return {
          userId: 'ALL_USERS_STATS', 
          date: agg.date,
          solvedCount: Math.round(agg.totalSolvedCount / userCountForDate),
          correctCount: Math.round(agg.totalCorrectCount / userCountForDate),
          totalStudyTime: Math.round(agg.totalStudyTime / userCountForDate),
          totalQuestions: Math.round(agg.totalTotalQuestions / userCountForDate),
          // isGlobal: true, // userDailyStats 스키마에 isGlobal 필드 없음
        };
      }).filter(stat => stat !== null);

      if (globalDailyStatsToInsert.length > 0) {
        console.log(`새로운 전체 사용자 일일 통계 ${globalDailyStatsToInsert.length}건 생성됨. DB 작업 시작...`);
        await db.delete(userDailyStats).where(eq(userDailyStats.userId, 'ALL_USERS_STATS'));
        console.log("기존 전체 사용자 통계 데이터 삭제 완료.");
        
        await db.insert(userDailyStats).values(globalDailyStatsToInsert);
        console.log("✅ 새로운 전체 사용자 일일 통계 데이터 삽입 완료.");
      } else {
        console.log("데이터 부족으로 새로운 전체 사용자 일일 통계를 생성하지 않았습니다.");
      }
    } else {
      console.log("지난 30일간 집계할 사용자별 일일 통계 데이터가 없습니다. 전체 통계를 생성할 수 없습니다.");
    }
  } catch (error) {
    console.error("❌ 전체 사용자 일일 통계 재구축 중 오류 발생:", error);
  }
  */
  // --- 전체 사용자 일일 통계 재구축 로직 끝 ---

  process.exit(0);
}

// 스크립트 실행
main().catch(error => {
  console.error("통계 재구축 중 오류 발생:", error);
  process.exit(1);
}); 