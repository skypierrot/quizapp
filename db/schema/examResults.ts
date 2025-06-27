import {
  pgTable,
  varchar,
  integer,
  jsonb,
  timestamp,
  index,
  uuid,
  text,
  date,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './auth';
import type { IAnswerDetail } from '@/types';
// Assuming you have a users table schema defined elsewhere, e.g., in ./users.ts
// import { users } from './users'; // If you need to define relations

export const examResults = pgTable(
  'exam_results',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(), // text로 변경
    examName: varchar('exam_name', { length: 255 }).notNull(),
    examYear: integer('exam_year').notNull(),
    examDate: date('exam_date').notNull(), // 추가된 컬럼
    examSubject: text('exam_subject').notNull(), // examSession -> examSubject, varchar -> text

    // Store detailed answer info including correctness
    answers: jsonb('answers').$type<IAnswerDetail[]>().notNull(),

    score: integer('score').notNull(), // Calculated score
    correctCount: integer('correct_count').notNull(),
    totalQuestions: integer('total_questions').notNull(),

    // 추가: 과목별 정답 수
    subjectStats: jsonb('subject_stats').$type<Record<string, { correct: number; total: number }>>().notNull().default({}),

    elapsedTime: integer('elapsed_time').notNull(), // Time taken in seconds
    limitTime: integer('limit_time'), // Optional time limit in seconds

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      // Add an index on userId for faster querying of user results
      userIdx: index('user_id_idx').on(table.userId),
      // Index on exam details might be useful for querying specific exams
      examDetailsIdx: index('exam_details_idx').on(
        table.examName,
        table.examYear,
        table.examSubject
      ),
    };
  }
);

// 관계 정의 추가
export const examResultsRelations = relations(examResults, ({ one }) => ({
  user: one(users, {
    fields: [examResults.userId],
    references: [users.id], // users.id로 연결
  }),
  // 필요시 exams 테이블과의 관계도 정의 (현재는 FK 없음)
  // exam: one(exams, { ... })
}));

// Define a type for inserting new exam results (optional but good practice)
export type InsertExamResult = typeof examResults.$inferInsert;
// Define a type for selecting exam results (optional but good practice)
// export type IExamResult = typeof examResults.$inferSelect; 