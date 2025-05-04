CREATE EXTENSION IF NOT EXISTS pgcrypto;--> statement-breakpoint
ALTER TABLE "exam_results" ALTER COLUMN "id" SET DATA TYPE uuid USING id::text::uuid;--> statement-breakpoint
ALTER TABLE "exam_results" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();