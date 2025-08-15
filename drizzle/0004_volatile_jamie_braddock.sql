CREATE TABLE "user_question_option_memos" (
	"user_id" text NOT NULL,
	"question_id" uuid NOT NULL,
	"option_index" integer NOT NULL,
	"memo" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_question_option_memos_user_id_question_id_option_index_pk" PRIMARY KEY("user_id","question_id","option_index")
);
--> statement-breakpoint
ALTER TABLE "user_question_option_memos" ADD CONSTRAINT "user_question_option_memos_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_question_option_memos" ADD CONSTRAINT "user_question_option_memos_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;