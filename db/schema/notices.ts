import { pgTable, uuid, text, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';

export const notices = pgTable('notices', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content').notNull(),
  authorId: text('author_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  isPinned: boolean('is_pinned').notNull().default(false),
});

export const noticeComments = pgTable('notice_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  noticeId: uuid('notice_id').notNull(),
  authorId: text('author_id').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
}); 