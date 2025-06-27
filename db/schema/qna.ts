import { pgTable, uuid, text, varchar, timestamp, integer, boolean } from 'drizzle-orm/pg-core';

// Q&A 질문
export const qnaQuestions = pgTable('qna_questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content').notNull(),
  examCategory: varchar('exam_category', { length: 50 }).notNull(),
  subject: varchar('subject', { length: 50 }),
  difficulty: varchar('difficulty', { length: 20 }), // easy, medium, hard
  tags: text('tags'), // JSON 배열
  authorId: text('author_id').notNull(),
  viewCount: integer('view_count').notNull().default(0),
  upvotes: integer('upvotes').notNull().default(0),
  downvotes: integer('downvotes').notNull().default(0),
  isResolved: boolean('is_resolved').notNull().default(false),
  bestAnswerId: uuid('best_answer_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Q&A 답변
export const qnaAnswers = pgTable('qna_answers', {
  id: uuid('id').primaryKey().defaultRandom(),
  questionId: uuid('question_id').notNull(),
  content: text('content').notNull(),
  authorId: text('author_id').notNull(),
  upvotes: integer('upvotes').notNull().default(0),
  downvotes: integer('downvotes').notNull().default(0),
  isBestAnswer: boolean('is_best_answer').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Q&A 투표
export const qnaVotes = pgTable('qna_votes', {
  id: uuid('id').primaryKey().defaultRandom(),
  targetId: uuid('target_id').notNull(), // question_id 또는 answer_id
  targetType: varchar('target_type', { length: 20 }).notNull(), // question, answer
  userId: text('user_id').notNull(),
  value: integer('value').notNull(), // 1: upvote, -1: downvote
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Q&A 댓글
export const qnaComments = pgTable('qna_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  targetId: uuid('target_id').notNull(), // question_id 또는 answer_id
  targetType: varchar('target_type', { length: 20 }).notNull(), // question, answer
  content: text('content').notNull(),
  authorId: text('author_id').notNull(),
  parentId: uuid('parent_id'), // 대댓글용
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}); 