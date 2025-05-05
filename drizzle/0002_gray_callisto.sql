ALTER TABLE "users" DROP CONSTRAINT "users_clerk_id_unique";--> statement-breakpoint
ALTER TABLE "exam_results" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "clerk_id";