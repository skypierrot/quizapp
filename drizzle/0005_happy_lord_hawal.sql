CREATE TABLE "statistics_summary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"exam_count" integer DEFAULT 0 NOT NULL,
	"total_questions" integer DEFAULT 0 NOT NULL,
	"correct_questions" integer DEFAULT 0 NOT NULL,
	"study_time_seconds" integer DEFAULT 0 NOT NULL,
	"subject_stats" text DEFAULT '{}' NOT NULL,
	"streak" integer DEFAULT 0 NOT NULL,
	"last_updated" timestamp with time zone DEFAULT now() NOT NULL,
	"is_processed" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "stats_user_date_idx" ON "statistics_summary" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "stats_date_idx" ON "statistics_summary" USING btree ("date");