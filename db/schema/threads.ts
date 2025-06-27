import { pgTable, uuid, text, varchar, timestamp, integer } from 'drizzle-orm/pg-core';

export const threads = pgTable('threads', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content').notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  authorId: text('author_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  upvotes: integer('upvotes').notNull().default(0),
  downvotes: integer('downvotes').notNull().default(0),
});

export const threadComments = pgTable('thread_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  threadId: uuid('thread_id').notNull(),
  authorId: text('author_id').notNull(),
  content: text('content').notNull(),
  parentId: uuid('parent_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const threadVotes = pgTable('thread_votes', {
  id: uuid('id').primaryKey().defaultRandom(),
  threadId: uuid('thread_id').notNull(),
  userId: text('user_id').notNull(),
  value: integer('value').notNull(), // 1: up, -1: down
  createdAt: timestamp('created_at').notNull().defaultNow(),
}); 