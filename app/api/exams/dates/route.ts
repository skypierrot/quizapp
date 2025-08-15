import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { exams } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const examName = searchParams.get('name');

  if (!examName) {
    return NextResponse.json({ error: 'Exam name is required' }, { status: 400 });
  }

  try {
    // exams 테이블에서 해당 시험명의 날짜들을 가져옴
    const datesResult = await db
      .selectDistinct({ date: exams.date })
      .from(exams)
      .where(eq(exams.name, examName))
      .orderBy(exams.date);
    
    const dates = datesResult.map(row => row.date).filter(Boolean);
    return NextResponse.json({ dates });
  } catch (error: any) {
    console.error(`Error fetching years for exam_name ${examName}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch exam years', details: error.message },
      { status: 500 }
    );
  }
}