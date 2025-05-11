import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { userStats } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // 사용자 통계 조회
    const stats = await db.query.userStats.findFirst({
      where: eq(userStats.userId, userId),
    });

    if (!stats) {
      // 통계가 없으면 기본값 반환
      return NextResponse.json({
        examCount: 0,
        solvedQuestions: 0,
        postCount: 0,
        commentCount: 0,
        averageScore: 0,
        correctRate: 0,
        subjectStats: {},
      });
    }

    // 정답률 계산
    const correctRate = stats.totalQuestions > 0
      ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100)
      : 0;

    return NextResponse.json({
      examCount: stats.totalExams,
      solvedQuestions: stats.totalQuestions,
      postCount: stats.totalPosts,
      commentCount: stats.totalComments,
      averageScore: stats.averageScore,
      correctRate,
      subjectStats: stats.subjectStats,
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 