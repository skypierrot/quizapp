import { NextResponse } from 'next/server';
import { db } from '@/db'; // DB 인스턴스 경로 확인
import { exams } from '@/db/schema'; // 스키마 경로 확인

export async function GET() {
  try {
    console.log('Fetching distinct exam names...');
    const examNamesResult = await db
      .selectDistinct({ name: exams.name })
      .from(exams)
      .orderBy(exams.name); // 이름순 정렬 (선택 사항)

    const names = examNamesResult.map(item => item.name);
    console.log('Found exam names:', names);
    
    return NextResponse.json({ names });

  } catch (error: any) {
    console.error('Error fetching exam names:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exam names', details: error.message },
      { status: 500 }
    );
  }
} 