import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userStats } from '@/db/schema/userStats';
import { userDailyStats } from '@/db/schema/userDailyStats';
import { examResults } from '@/db/schema/examResults';
import { eq, and } from 'drizzle-orm';

/**
 * 시험 결과가 생성된 후 사용자 통계를 업데이트하는 웹훅
 * POST /api/hooks/update-stats
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, examResultId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // 해당 사용자의 모든 시험 결과 조회
    const results = await db
      .select()
      .from(examResults)
      .where(eq(examResults.userId, userId));

    if (!results || results.length === 0) {
      return NextResponse.json({ error: 'No exam results found for this user' }, { status: 404 });
    }

    // 통계 계산
    const totalExams = results.length;
    const totalQuestions = results.reduce((sum, r) => sum + (r.totalQuestions || 0), 0);
    const totalCorrect = results.reduce((sum, r) => sum + (r.correctCount || 0), 0);
    const averageScore = totalQuestions > 0 
      ? Math.round((totalCorrect / totalQuestions) * 100) 
      : 0;

    // 과목별 통계 집계
    const subjectStatsMap: Record<string, { total: number; correct: number; averageScore: number }> = {};
    for (const result of results) {
      if (result.subjectStats) {
        for (const [subject, stats] of Object.entries(result.subjectStats)) {
          if (!subjectStatsMap[subject]) {
            subjectStatsMap[subject] = { total: 0, correct: 0, averageScore: 0 };
          }
          subjectStatsMap[subject].total += (stats as any).total || 0;
          subjectStatsMap[subject].correct += (stats as any).correct || 0;
        }
      }
    }

    // 과목별 평균 점수 계산
    for (const subject in subjectStatsMap) {
      const subjectStats = subjectStatsMap[subject];
      if (subjectStats) {
        subjectStats.averageScore = subjectStats.total > 0 
          ? Math.round((subjectStats.correct / subjectStats.total) * 100) 
          : 0;
      }
    }

    // 마지막 시험 시간
    const lastExam = results.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
    const lastExamAt = lastExam ? new Date(lastExam.createdAt) : null;

    // userStats 테이블 업데이트
    const existingStats = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, userId));

    if (existingStats.length === 0) {
      // 새 데이터 생성
      await db.insert(userStats).values({
        userId,
        totalExams,
        totalQuestions,
        totalCorrect,
        averageScore,
        subjectStats: subjectStatsMap,
        lastExamAt,
        updatedAt: new Date()
      });
    } else {
      // 기존 데이터 업데이트
      await db.update(userStats)
        .set({
          totalExams,
          totalQuestions,
          totalCorrect,
          averageScore,
          subjectStats: subjectStatsMap,
          lastExamAt,
          updatedAt: new Date()
        })
        .where(eq(userStats.userId, userId));
    }

    // 일별 통계 업데이트 (최근 시험 결과만)
    if (examResultId) {
      const result = results.find(r => r.id === examResultId);
      if (result) {
        // 날짜 추출
        const examDate = new Date(result.createdAt);
        const dateStr: string = examDate.toISOString().split('T')[0] || ''; // YYYY-MM-DD

        // 해당 날짜의 기존 데이터 조회
        const existingDailyStats = await db
          .select()
          .from(userDailyStats)
          .where(and(eq(userDailyStats.userId, userId), eq(userDailyStats.date, dateStr)));

        const totalStudyTime = result.elapsedTime ? result.elapsedTime * 60 : 0; // 분을 초로 변환
        const solvedCount = result.totalQuestions || 0;
        const correctCount = result.correctCount || 0;

        if (existingDailyStats.length === 0) {
          // 새 데이터 생성
          await db.insert(userDailyStats).values({
            id: `${userId}-${dateStr}`,
            userId,
            date: dateStr,
            solvedCount,
            correctCount,
            totalStudyTime,
            streak: 0, // 연속 학습일 계산 로직 필요
            updatedAt: new Date()
          });
        } else {
          // 기존 데이터 업데이트
          const existing = existingDailyStats[0];
          if (existing) {
            await db.update(userDailyStats)
              .set({
                solvedCount: existing.solvedCount + solvedCount,
                correctCount: existing.correctCount + correctCount,
                totalStudyTime: existing.totalStudyTime + totalStudyTime,
                updatedAt: new Date()
              })
              .where(eq(userDailyStats.id, existing.id));
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('통계 업데이트 중 오류 발생:', error);
    return NextResponse.json({ error: 'Failed to update statistics' }, { status: 500 });
  }
} 