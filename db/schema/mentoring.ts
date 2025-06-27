import { pgTable, uuid, text, varchar, timestamp, integer, boolean, decimal } from 'drizzle-orm/pg-core';

// 멘토 프로필
export const mentorProfiles = pgTable('mentor_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().unique(),
  bio: text('bio').notNull(),
  expertise: text('expertise').notNull(), // JSON 배열 - 전문 분야
  experience: text('experience'), // 경력 사항
  certifications: text('certifications'), // JSON 배열 - 보유 자격증
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0.00'),
  totalReviews: integer('total_reviews').notNull().default(0),
  hourlyRate: integer('hourly_rate'), // 시간당 요금 (원)
  isActive: boolean('is_active').notNull().default(true),
  isVerified: boolean('is_verified').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 멘토링 세션
export const mentoringSessions = pgTable('mentoring_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  mentorId: text('mentor_id').notNull(),
  menteeId: text('mentee_id').notNull(),
  title: varchar('title', { length: 100 }).notNull(),
  description: text('description'),
  examCategory: varchar('exam_category', { length: 50 }).notNull(),
  sessionType: varchar('session_type', { length: 20 }).notNull(), // one-time, recurring
  scheduledAt: timestamp('scheduled_at').notNull(),
  duration: integer('duration').notNull(), // 분 단위
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, confirmed, completed, cancelled
  meetingLink: varchar('meeting_link', { length: 500 }),
  notes: text('notes'), // 세션 노트
  fee: integer('fee'), // 세션 비용
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 멘토링 리뷰
export const mentoringReviews = pgTable('mentoring_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull(),
  mentorId: text('mentor_id').notNull(),
  menteeId: text('mentee_id').notNull(),
  rating: integer('rating').notNull(), // 1-5점
  comment: text('comment'),
  isPublic: boolean('is_public').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 멘토링 신청
export const mentoringRequests = pgTable('mentoring_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  mentorId: text('mentor_id').notNull(),
  menteeId: text('mentee_id').notNull(),
  subject: varchar('subject', { length: 200 }).notNull(),
  message: text('message').notNull(),
  examCategory: varchar('exam_category', { length: 50 }).notNull(),
  preferredDate: timestamp('preferred_date'),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, accepted, rejected
  responseMessage: text('response_message'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}); 