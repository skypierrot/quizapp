CREATE TABLE "user_exam_favorites" (
	"user_id" text NOT NULL,
	"exam_name" text NOT NULL,
	"is_favorite" boolean DEFAULT true,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_exam_favorites_user_id_exam_name_pk" PRIMARY KEY("user_id","exam_name")
);
--> statement-breakpoint
ALTER TABLE "user_exam_favorites" ADD CONSTRAINT "user_exam_favorites_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;