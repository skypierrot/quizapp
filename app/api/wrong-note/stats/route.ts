import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { questions } from '@/db/schema/questions';
import { examResults } from '@/db/schema/examResults';
import { eq, inArray, and, desc, sql } from 'drizzle-orm';
import { userQuestionReviewStatus } from '@/db/schema/userQuestionReviewStatus';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: '로그인 필요' }, { status: 401 });
  }

  // 1. 최근 30일간의 오답 통계
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 2. 내 모든 시험 결과 조회
  const allResults = await db.select().from(examResults)
    .where(eq(examResults.userId, session.user.id));

  // 3. 오답 추출 및 집계
  let totalWrongAnswers = 0;
  let totalQuestions = 0;
  let totalExams = allResults.length;
  
  // 시험 종류별 오답 수
  const examTypeStats: Record<string, { total: number, wrong: number }> = {};
  
  // 태그별 오답 수 (태그 기반 취약점 분석)
  const tagStats: Record<string, { total: number, wrong: number }> = {};
  
  // 일별 오답 현황
  const dailyWrongStats: Record<string, number> = {};
  
  // questionId별 오답 횟수
  const wrongCountMap: Record<string, number> = {};
  
  // 각 시험 결과에서 오답 데이터 추출
  allResults.forEach(result => {
    const resultDate = new Date(result.createdAt);
    const dateStr = resultDate.toISOString().split('T')[0];
    
    // 시험 종류별 집계 초기화
    const examName = result.examName || '기타';
    if (!examTypeStats[examName]) {
      examTypeStats[examName] = { total: 0, wrong: 0 };
    }
    
    // 전체 문제 수 증가
    const questions = (result.answers || []).length;
    totalQuestions += questions;
    examTypeStats[examName].total += questions;
    
    // 일별 오답 카운트 초기화
    if (!dailyWrongStats[dateStr]) {
      dailyWrongStats[dateStr] = 0;
    }
    
    // 오답 집계
    (result.answers || []).forEach((answer: any) => {
      // 오답인 경우
      if (!answer.isCorrect) {
        totalWrongAnswers++;
        examTypeStats[examName].wrong++;
        dailyWrongStats[dateStr]++;
        
        // 문제별 오답 횟수 증가
        wrongCountMap[answer.questionId] = (wrongCountMap[answer.questionId] || 0) + 1;
      }
    });
  });

  // 4. 오답 문제 정보 조회 (태그 분석용)
  const wrongQuestionIds = Object.keys(wrongCountMap);
  let questionList: any[] = [];
  
  if (wrongQuestionIds.length > 0) {
    questionList = await db.select().from(questions)
      .where(inArray(questions.id, wrongQuestionIds));
      
    // 태그별 오답 분석
    questionList.forEach(q => {
      const wrongCount = wrongCountMap[q.id] || 0;
      
      // 각 태그에 대한 오답 집계
      (q.tags || []).forEach((tag: string) => {
        if (!tagStats[tag]) {
          tagStats[tag] = { total: 0, wrong: 0 };
        }
        tagStats[tag].total++;
        tagStats[tag].wrong += wrongCount;
      });
    });
  }

  // 5. 복습 진행 상태 통계
  let reviewStats = {
    notStarted: 0,  // 미복습 (상태 0)
    inProgress: 0,  // 복습 중 (상태 1)
    completed: 0    // 완료 (상태 2)
  };
  
  if (wrongQuestionIds.length > 0) {
    const reviewStatusRecords = await db.select().from(userQuestionReviewStatus)
      .where(
        and(
          eq(userQuestionReviewStatus.userId, session.user.id),
          inArray(userQuestionReviewStatus.questionId, wrongQuestionIds)
        )
      );
    
    // 기본적으로 모든 문제는 미복습 상태로 가정
    reviewStats.notStarted = wrongQuestionIds.length;
    
    // 데이터베이스에 기록된 복습 상태가 있는 문제들 카운트
    reviewStatusRecords.forEach(record => {
      if (record.reviewStatus === 0) {
        // 이미 카운트됨 (미복습)
      } else if (record.reviewStatus === 1) {
        reviewStats.notStarted--;
        reviewStats.inProgress++;
      } else if (record.reviewStatus === 2) {
        reviewStats.notStarted--;
        reviewStats.completed++;
      }
    });
  }

  // 6. 자주 틀리는 상위 태그 5개
  const topTags = Object.entries(tagStats)
    .filter(([tag]) => tag && tag.trim() !== '')
    .map(([tag, stats]) => ({
      tag,
      wrongCount: stats.wrong,
      totalCount: stats.total,
      percentage: Math.round((stats.wrong / stats.total) * 100)
    }))
    .sort((a, b) => b.wrongCount - a.wrongCount)
    .slice(0, 5);

  // 7. 오답률이 높은 시험 유형
  const examStats = Object.entries(examTypeStats)
    .map(([examName, stats]) => ({
      examName,
      totalQuestions: stats.total,
      wrongCount: stats.wrong,
      percentage: stats.total > 0 ? Math.round((stats.wrong / stats.total) * 100) : 0
    }))
    .sort((a, b) => b.percentage - a.percentage);

  // 8. 일별 오답수 변화 (최근 30일)
  const dailyStats = [];
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    dailyStats.unshift({
      date: dateStr,
      wrongCount: dailyWrongStats[dateStr] || 0
    });
  }

  return NextResponse.json({
    overview: {
      totalExams,
      totalQuestions,
      totalWrongAnswers,
      wrongPercentage: totalQuestions > 0 ? Math.round((totalWrongAnswers / totalQuestions) * 100) : 0
    },
    reviewProgress: reviewStats,
    topWrongTags: topTags,
    examTypeStats: examStats,
    dailyWrongStats: dailyStats
  });
} 