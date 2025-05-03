import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { questions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: { questionId: string } }
) {
  try {
    const { questionId } = params;
    const { explanation } = await request.json();

    // 유효성 검사
    if (!explanation || typeof explanation !== 'string') {
      return NextResponse.json({ error: '유효한 해설 내용이 필요합니다.' }, { status: 400 });
    }

    // 문제 존재 확인
    const questionExists = await db.select()
      .from(questions)
      .where(eq(questions.id, questionId))
      .limit(1);
    
    if (questionExists.length === 0) {
      return NextResponse.json({ error: '존재하지 않는 문제입니다.' }, { status: 404 });
    }

    // DB 업데이트
    const [updatedQuestion] = await db
      .update(questions)
      .set({ 
        explanation,
        updatedAt: new Date()
      })
      .where(eq(questions.id, questionId))
      .returning();

    return NextResponse.json({ 
      success: true, 
      message: '해설이 추가되었습니다.',
      question: updatedQuestion
    });
    
  } catch (error) {
    console.error('해설 추가 중 오류 발생:', error);
    return NextResponse.json({ error: '해설 추가 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 