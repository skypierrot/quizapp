import {
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core";
import { users } from "./index";

// 문제 테이블 정의
export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  // 문제 내용
  content: text("content").notNull(),
  // 선택지 (표준 jsonb 사용)
  options: jsonb("options").$type<string[]>().notNull(),
  // 정답 (인덱스 번호)
  answer: integer("answer").notNull(),
  // 해설
  explanation: text("explanation"),
  // 태그 (표준 jsonb 사용)
  tags: jsonb("tags").$type<string[]>().default([]),
  // 문제 이미지 URL (표준 jsonb 사용)
  images: jsonb("images").$type<string[]>().default([]),
  // 해설 이미지 URL (표준 jsonb 사용)
  explanationImages: jsonb("explanation_images").$type<string[]>().default([]),
  // 생성자 (uuid에서 text로 변경)
  userId: text("user_id"),
  // 타임스탬프
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 관계 정의 (필요시 추가)
export const relations = {
  // 나중에 다른 테이블과의 관계를 추가할 수 있음
}; 