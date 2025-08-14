import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { examResults } from '@/db/schema/examResults';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { resultId: string } }
) {
  const { resultId } = params;

  const session = await getServerSession(authOptions);
  console.log('[exam-results API] session:', session);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  console.log('[exam-results API] userId:', userId);
  console.log('[exam-results API] params.resultId:', resultId);

  if (!resultId || typeof resultId !== 'string' || resultId.length < 10) {
    return NextResponse.json({ error: 'Invalid Result ID format' }, { status: 400 });
  }

  try {
    const result = await db.select().from(examResults).where(eq(examResults.id, resultId));
    if (!result || result.length === 0) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }
    const examResult = result[0];
    if (examResult.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(examResult);
  } catch (error) {
    console.error('Error fetching exam result:', error);
    return NextResponse.json({ error: 'Failed to fetch exam result' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { resultId: string } }
) {
  const { resultId } = params;

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = session.user.id;
  console.log('[exam-results API] DELETE called for resultId:', resultId, 'by userId:', userId);

  if (!resultId || typeof resultId !== 'string' || resultId.length < 10) {
    return NextResponse.json({ error: 'Invalid Result ID format' }, { status: 400 });
  }

  try {
    // 먼저 해당 결과가 존재하는지 확인하고 사용자 권한 체크
    const result = await db.select().from(examResults).where(eq(examResults.id, resultId));
    if (!result || result.length === 0) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }
    
    const examResult = result[0];
    if (examResult.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 결과 삭제 수행
    await db.delete(examResults).where(eq(examResults.id, resultId));
    
    return NextResponse.json({ success: true, message: '시험 결과가 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('Error deleting exam result:', error);
    return NextResponse.json({ error: '시험 결과 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 