import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { exams } from '@/db/schema';
import { eq, and, asc, desc } from 'drizzle-orm';
import { z } from 'zod';

// 요청 본문 유효성 검사를 위한 Zod 스키마
const createExamSchema = z.object({
  name: z.string().min(1, { message: "Exam name cannot be empty" }),
  year: z.number().int().gte(1900).lte(new Date().getFullYear() + 1, { message: "Invalid year" }),
  round: z.string().min(1, { message: "Round cannot be empty" }) // 회차는 문자열로 처리 (e.g., "1", "실기")
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

  const { name, year, round } = validationResult.data;

  try {
    console.log(`Checking for existing exam: ${name}, ${year}, ${round}...`);
    // 기존 시험 정보 확인
    const existingExam = await db.query.exams.findFirst({
      where: and(eq(exams.name, name), eq(exams.year, year), eq(exams.round, parseInt(round, 10))) // round는 DB 타입에 맞게 변환
    });

    if (existingExam) {
      console.log('Exam already exists:', existingExam);
      // 이미 존재하면 성공 응답과 함께 기존 정보 반환 (또는 단순 메시지)
      return NextResponse.json({ message: 'Exam already exists', exam: existingExam }, { status: 200 }); 
    }

    console.log(`Creating new exam: ${name}, ${year}, ${round}...`);
    // 새 시험 정보 삽입
    const newExam = await db.insert(exams).values({
      name,
      year,
      round: parseInt(round, 10), // DB 타입에 맞게 변환
      // createdAt, updatedAt은 default 값 사용
    }).returning(); // 삽입된 레코드 반환

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
export async function GET() {
  try {
    console.log('Fetching all exams...');
    const allExams = await db
      .select()
      .from(exams)
      .orderBy(asc(exams.name), asc(exams.year), asc(exams.round)); // 이름, 년도, 회차순 정렬

    console.log(`Found ${allExams.length} exams.`);
    
    // 필요시 페이지네이션 로직 추가 가능

    return NextResponse.json({ exams: allExams });

  } catch (error: any) {
    console.error('Error fetching exams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exams', details: error.message },
      { status: 500 }
    );
  }
} 