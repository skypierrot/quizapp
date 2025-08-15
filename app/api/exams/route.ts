import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { exams, questions } from '@/db/schema';
import { eq, and, asc, desc, sql, gt, count } from 'drizzle-orm';
import { z } from 'zod';

// 요청 본문 유효성 검사를 위한 Zod 스키마
const createExamSchema = z.object({
  name: z.string().min(1, { message: "Exam name cannot be empty" }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Date must be in YYYY-MM-DD format" }), // year -> date
  subject: z.string().min(1, { message: "Subject cannot be empty" })
});

export async function POST(request: NextRequest) {
  let data;
  try {
    data = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 });
  }

  // Zod를 사용한 유효성 검사
  const validationResult = createExamSchema.safeParse(data);
  if (!validationResult.success) {
    return NextResponse.json({ error: 'Invalid input', details: validationResult.error.flatten().fieldErrors }, { status: 400 });
  }

  const { name, date, subject } = validationResult.data; // year -> date

  try {
    console.log(`Checking for existing exam: ${name}, ${date}, ${subject}...`); // year -> date
    // 기존 시험 정보 확인
    const existingExam = await db.query.exams.findFirst({
      where: and(eq(exams.name, name), eq(exams.date, date), eq(exams.subject, subject)) // year -> date
    });

    if (existingExam) {
      console.log('Exam already exists:', existingExam);
      // 이미 존재하면 성공 응답과 함께 기존 정보 반환 (또는 단순 메시지)
      return NextResponse.json({ message: 'Exam already exists', exam: existingExam }, { status: 200 }); 
    }

    console.log(`Creating new exam: ${name}, ${date}, ${subject}...`); // year -> date
    // 새 시험 정보 삽입
    const newExam = await db.insert(exams).values({
      name,
      date, // year -> date
      subject: subject,
    }).returning();

    console.log('New exam created:', newExam[0]);
    return NextResponse.json({ message: 'Exam created successfully', exam: newExam[0] }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating exam:', error);
    return NextResponse.json(
      { error: 'Failed to create exam', details: error.message },
      { status: 500 }
    );
  }
}

// --- 추가: GET 핸들러 (시험 목록 조회) ---
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const examNameParam = url.searchParams.get("name"); // 특정 시험 이름으로 필터링하기 위한 파라미터

    console.log(`Fetching exams... Filter by name: ${examNameParam || 'None'}`);

    // 기본 쿼리: exams 테이블과 questions 테이블을 leftJoin하여 문제 수를 계산
    const query = db
      .select({
        id: exams.id,
        name: exams.name,
        date: exams.date,
        subject: exams.subject,
        createdAt: exams.createdAt,
        updatedAt: exams.updatedAt,
        questionCount: sql<number>`count(${questions.id})`.as('question_count'),
      })
      .from(exams)
      .leftJoin(questions, eq(exams.id, questions.examId))
      .groupBy(exams.id, exams.name, exams.date, exams.subject, exams.createdAt, exams.updatedAt)
      .orderBy(asc(exams.name), asc(exams.date), asc(exams.subject));

    // 동적 where 절 추가
    const conditions = [];
    if (examNameParam) {
      conditions.push(eq(exams.name, examNameParam));
    }

    // 문제 수가 0보다 큰 시험만 필터링하는 조건 추가
    // Drizzle ORM에서 having 절을 and와 함께 사용하려면サブクエリ (subquery)를 사용하거나,
    // 또는 where 절에 추가하는 방식으로 조건을 결합해야 합니다.
    // 여기서는 groupBy 이후에 필터링을 수행하기 위해, 먼저 모든 시험의 문제 수를 가져온 후 JavaScript 레벨에서 필터링합니다.
    // 또는 SQL having 절을 직접 사용합니다.
    
    let filteredExams;
    if (conditions.length > 0) {
      filteredExams = await query.where(and(...conditions)).having(gt(sql<number>`count(${questions.id})`, 0));
    } else {
      filteredExams = await query.having(gt(sql<number>`count(${questions.id})`, 0));
    }
    
    // 또는, having 절을 지원하지 않거나 복잡한 경우 JavaScript에서 필터링:
    // const allExamsWithCount = await query.where(and(...conditions)); // conditions가 있으면 적용
    // const filteredExams = allExamsWithCount.filter(exam => exam.questionCount > 0);


    console.log(`Found ${filteredExams.length} exams with questions.`);
    
    return NextResponse.json({ exams: filteredExams });

  } catch (error: any) {
    console.error('Error fetching exams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exams', details: error.message },
      { status: 500 }
    );
  }
} 