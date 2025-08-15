-- 북마크/중요 플래그 테이블
CREATE TABLE IF NOT EXISTS "user_question_flags" (
  "user_id" TEXT NOT NULL,
  "question_id" UUID NOT NULL,
  "is_bookmarked" BOOLEAN DEFAULT false,
  "is_important" BOOLEAN DEFAULT false,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT "user_question_flags_pkey" PRIMARY KEY ("user_id", "question_id"),
  CONSTRAINT "user_question_flags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE,
  CONSTRAINT "user_question_flags_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE
);

-- 복습 상태 테이블
CREATE TABLE IF NOT EXISTS "user_question_review_status" (
  "user_id" TEXT NOT NULL,
  "question_id" UUID NOT NULL,
  "review_status" INTEGER DEFAULT 0 NOT NULL,
  "last_reviewed_at" TIMESTAMP WITH TIME ZONE,
  "next_review_date" TIMESTAMP WITH TIME ZONE,
  "retry_count" INTEGER DEFAULT 0 NOT NULL,
  "correct_retry_count" INTEGER DEFAULT 0 NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT "user_question_review_status_pkey" PRIMARY KEY ("user_id", "question_id"),
  CONSTRAINT "user_question_review_status_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE,
  CONSTRAINT "user_question_review_status_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE
); 