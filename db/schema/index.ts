import {
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
  json,
  uuid,
} from "drizzle-orm/pg-core";

import { images, imageStatusEnum } from "./images";
// 새로 생성한 questions 스키마 모듈을 가져옵니다.
import { questions as questionTable } from "./questions";

// 미리 정의된 images 테이블 re-export
export { images, imageStatusEnum };

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

// 이미지 히스토리 테이블
export const imageHistory = pgTable("image_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  imageId: integer("image_id").notNull().references(() => images.id),
  changeType: text("change_type").notNull(), // 'create', 'update', 'delete_request', 'restore'
  changedBy: uuid("changed_by").notNull().references(() => users.id),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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

// 옵션 타입 정의
export type QuestionOption = {
  text: string;
  image?: string;
};

// 태그 타입 정의
export type QuestionTag = {
  year: string;
  subject: string;
  type: string;
};

// 기존 문제 스키마 (이전 버전과의 호환성을 위해 유지)
export const questionsLegacy = pgTable("questions_legacy", {
  id: uuid("id").primaryKey().defaultRandom(),
  examId: uuid("exam_id").references(() => exams.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  // 문제 이미지 URL
  contentImage: text("content_image"),
  // 선택지 (복잡한 구조를 위해 수정)
  options: json("options").$type<QuestionOption[]>().notNull(),
  answer: integer("answer").notNull(),
  explanation: text("explanation"),
  // 해설 이미지 URL
  explanationImage: text("explanation_image"),
  // 문제 이미지 URL
  imageUrl: text("image_url"),
  // 태그 (구조화된 데이터로 수정)
  tags: json("tags").$type<QuestionTag>().notNull(),
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

// 새 문제 테이블 내보내기
export const questions = questionTable; 