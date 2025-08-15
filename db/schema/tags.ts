import { pgTable, uuid, text } from "drizzle-orm/pg-core";
import { questions } from "./questions";

export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(),   // examName, date, subject, round 등
  value: text("value").notNull(),
});

export const questionTags = pgTable("question_tags", {
  questionId: uuid("question_id").notNull().references(() => questions.id),
  tagId: uuid("tag_id").notNull().references(() => tags.id),
}); 