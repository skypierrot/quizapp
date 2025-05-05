import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import { questions } from './questions' // questions 스키마 import
import { images } from './images' // images 스키마 import
import { users } from './auth'

// Define the join table for many-to-many relationship between questions and images
export const questionImageUsage = pgTable('question_image_usage', {
  id: uuid('id').defaultRandom().primaryKey(),
  questionId: uuid('question_id')
    .notNull()
    .references(() => questions.id, { onDelete: 'cascade' }), // Delete usage record if question is deleted
  imageId: uuid('image_id')
    .notNull()
    .references(() => images.id, { onDelete: 'restrict' }), // Prevent image deletion if still in use
  // location: text('location'), // Optional: 'body', 'choice_0' etc. Can be added later if needed.
  createdAt: timestamp('created_at', { withTimezone: true }) // Use withTimezone for consistency
    .defaultNow()
    .notNull(),
})

// Define types for TypeScript usage (optional but recommended)
export type QuestionImageUsage = typeof questionImageUsage.$inferSelect
export type NewQuestionImageUsage = typeof questionImageUsage.$inferInsert

// Note: Relations for this join table are typically defined in the related tables'
//       schema files (questions.ts and images.ts) if needed for querying convenience. 