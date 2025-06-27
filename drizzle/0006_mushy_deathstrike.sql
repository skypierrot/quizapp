ALTER TABLE "statistics_summary" ADD COLUMN "exam_id" text;--> statement-breakpoint
ALTER TABLE "statistics_summary" ADD COLUMN "exam_name" text;--> statement-breakpoint
CREATE UNIQUE INDEX "stats_user_date_exam_idx" ON "statistics_summary" USING btree ("user_id","date","exam_id");