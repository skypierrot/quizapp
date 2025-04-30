import { NextRequest, NextResponse } from 'next/server';
import { saveQuestions } from '@/db/saveQuestions';

export async function POST(req: NextRequest) {
  try {
    const questions = await req.json();
    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: '저장할 문제가 없습니다.' }, { status: 400 });
    }
    const result = await saveQuestions(questions);
    return NextResponse.json({ ok: true, result }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '저장 중 오류 발생' }, { status: 500 });
  }
} 