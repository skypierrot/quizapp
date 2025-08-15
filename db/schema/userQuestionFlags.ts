import { pgTable, text, uuid, timestamp, boolean, primaryKey } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { questions } from './questions';

export const userQuestionFlags = pgTable(
  'user_question_flags',
  {
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
    isBookmarked: boolean('is_bookmarked').default(false),
    isImportant: boolean('is_important').default(false),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.questionId] }),
  })
); 