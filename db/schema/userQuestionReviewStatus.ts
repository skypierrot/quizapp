import { pgTable, text, uuid, timestamp, integer, primaryKey } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { questions } from './questions';

// 복습 상태: 0=미복습, 1=복습 중, 2=완료
export const userQuestionReviewStatus = pgTable(
  'user_question_review_status',
  {
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
    reviewStatus: integer('review_status').default(0).notNull(), // 0=미복습, 1=복습 중, 2=완료
    lastReviewedAt: timestamp('last_reviewed_at', { withTimezone: true }),
    nextReviewDate: timestamp('next_review_date', { withTimezone: true }), // 다음 복습 예정일
    retryCount: integer('retry_count').default(0).notNull(), // 재시도 횟수
    correctRetryCount: integer('correct_retry_count').default(0).notNull(), // 정답 재시도 횟수
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.questionId] }),
  })
); 