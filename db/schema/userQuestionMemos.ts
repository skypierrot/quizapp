import { pgTable, text, uuid, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { questions } from './questions';

export const userQuestionMemos = pgTable(
  'user_question_memos',
  {
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
    memo: text('memo'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.questionId] }),
  })
); 