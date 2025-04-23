ALTER TABLE "exam_results" ALTER COLUMN "wrong_answers" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "options" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "tags" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "tags" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "images" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "images" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "explanation_images" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "explanation_images" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "questions_legacy" ALTER COLUMN "options" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "questions_legacy" ALTER COLUMN "tags" SET DATA TYPE jsonb;