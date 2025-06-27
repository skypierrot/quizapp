import { pgTable, text, timestamp, boolean, primaryKey } from 'drizzle-orm/pg-core';
import { users } from './auth';

export const userExamFavorites = pgTable(
  'user_exam_favorites',
  {
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    examName: text('exam_name').notNull(),
    isFavorite: boolean('is_favorite').default(true),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.examName] }),
  })
); 