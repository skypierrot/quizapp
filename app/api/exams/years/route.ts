import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { exams } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');

  if (!name) {
    return NextResponse.json({ error: 'Exam name is required' }, { status: 400 });
  }

  try {
    console.log(`Fetching distinct years for exam name: ${name}...`);
    const yearsResult = await db
      .selectDistinct({ year: exams.year })
      .from(exams)
      .where(eq(exams.name, name))
      .orderBy(exams.year); // 년도순 정렬 (선택 사항)

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