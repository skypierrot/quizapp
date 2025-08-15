import { pgTable, uuid, text, varchar, timestamp, integer, boolean } from 'drizzle-orm/pg-core';

export const threads = pgTable('threads', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content').notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  tags: text('tags'), // JSON 배열로 태그 저장
  authorId: text('author_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  upvotes: integer('upvotes').notNull().default(0),
  downvotes: integer('downvotes').notNull().default(0),
  viewCount: integer('view_count').notNull().default(0),
  commentCount: integer('comment_count').notNull().default(0),
  isPinned: boolean('is_pinned').notNull().default(false),
  isClosed: boolean('is_closed').notNull().default(false),
  isReported: boolean('is_reported').notNull().default(false),
});

export const threadComments = pgTable('thread_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  threadId: uuid('thread_id').notNull(),
  authorId: text('author_id').notNull(),
  content: text('content').notNull(),
  parentId: uuid('parent_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  isReported: boolean('is_reported').notNull().default(false),
});

export const threadVotes = pgTable('thread_votes', {
  id: uuid('id').primaryKey().defaultRandom(),
  threadId: uuid('thread_id').notNull(),
  userId: text('user_id').notNull(),
  value: integer('value').notNull(), // 1: up, -1: down
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 태그 테이블 추가
export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  description: text('description'),
  color: varchar('color', { length: 7 }).default('#3B82F6'), // hex color
  usageCount: integer('usage_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 게시글-태그 관계 테이블
export const threadTags = pgTable('thread_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  threadId: uuid('thread_id').notNull(),
  tagId: uuid('tag_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 북마크 테이블
export const threadBookmarks = pgTable('thread_bookmarks', {
  id: uuid('id').primaryKey().defaultRandom(),
  threadId: uuid('thread_id').notNull(),
  userId: text('user_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 신고 테이블
export const threadReports = pgTable('thread_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  threadId: uuid('thread_id'),
  commentId: uuid('comment_id'),
  reporterId: text('reporter_id').notNull(),
  reason: varchar('reason', { length: 100 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, resolved, dismissed
  createdAt: timestamp('created_at').notNull().defaultNow(),
}); 