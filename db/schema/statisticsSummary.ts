import {
  pgTable,
  uuid,
  text,
  date,
  integer,
  timestamp,
  boolean,
  index,
  uniqueIndex
} from 'drizzle-orm/pg-core';

/**
 * 통계 요약 데이터를 저장하는 테이블
 * 
 * 일별로 사용자의 학습 데이터를 집계하여 저장합니다.
 * - 일별 시험 응시 수
 * - 일별 총 문제 수
 * - 일별 맞은 문제 수
 * - 일별 학습 시간
 * - **어떤 시험에 대한 통계인지 구분 가능 (선택 사항)**
 * 
 * 이 테이블은 매 이벤트마다 증분 업데이트되며,
 * 필요시 일괄 재계산할 수 있습니다.
 */
export const statisticsSummary = pgTable(
  'statistics_summary',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    
    // 날짜 (YYYY-MM-DD)
    date: date('date').notNull(),
    
    // 시험 관련 통계
    examCount: integer('exam_count').notNull().default(0),     // 시험 응시 횟수
    totalQuestions: integer('total_questions').notNull().default(0), // 총 문제 수
    correctQuestions: integer('correct_questions').notNull().default(0), // 맞은 문제 수
    
    // 학습 시간 (초 단위)
    studyTimeSeconds: integer('study_time_seconds').notNull().default(0),
    
    // 과목별 통계 (JSON 형태로 저장)
    // { "과목명": { "total": 문제수, "correct": 맞은수 } }
    subjectStats: text('subject_stats').notNull().default('{}'), 
    
    // 연속 학습일 (streak)
    streak: integer('streak').notNull().default(0),
    
    // 메타데이터
    lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow().notNull(),
    
    // **시험 관련 정보 추가 (선택 사항)**
    // 어떤 시험에 대한 통계인지 구분 (examResults 테이블과 연결 가능)
    examId: text('exam_id'), // UUID 또는 기타 식별자 타입에 따라 변경 가능
    examName: text('exam_name'), // 시험 이름
    
    isProcessed: boolean('is_processed').notNull().default(true), // 처리 완료 여부
  },
  (table) => ({
    // 사용자 ID와 날짜, 시험 ID로 빠르게 조회하기 위한 유니크 인덱스 (시험 ID는 선택 사항이므로 조건부 필요)
    // examId가 null인 경우를 포함하여 userId와 date로 유니크함을 유지하거나,
    // userId, date, examId 조합으로 유니크 인덱스를 설정할 수 있습니다.
    // 여기서는 userId, date, examId 조합으로 유니크 인덱스를 설정하여 시험별 일별 통계를 고유하게 식별합니다.
    statsUserDateExamIdx: uniqueIndex('stats_user_date_exam_idx').on(table.userId, table.date, table.examId),
    // 사용자 ID와 날짜로 빠르게 조회하기 위한 인덱스
    statsUserDateIdx: uniqueIndex('stats_user_date_idx').on(table.userId, table.date),
    // 날짜별 조회를 위한 인덱스
    statsDateIdx: index('stats_date_idx').on(table.date),
  })
); 