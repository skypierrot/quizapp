import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { questions } from '@/db/schema/questions';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const examName = searchParams.get('name');

  if (!examName) {
    return NextResponse.json({ error: 'Exam name is required' }, { status: 400 });
  }

  try {
    // date 전체를 distinct로 반환 (YYYY-MM-DD)
    const datesResult = await db.execute(
      sql`SELECT DISTINCT date FROM ${questions} WHERE exam_name = ${examName} AND date IS NOT NULL ORDER BY date ASC`
    );
    let rows: any[] = Array.isArray(datesResult) ? datesResult : (datesResult?.rows || []);
    const dates = rows.map((row: any) => String(row.date)).filter(Boolean);
    return NextResponse.json({ dates });
  } catch (error: any) {
    console.error(`Error fetching years for exam_name ${examName}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch exam years', details: error.message },
      { status: 500 }
    );
  }
}