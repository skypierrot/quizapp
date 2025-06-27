CREATE TABLE "user_question_flags" (
	"user_id" text NOT NULL,
	"question_id" uuid NOT NULL,
	"is_bookmarked" boolean DEFAULT false,
	"is_important" boolean DEFAULT false,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_question_flags_user_id_question_id_pk" PRIMARY KEY("user_id","question_id")
);
--> statement-breakpoint
CREATE TABLE "user_question_review_status" (
	"user_id" text NOT NULL,
	"question_id" uuid NOT NULL,
	"review_status" integer DEFAULT 0 NOT NULL,
	"last_reviewed_at" timestamp with time zone,
	"next_review_date" timestamp with time zone,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"correct_retry_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_question_review_status_user_id_question_id_pk" PRIMARY KEY("user_id","question_id")
);
--> statement-breakpoint
ALTER TABLE "exam_results" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user_stats" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user_question_flags" ADD CONSTRAINT "user_question_flags_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_question_flags" ADD CONSTRAINT "user_question_flags_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_question_review_status" ADD CONSTRAINT "user_question_review_status_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_question_review_status" ADD CONSTRAINT "user_question_review_status_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;