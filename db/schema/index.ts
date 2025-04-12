import {
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
  json,
  uuid,
} from "drizzle-orm/pg-core";

// 사용자 테이블
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 시험 테이블
export const exams = pgTable("exams", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  year: integer("year").notNull(),
  subject: text("subject").notNull(),
  type: text("type").notNull(),
  session: integer("session").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 문제 테이블
export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  examId: uuid("exam_id").references(() => exams.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  options: json("options").$type<string[]>().notNull(),
  answer: integer("answer").notNull(),
  explanation: text("explanation"),
  imageUrl: text("image_url"),
  tags: json("tags").$type<string[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 시험 결과 테이블
export const examResults = pgTable("exam_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  examId: uuid("exam_id").references(() => exams.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  wrongAnswers: json("wrong_answers").$type<number[]>().notNull(),
  completedAt: timestamp("completed_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}); 