import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { exams } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');

  if (!name) {
    return NextResponse.json({ error: 'Exam name is required' }, { status: 400 });
  }

  try {
    console.log(`Fetching distinct years for exam name: ${name}...`);
    
    // date 필드에서 연도 추출
    const yearsResult = await db
      .selectDistinct({ 
        year: sql<string>`EXTRACT(YEAR FROM ${exams.date}::date)` 
      })
      .from(exams)
      .where(eq(exams.name, name))
      .orderBy(sql`EXTRACT(YEAR FROM ${exams.date}::date) DESC`);

    // 년도를 문자열로 변환하여 반환 (Combobox에서 문자열 값을 주로 사용)
    const years = yearsResult.map(item => String(item.year)); 
    console.log(`Found years for ${name}:`, years);
    
    return NextResponse.json({ years });

  } catch (error: any) {
    console.error(`Error fetching years for exam name ${name}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch exam years', details: error.message },
      { status: 500 }
    );
  }
} 