import {
  pgTable,
  integer,
  timestamp,
  uuid,
  text,
  jsonb,
  index
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './auth';

export const userStats = pgTable(
  'user_stats',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull().unique(),

    // 시험 관련 통계
    totalExams: integer('total_exams').notNull().default(0),
    totalQuestions: integer('total_questions').notNull().default(0),
    totalCorrect: integer('total_correct').notNull().default(0),
    averageScore: integer('average_score').notNull().default(0),

    // 과목별 통계
    subjectStats: jsonb('subject_stats').$type<Record<string, {
      total: number;
      correct: number;
      averageScore: number;
    }>>().notNull().default({}),

    // 게시글/댓글 통계
    totalPosts: integer('total_posts').notNull().default(0),
    totalComments: integer('total_comments').notNull().default(0),

    // 마지막 업데이트 시간
    lastExamAt: timestamp('last_exam_at', { withTimezone: true }),
    lastPostAt: timestamp('last_post_at', { withTimezone: true }),
    lastCommentAt: timestamp('last_comment_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      userIdx: index('user_stats_user_id_idx').on(table.userId),
    };
  }
);

// 관계 정의
export const userStatsRelations = relations(userStats, ({ one }) => ({
  user: one(users, {
    fields: [userStats.userId],
    references: [users.id],
  }),
}));

export type InsertUserStats = typeof userStats.$inferInsert; 