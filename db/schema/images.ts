import { pgTable, serial, text, timestamp, integer, varchar, pgEnum } from 'drizzle-orm/pg-core';

// 이미지 상태 Enum 정의
export const imageStatusEnum = pgEnum('image_status', ['active', 'pending_deletion', 'deleted']);

export const images = pgTable('images', {
  id: serial('id').primaryKey(),
  filename: text('filename').notNull(),
  originalName: text('original_name').notNull(),
  path: text('path').notNull(),
  type: varchar('type', { length: 20 }).notNull(), // 'question', 'option', 'explanation'
  size: integer('size').notNull(),
  mimeType: varchar('mime_type', { length: 50 }).notNull(),
  questionId: integer('question_id'),
  optionId: integer('option_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  status: text('status').default('active'), // 'active' | 'pending_deletion' | 'deleted'
  lastCheckedAt: timestamp('last_checked_at').defaultNow(),
}); 