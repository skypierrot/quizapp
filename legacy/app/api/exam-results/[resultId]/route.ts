import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { examResults } from '@/db/schema/examResults';
import { eq } from 'drizzle-orm';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  // URL에서 resultId 추출
  const url = new URL(request.url);
  const paths = url.pathname.split('/');
  const resultIdx = paths.indexOf('exam-results');
  const resultIdString = resultIdx !== -1 ? paths[resultIdx + 1] : undefined;

  const { userId } = getAuth(request as any);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!resultIdString) {
    return NextResponse.json({ error: 'Result ID is required' }, { status: 400 });
  }

  const resultId = parseInt(resultIdString, 10);
  if (isNaN(resultId)) {
    return NextResponse.json({ error: 'Invalid Result ID format' }, { status: 400 });
  }

  try {
    const result = await db.query.examResults.findFirst({
      where: eq(examResults.id, resultId),
      with: {
        userAnswers: true,
        exam: {
            columns: {
                examName: true,
                year: true,
                session: true
            }
        }
      }
    });

    if (!result) {
      return NextResponse.json({ error: 'Exam result not found' }, { status: 404 });
    }

    if (result.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ result });

  } catch (error) {
    console.error('Error fetching exam result:', error);
    return NextResponse.json({ error: 'Failed to fetch exam result' }, { status: 500 });
  }
} 