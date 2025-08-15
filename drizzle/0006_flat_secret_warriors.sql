CREATE TABLE "global_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stat_type" text DEFAULT 'summary' NOT NULL,
	"total_users" integer DEFAULT 0 NOT NULL,
	"avg_study_time" integer DEFAULT 0 NOT NULL,
	"avg_solved_count" integer DEFAULT 0 NOT NULL,
	"avg_correct_rate" real DEFAULT 0 NOT NULL,
	"avg_streak" integer DEFAULT 0 NOT NULL,
	"total_study_time" integer DEFAULT 0 NOT NULL,
	"total_solved_count" integer DEFAULT 0 NOT NULL,
	"total_correct_count" integer DEFAULT 0 NOT NULL,
	"total_streak" integer DEFAULT 0 NOT NULL,
	"last_updated" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_exam_favorites" (
	"user_id" text NOT NULL,
	"exam_name" text NOT NULL,
	"is_favorite" boolean DEFAULT true,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_exam_favorites_user_id_exam_name_pk" PRIMARY KEY("user_id","exam_name")
);
--> statement-breakpoint
ALTER TABLE "user_exam_favorites" ADD CONSTRAINT "user_exam_favorites_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;