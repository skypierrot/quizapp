-- 이미지 상태 ENUM 생성
DO $$ BEGIN
 CREATE TYPE "image_status" AS ENUM('active', 'pending_deletion', 'deleted');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- 이미지 테이블 생성
CREATE TABLE IF NOT EXISTS "images" (
	"id" serial PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"original_name" text NOT NULL,
	"path" text NOT NULL,
	"type" varchar(20) NOT NULL,
	"size" integer NOT NULL,
	"mime_type" varchar(50) NOT NULL,
	"question_id" integer,
	"option_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"status" "image_status" DEFAULT 'active' NOT NULL
); 