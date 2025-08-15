import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { userStats, examResults } from '@/db/schema';
import { eq, sql, count, sum, avg } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. 먼저 userStats 테이블에서 조회
    const stats = await db.query.userStats.findFirst({
      where: eq(userStats.userId, userId),
    });

    if (stats) {
      // userStats에 데이터가 있으면 그대로 사용
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
    }

    // 2. userStats에 데이터가 없으면 examResults에서 직접 계산
    console.log(`[API] userStats not found for userId: ${userId}, calculating from examResults...`);
    
    const examResultsData = await db
      .select({
        examCount: count(examResults.id),
        totalQuestions: sum(examResults.totalQuestions),
        totalCorrect: sum(examResults.correctCount),
        averageScore: avg(examResults.score),
      })
      .from(examResults)
      .where(eq(examResults.userId, userId));

    const result = examResultsData[0];
    
    if (!result) {
      // examResults에도 데이터가 없으면 기본값 반환
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
    const totalQuestions = Number(result.totalQuestions) || 0;
    const totalCorrect = Number(result.totalCorrect) || 0;
    const correctRate = totalQuestions > 0
      ? Math.round((totalCorrect / totalQuestions) * 100)
      : 0;

    // 과목별 통계 계산
    const subjectStatsData = await db
      .select({
        subjectStats: examResults.subjectStats,
      })
      .from(examResults)
      .where(eq(examResults.userId, userId));

    const subjectStatsMap: Record<string, { total: number; correct: number; averageScore: number }> = {};
    
    subjectStatsData.forEach(result => {
      if (result.subjectStats) {
        for (const [subject, stats] of Object.entries(result.subjectStats)) {
          if (!subjectStatsMap[subject]) {
            subjectStatsMap[subject] = { total: 0, correct: 0, averageScore: 0 };
          }
          subjectStatsMap[subject].total += stats.total;
          subjectStatsMap[subject].correct += stats.correct;
        }
      }
    });

    // 과목별 평균 점수 계산
    for (const subject in subjectStatsMap) {
      const subjectStats = subjectStatsMap[subject];
      if (subjectStats) {
        subjectStats.averageScore = subjectStats.total > 0 
          ? Math.round((subjectStats.correct / subjectStats.total) * 100) 
          : 0;
      }
    }

    return NextResponse.json({
      examCount: Number(result.examCount) || 0,
      solvedQuestions: totalQuestions,
      postCount: 0, // 게시글/댓글은 별도 테이블에서 조회 필요
      commentCount: 0,
      averageScore: Math.round(Number(result.averageScore) || 0),
      correctRate,
      subjectStats: subjectStatsMap,
    });

  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 