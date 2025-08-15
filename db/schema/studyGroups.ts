import { pgTable, uuid, text, varchar, timestamp, integer, boolean } from 'drizzle-orm/pg-core';

// 스터디 그룹
export const studyGroups = pgTable('study_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  examCategory: varchar('exam_category', { length: 50 }).notNull(), // 시험 카테고리
  maxMembers: integer('max_members').notNull().default(10),
  currentMembers: integer('current_members').notNull().default(1),
  leaderId: text('leader_id').notNull(), // 그룹장
  status: varchar('status', { length: 20 }).notNull().default('recruiting'), // recruiting, active, completed
  targetDate: timestamp('target_date'), // 목표 시험일
  studySchedule: text('study_schedule'), // 학습 일정 (JSON 형태)
  isPublic: boolean('is_public').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 스터디 그룹 멤버
export const studyGroupMembers = pgTable('study_group_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull(),
  userId: text('user_id').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'), // leader, member
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('active'), // active, inactive, left
});

// 스터디 그룹 게시판
export const studyGroupPosts = pgTable('study_group_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull(),
  authorId: text('author_id').notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content').notNull(),
  postType: varchar('post_type', { length: 20 }).notNull().default('general'), // general, question, resource, schedule
  isPinned: boolean('is_pinned').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 스터디 그룹 일정
export const studyGroupSchedules = pgTable('study_group_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull(),
  title: varchar('title', { length: 100 }).notNull(),
  description: text('description'),
  scheduleDate: timestamp('schedule_date').notNull(),
  duration: integer('duration'), // 분 단위
  location: varchar('location', { length: 200 }), // 온라인/오프라인 장소
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 스터디 그룹 참석 현황
export const studyGroupAttendance = pgTable('study_group_attendance', {
  id: uuid('id').primaryKey().defaultRandom(),
  scheduleId: uuid('schedule_id').notNull(),
  userId: text('user_id').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, attended, absent, late
  createdAt: timestamp('created_at').notNull().defaultNow(),
}); 