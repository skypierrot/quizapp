import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { exams } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');
  const yearParam = searchParams.get('year');

  if (!name) {
    return NextResponse.json({ error: 'Exam name is required' }, { status: 400 });
  }
  if (!yearParam) {
    return NextResponse.json({ error: 'Year is required' }, { status: 400 });
  }

  const year = parseInt(yearParam, 10);
  if (isNaN(year)) {
    return NextResponse.json({ error: 'Invalid year format' }, { status: 400 });
  }

  try {
    console.log(`Fetching distinct rounds for exam: ${name}, year: ${year}...`);
    
    // date 필드에서 해당 연도의 시험 날짜들을 가져와서 회차 계산
    const roundsResult = await db
      .select({ date: exams.date })
      .from(exams)
      .where(and(
        eq(exams.name, name), 
        sql`EXTRACT(YEAR FROM ${exams.date}::date) = ${year}`
      ))
      .orderBy(exams.date);

    // 날짜 순서대로 회차 번호 생성 (1회차, 2회차, ...)
    const rounds = roundsResult.map((_, index) => String(index + 1)); 
    console.log(`Found rounds for ${name} (${year}):`, rounds);
    
    return NextResponse.json({ rounds });

  } catch (error: any) {
    console.error(`Error fetching rounds for exam ${name} (${year}):`, error);
    return NextResponse.json(
      { error: 'Failed to fetch exam rounds', details: error.message },
      { status: 500 }
    );
  }
} 