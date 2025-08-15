import { pgTable, text, uuid, integer, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { questions } from './questions';

export const userQuestionOptionMemos = pgTable(
  'user_question_option_memos',
  {
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
    optionIndex: integer('option_index').notNull(),
    memo: text('memo'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.questionId, table.optionIndex] }),
  })
); 