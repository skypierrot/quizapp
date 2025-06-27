import { relations } from "drizzle-orm/relations";
import { exams, questions, questionImageUsage, images, user, sessions, userQuestionMemos, account } from "./schema";

export const questionsRelations = relations(questions, ({one, many}) => ({
	exam: one(exams, {
		fields: [questions.examId],
		references: [exams.id]
	}),
	questionImageUsages: many(questionImageUsage),
	userQuestionMemos: many(userQuestionMemos),
}));

export const examsRelations = relations(exams, ({many}) => ({
	questions: many(questions),
}));

export const questionImageUsageRelations = relations(questionImageUsage, ({one}) => ({
	question: one(questions, {
		fields: [questionImageUsage.questionId],
		references: [questions.id]
	}),
	image: one(images, {
		fields: [questionImageUsage.imageId],
		references: [images.id]
	}),
}));

export const imagesRelations = relations(images, ({many}) => ({
	questionImageUsages: many(questionImageUsage),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(user, {
		fields: [sessions.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	sessions: many(sessions),
	userQuestionMemos: many(userQuestionMemos),
	accounts: many(account),
}));

export const userQuestionMemosRelations = relations(userQuestionMemos, ({one}) => ({
	user: one(user, {
		fields: [userQuestionMemos.userId],
		references: [user.id]
	}),
	question: one(questions, {
		fields: [userQuestionMemos.questionId],
		references: [questions.id]
	}),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));