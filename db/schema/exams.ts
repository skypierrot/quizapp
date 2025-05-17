import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const exams = pgTable("exams", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  date: text("date").notNull(),
  subject: text("subject").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}); 