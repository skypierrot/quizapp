import { NextResponse } from 'next/server';
import { db } from '@/db'; // Drizzle 인스턴스 가져오기
import { exams } from '@/db/schema';
import { sql, ilike, or, and } from 'drizzle-orm';
import { z } from 'zod'; // Zod 임포트
import { eq } from 'drizzle-orm'; // eq 추가

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q'); // 검색어 파라미터 'q'

    let queryBuilder = db.select().from(exams).orderBy(exams.year, exams.session, exams.title); // 기본 정렬

    if (query) {
      const searchTerm = `%${query}%`;
      // 검색어가 있으면 title, year, session(text 변환) 기준으로 필터링
      queryBuilder = queryBuilder.where( // where 를 orderBy 뒤에 사용
        or(
          ilike(exams.title, searchTerm),
          ilike(sql`CAST(${exams.year} AS TEXT)`, searchTerm),
          ilike(sql`CAST(${exams.session} AS TEXT)`, searchTerm)
        )
      );
    }

    const examList = await queryBuilder;

    return NextResponse.json(examList);
  } catch (error) {
    console.error("Error fetching exams:", error);
    return NextResponse.json({ error: 'Failed to fetch exams' }, { status: 500 });
  }
}

// POST 요청 본문 유효성 검사를 위한 Zod 스키마
const createExamSchema = z.object({
  title: z.string().min(1, "Title is required"),
  year: z.number().int().min(1900, "Invalid year"),
  subject: z.string().min(1, "Subject is required"),
  type: z.string().min(1, "Type is required"),
  session: z.number().int().min(1, "Session must be a positive integer"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = createExamSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error.errors }, { status: 400 });
    }

    const { title, year, subject, type, session } = validation.data;

    // 1. 기존 시험 정보 확인 (subject, type 조건 추가)
    const existingExam = await db.select()
      .from(exams)
      .where(and(
        eq(exams.title, title),
        eq(exams.year, year),
        eq(exams.subject, subject),
        eq(exams.type, type),
        eq(exams.session, session)
      ))
      .limit(1);

    if (existingExam.length > 0) {
      return NextResponse.json(existingExam[0]);
    }

    // 3. 새로 생성 시 subject, type 포함
    const newExam = await db.insert(exams).values({
      title,
      year,
      subject,
      type,
      session,
    }).returning();

    if (newExam.length === 0) {
      return NextResponse.json({ error: 'Failed to create exam' }, { status: 500 });
    }

    return NextResponse.json(newExam[0], { status: 201 });

  } catch (error) {
    console.error("Error creating exam:", error);
    if (error instanceof Error && 'code' in error && error.code === '23505') {
       return NextResponse.json({ error: 'Exam with this title, year, and session already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create exam' }, { status: 500 });
  }
} 