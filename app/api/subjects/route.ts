import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { exams } from '@/db/schema';
import { sql, eq, and } from 'drizzle-orm';

// GET: 과목 목록 조회 (exams 테이블에서 subject 컬럼 사용)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const examName = url.searchParams.get('examName');

    if (!examName) {
      return NextResponse.json({ error: '시험명은 필수 파라미터입니다.' }, { status: 400 });
    }

    // Drizzle ORM을 사용하여 쿼리
    const subjectList = await db
      .selectDistinct({ subject: exams.subject })
      .from(exams)
      .where(eq(exams.name, examName))
      .orderBy(exams.subject)
      .execute();

    const uniqueSubjects = subjectList.map(item => item.subject);
    
    console.log(`Returning subjects for ${examName}:`, uniqueSubjects);
    return NextResponse.json({ subjects: uniqueSubjects });

  } catch (error: any) {
    console.error('과목 목록 조회 중 오류 발생:', error);
    return NextResponse.json({ error: '과목 목록 조회 중 서버 오류 발생', details: error.message }, { status: 500 });
  }
}

// POST 핸들러는 useCascadingTags에서 POST /api/exams로 통합되었으므로 주석 처리 또는 삭제
/*
export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: '과목명을 입력하세요.' }, { status: 400 });
    }
    // 실제로는 subject 테이블에 저장해야 함. 임시로 questions에 더미 데이터 추가
    // tags 필드가 jsonb 배열이므로, 문자열 배열을 그대로 사용 가능
    await db.insert(questions).values({
      content: '[과목 등록용 더미]',
      options: [],
      answer: 0,
      tags: [`과목:${name}`],
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('과목 추가 실패:', error);
    return NextResponse.json({ error: '과목 추가 실패', details: error.message }, { status: 500 });
  }
} 
*/ 