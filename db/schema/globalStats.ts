import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  real,
} from 'drizzle-orm/pg-core';

/**
 * 전역 통계 데이터를 저장하는 테이블
 * 
 * 모든 사용자의 통계를 집계하여 저장합니다.
 * 비로그인 사용자에게 제공할 평균 통계 데이터입니다.
 * 
 * 이 테이블은 사용자의 학습 기록이 업데이트될 때마다 증분 업데이트됩니다.
 */
export const globalStats = pgTable(
  'global_stats',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // 통계 유형 (예: 'summary', 'daily', 'weekly' 등)
    statType: text('stat_type').notNull().default('summary'),
    
    // 전체 사용자 수
    totalUsers: integer('total_users').notNull().default(0),
    
    // 평균 학습 시간 (초 단위)
    avgStudyTime: integer('avg_study_time').notNull().default(0),
    
    // 평균 문제 풀이 수
    avgSolvedCount: integer('avg_solved_count').notNull().default(0),
    
    // 평균 정답률 (0.0 ~ 1.0)
    avgCorrectRate: real('avg_correct_rate').notNull().default(0.0),
    
    // 평균 연속학습일
    avgStreak: integer('avg_streak').notNull().default(0),
    
    // 총합 데이터 (평균 계산을 위한 원본 데이터)
    totalStudyTime: integer('total_study_time').notNull().default(0),
    totalSolvedCount: integer('total_solved_count').notNull().default(0),
    totalCorrectCount: integer('total_correct_count').notNull().default(0),
    totalStreak: integer('total_streak').notNull().default(0),
    
    // 마지막 업데이트 시간
    lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow().notNull(),
    
    // 업데이트 버전 (동시성 제어용)
    version: integer('version').notNull().default(1),
  }
); 