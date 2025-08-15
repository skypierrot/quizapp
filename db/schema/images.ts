import { pgTable, text, timestamp, uuid, pgEnum } from 'drizzle-orm/pg-core';

// 이미지 상태 enum 정의
export const imageStatusEnum = pgEnum('image_status', ['active', 'deleted']);

export const images = pgTable('images', {
  id: uuid('id').defaultRandom().primaryKey(),
  hash: text('hash').notNull().unique(),
  path: text('path').notNull().unique(),
  status: imageStatusEnum('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Image = typeof images.$inferSelect;
export type NewImage = typeof images.$inferInsert; 