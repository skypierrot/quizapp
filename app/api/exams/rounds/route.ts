import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { exams } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

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
    const roundsResult = await db
      .selectDistinct({ round: exams.round })
      .from(exams)
      .where(and(eq(exams.name, name), eq(exams.year, year)))
      .orderBy(exams.round); // 회차순 정렬 (선택 사항)

    // 회차를 문자열로 변환하여 반환 (Combobox에서 문자열 값을 주로 사용)
    const rounds = roundsResult.map(item => String(item.round)); 
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