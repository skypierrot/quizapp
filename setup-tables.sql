-- users 테이블 생성 (Clerk 인증 연동)
CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "clerk_id" text UNIQUE,
  "name" text NOT NULL,
  "email" text UNIQUE NOT NULL,
  "image" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- tags 테이블 생성
CREATE TABLE IF NOT EXISTS "tags" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "category" text NOT NULL, -- 'year', 'subject', 'type' 등
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- questions 테이블 생성
CREATE TABLE IF NOT EXISTS "questions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "content" text NOT NULL,
  "options" jsonb NOT NULL, -- 선택지 배열
  "answer" integer NOT NULL, -- 정답 인덱스
  "explanation" text,
  "images" jsonb DEFAULT '[]', -- 문제 이미지 URL 배열
  "explanation_images" jsonb DEFAULT '[]', -- 해설 이미지 URL 배열
  "user_id" uuid REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- question_tags 관계 테이블 생성 (다대다 관계)
CREATE TABLE IF NOT EXISTS "question_tags" (
  "question_id" uuid REFERENCES "questions"("id") ON DELETE CASCADE,
  "tag_id" uuid REFERENCES "tags"("id") ON DELETE CASCADE,
  PRIMARY KEY ("question_id", "tag_id"),
  "created_at" timestamp DEFAULT now() NOT NULL
); 