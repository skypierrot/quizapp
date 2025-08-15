import { NextRequest, NextResponse } from 'next/server';
import { saveQuestions } from '@/db/saveQuestions';

export async function POST(req: NextRequest) {
  try {
    // FormData 파싱
    const formData = await req.formData();
    const questionsRaw = formData.get('questions') as string;

    if (!questionsRaw) {
      return NextResponse.json({ error: 'questions 데이터가 없습니다.' }, { status: 400 });
    }

    // JSON 파싱
    let questions;
    try {
      questions = JSON.parse(questionsRaw);
    } catch (e) {
      return NextResponse.json({ error: 'questions 데이터 파싱 오류' }, { status: 400 });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: '저장할 문제가 없습니다.' }, { status: 400 });
    }

    const result = await saveQuestions(questions);
    return NextResponse.json({ ok: true, result }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '저장 중 오류 발생' }, { status: 500 });
  }
} 