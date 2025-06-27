import { pgTable, text, date, integer, timestamp, index } from 'drizzle-orm/pg-core';

export const userDailyStats = pgTable(
  'user_daily_stats',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    date: date('date').notNull(),
    totalStudyTime: integer('total_study_time').notNull().default(0), // 초 단위
    solvedCount: integer('solved_count').notNull().default(0),
    correctCount: integer('correct_count').notNull().default(0),
    streak: integer('streak').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userDateIdx: index('user_date_idx').on(table.userId, table.date),
  })
); 