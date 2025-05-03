import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const images = pgTable('images', {
  id: uuid('id').defaultRandom().primaryKey(),
  hash: text('hash').notNull().unique(),
  path: text('path').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Image = typeof images.$inferSelect;
export type NewImage = typeof images.$inferInsert; 