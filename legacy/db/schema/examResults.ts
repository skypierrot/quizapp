import {
  pgTable,
  serial,
  varchar,
  integer,
  jsonb,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
// Assuming you have a users table schema defined elsewhere, e.g., in ./users.ts
// import { users } from './users'; // If you need to define relations

// Define the structure for the 'answers' JSONB field
interface IAnswerDetail {
  questionId: string;
  selectedOptionIndex: number | null; // User might not answer
  isCorrect: boolean;
}

export const examResults = pgTable(
  'exam_results',
  {
    id: serial('id').primaryKey(),
    userId: varchar('user_id', { length: 255 }).notNull(), // Clerk User ID can be up to 255 chars
    examName: varchar('exam_name', { length: 255 }).notNull(),
    examYear: integer('exam_year').notNull(),
    examSession: varchar('exam_session', { length: 50 }).notNull(), // e.g., '1회', '2회차', '상시'

    // Store detailed answer info including correctness
    answers: jsonb('answers').$type<IAnswerDetail[]>().notNull(),

    score: integer('score').notNull(), // Calculated score
    correctCount: integer('correct_count').notNull(),
    totalQuestions: integer('total_questions').notNull(),

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
        table.examSession
      ),
    };
  }
);

// Optional: Define relations if needed, e.g., linking to a users table
// export const examResultsRelations = relations(examResults, ({ one }) => ({
//   user: one(users, {
//     fields: [examResults.userId],
//     references: [users.id], // Assuming your users table has an 'id' field that matches Clerk's userId
//   }),
// }));

// Define a type for inserting new exam results (optional but good practice)
export type INewExamResult = typeof examResults.$inferInsert;
// Define a type for selecting exam results (optional but good practice)
export type IExamResult = typeof examResults.$inferSelect; 