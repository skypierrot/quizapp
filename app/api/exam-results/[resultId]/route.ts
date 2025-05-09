import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { examResults } from '@/db/schema/examResults';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  context: { params: { resultId: string } }
) {
  const { resultId } = await context.params;

  const session = await getServerSession({ req: request, ...authOptions });
  console.log('[exam-results API] session:', session);
  const userId = session && 'user' in session && session.user ? session.user.id : undefined;
  console.log('[exam-results API] userId:', userId);
  console.log('[exam-results API] params.resultId:', resultId);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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