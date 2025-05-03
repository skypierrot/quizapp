import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { questions } from '@/db/schema';
import { sql } from 'drizzle-orm';

// GET: 과목 목록 조회 (questions.tags에서 과목명 추출)
export async function GET() {
  try {
    console.log('Attempting to fetch subjects...');
    // 쿼리 실행 (jsonb 타입에 맞게 수정)
    const result = await db.execute(
      sql`SELECT DISTINCT jsonb_array_elements_text(tags) as tag FROM ${questions} WHERE jsonb_typeof(tags) = 'array'`
    );
    console.log('DB query result:', result);

    // result가 배열인지, rows 프로퍼티가 있는지 확인 후 파싱
    let rows: any[] = [];
    if (Array.isArray(result)) {
      rows = result;
    } else if (result && 'rows' in result && Array.isArray((result as any).rows)) {
      rows = (result as any).rows;
    } else {
      console.warn('Unexpected DB result structure:', result);
    }

    console.log('Parsed rows:', rows);

    // tag 추출 및 필터링
    const subjects = rows
      .map((row: any) => row.tag)
      .filter((tag: any) => typeof tag === 'string' && tag.startsWith('과목:'))
      .map((tag: string) => tag.replace('과목:', ''));

    // 중복 제거
    const uniqueSubjects = Array.from(new Set(subjects));
    console.log('Returning subjects:', uniqueSubjects);
    return NextResponse.json({ subjects: uniqueSubjects });

  } catch (error: any) {
    // 상세 에러 로그 추가
    console.error('과목 목록 조회 중 오류 발생:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ error: '과목 목록 조회 중 서버 오류 발생', details: error.message }, { status: 500 });
  }
}

// POST: 새 과목 추가 (questions 테이블에 더미 데이터로 추가, 실제로는 별도 subject 테이블 필요)
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