import { pgTable, index, uuid, varchar, integer, text, jsonb, timestamp, boolean, foreignKey, unique, date, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const examResults = pgTable("exam_results", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	examName: varchar("exam_name", { length: 255 }).notNull(),
	examYear: integer("exam_year").notNull(),
	examSubject: text("exam_subject").notNull(),
	answers: jsonb().notNull(),
	score: integer().notNull(),
	correctCount: integer("correct_count").notNull(),
	totalQuestions: integer("total_questions").notNull(),
	subjectStats: jsonb("subject_stats").default({}).notNull(),
	elapsedTime: integer("elapsed_time").notNull(),
	limitTime: integer("limit_time"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("exam_details_idx").using("btree", table.examName.asc().nullsLast().op("text_ops"), table.examYear.asc().nullsLast().op("text_ops"), table.examSubject.asc().nullsLast().op("text_ops")),
	index("user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
]);

export const imageHistory = pgTable("image_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	imageId: uuid("image_id").notNull(),
	changeType: text("change_type").notNull(),
	changedBy: uuid("changed_by").notNull(),
	reason: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const noticeComments = pgTable("notice_comments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	noticeId: uuid("notice_id").notNull(),
	authorId: text("author_id").notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const notices = pgTable("notices", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: varchar({ length: 200 }).notNull(),
	content: text().notNull(),
	authorId: text("author_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	isPinned: boolean("is_pinned").default(false).notNull(),
});

export const questions = pgTable("questions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	content: text().notNull(),
	options: jsonb().notNull(),
	answer: integer().notNull(),
	explanation: text(),
	tags: jsonb().default([]),
	images: jsonb().default([]),
	explanationImages: jsonb("explanation_images").default([]),
	userId: text("user_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	examId: uuid("exam_id"),
	questionNumber: integer("question_number"),
}, (table) => [
	foreignKey({
			columns: [table.examId],
			foreignColumns: [exams.id],
			name: "questions_exam_id_exams_id_fk"
		}),
]);

export const threadComments = pgTable("thread_comments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	threadId: uuid("thread_id").notNull(),
	authorId: text("author_id").notNull(),
	content: text().notNull(),
	parentId: uuid("parent_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const threadVotes = pgTable("thread_votes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	threadId: uuid("thread_id").notNull(),
	userId: text("user_id").notNull(),
	value: integer().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const threads = pgTable("threads", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: varchar({ length: 200 }).notNull(),
	content: text().notNull(),
	category: varchar({ length: 50 }).notNull(),
	authorId: text("author_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	upvotes: integer().default(0).notNull(),
	downvotes: integer().default(0).notNull(),
});

export const userStats = pgTable("user_stats", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	totalExams: integer("total_exams").default(0).notNull(),
	totalQuestions: integer("total_questions").default(0).notNull(),
	totalCorrect: integer("total_correct").default(0).notNull(),
	averageScore: integer("average_score").default(0).notNull(),
	subjectStats: jsonb("subject_stats").default({}).notNull(),
	totalPosts: integer("total_posts").default(0).notNull(),
	totalComments: integer("total_comments").default(0).notNull(),
	lastExamAt: timestamp("last_exam_at", { withTimezone: true, mode: 'string' }),
	lastPostAt: timestamp("last_post_at", { withTimezone: true, mode: 'string' }),
	lastCommentAt: timestamp("last_comment_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("user_stats_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	unique("user_stats_user_id_unique").on(table.userId),
]);

export const userDailyStats = pgTable("user_daily_stats", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	date: date().notNull(),
	totalStudyTime: integer("total_study_time").default(0).notNull(),
	solvedCount: integer("solved_count").default(0).notNull(),
	correctCount: integer("correct_count").default(0).notNull(),
	streak: integer().default(0).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("user_date_idx").using("btree", table.userId.asc().nullsLast().op("date_ops"), table.date.asc().nullsLast().op("date_ops")),
]);

export const exams = pgTable("exams", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	date: text().notNull(),
	subject: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const questionImageUsage = pgTable("question_image_usage", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	questionId: uuid("question_id").notNull(),
	imageId: uuid("image_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.questionId],
			foreignColumns: [questions.id],
			name: "question_image_usage_question_id_questions_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.imageId],
			foreignColumns: [images.id],
			name: "question_image_usage_image_id_images_id_fk"
		}).onDelete("restrict"),
]);

export const images = pgTable("images", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	hash: text().notNull(),
	path: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("images_hash_unique").on(table.hash),
	unique("images_path_unique").on(table.path),
]);

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text(),
	email: text().notNull(),
	emailVerified: timestamp({ mode: 'string' }),
	image: text(),
	nickname: text(),
});

export const sessions = pgTable("sessions", {
	sessionToken: text().primaryKey().notNull(),
	userId: text().notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "sessions_userId_user_id_fk"
		}).onDelete("cascade"),
]);

export const verificationToken = pgTable("verificationToken", {
	identifier: text().notNull(),
	token: text().notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	primaryKey({ columns: [table.identifier, table.token], name: "verificationToken_identifier_token_pk"}),
]);

export const userQuestionMemos = pgTable("user_question_memos", {
	userId: text("user_id").notNull(),
	questionId: uuid("question_id").notNull(),
	memo: text(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "user_question_memos_user_id_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.questionId],
			foreignColumns: [questions.id],
			name: "user_question_memos_question_id_questions_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.userId, table.questionId], name: "user_question_memos_user_id_question_id_pk"}),
]);

export const account = pgTable("account", {
	userId: text().notNull(),
	type: text().notNull(),
	provider: text().notNull(),
	providerAccountId: text().notNull(),
	refreshToken: text("refresh_token"),
	accessToken: text("access_token"),
	expiresAt: integer("expires_at"),
	tokenType: text("token_type"),
	scope: text(),
	idToken: text("id_token"),
	sessionState: text("session_state"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_userId_user_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.provider, table.providerAccountId], name: "account_provider_providerAccountId_pk"}),
]);

export const userQuestionOptionMemos = pgTable("user_question_option_memos", {
	userId: text("user_id").notNull(),
	questionId: uuid("question_id").notNull(),
	optionIndex: integer("option_index").notNull(),
	memo: text(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "user_question_option_memos_user_id_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.questionId],
			foreignColumns: [questions.id],
			name: "user_question_option_memos_question_id_questions_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.userId, table.questionId, table.optionIndex], name: "user_question_option_memos_pk" }),
]);
