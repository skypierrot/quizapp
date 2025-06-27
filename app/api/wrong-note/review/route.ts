import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { examResults } from '@/db/schema/examResults';
import { questions } from '@/db/schema/questions';
import { inArray, eq, and } from 'drizzle-orm';
import { userQuestionMemos } from '@/db/schema/userQuestionMemos';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: '로그인 필요' }, { status: 401 });
  }

  // 쿼리 파라미터 파싱
  const { searchParams } = new URL(req.url);
  const examType = searchParams.get('examType'); // 시험 종류(과목)
  const since = searchParams.get('since'); // 기간(YYYY-MM-DD)
  const sort = searchParams.get('sort') || 'wrongCount'; // 정렬 기준
  const limit = Number(searchParams.get('limit')) || 20; // 최대 개수

  // 1. 내 모든 시험 결과 조회 (필터 적용)
  let allResults = await db.select().from(examResults)
    .where(eq(examResults.userId, session.user.id));
  if (examType) {
    allResults = allResults.filter(r => r.examName === examType);
  }
  if (since) {
    const sinceDate = new Date(since);
    allResults = allResults.filter(r => new Date(r.createdAt) >= sinceDate);
  }

  // 2. questionId별 누적 오답 횟수 및 최근 오답 정보 집계
  const wrongCountMap: Record<string, { count: number, lastAnswer: any, lastDate: string, examName: string, lastExamDate: string }> = {};
  allResults.forEach(r => {
    const createdAtStr = typeof r.createdAt === 'string' ? r.createdAt : r.createdAt.toISOString();
    (r.answers || []).forEach((a: any) => {
      if (!a.isCorrect) {
        if (!wrongCountMap[a.questionId]) {
          wrongCountMap[a.questionId] = { count: 0, lastAnswer: a, lastDate: createdAtStr, examName: r.examName, lastExamDate: createdAtStr };
        }
        wrongCountMap[a.questionId].count += 1;
        // 최근 오답 정보 및 일시, 시험명 갱신
        if (!wrongCountMap[a.questionId].lastDate || new Date(createdAtStr) > new Date(wrongCountMap[a.questionId].lastDate)) {
          wrongCountMap[a.questionId].lastAnswer = a;
          wrongCountMap[a.questionId].lastDate = createdAtStr;
          wrongCountMap[a.questionId].examName = r.examName;
          wrongCountMap[a.questionId].lastExamDate = createdAtStr;
        }
      }
    });
  });

  // 3. 정렬 기준 적용
  let wrongArr = Object.entries(wrongCountMap);
  if (sort === 'recent') {
    wrongArr = wrongArr.sort((a, b) => new Date(b[1].lastDate).getTime() - new Date(a[1].lastDate).getTime());
  } else if (sort === 'wrongCount') {
    wrongArr = wrongArr.sort((a, b) => b[1].count - a[1].count);
  } // 추가 정렬 기준 필요시 else if ...

  // 4. 상위 N개 추출
  const topWrong = wrongArr.slice(0, limit);
  const questionIds = topWrong.map(([qid]) => qid);
  if (questionIds.length === 0) {
    return NextResponse.json({ review: [] });
  }

  // 5. 문제 정보 조회
  const questionList = await db.select().from(questions)
    .where(inArray(questions.id, questionIds));

  // 5-1. 유저별 문제별 메모 조회 (빈 배열 방어)
  let memoMap: Record<string, string> = {};
  if (questionIds.length > 0) {
    const memoList = await db.select().from(userQuestionMemos)
      .where(
        and(
          inArray(userQuestionMemos.questionId, questionIds),
          eq(userQuestionMemos.userId, session.user.id)
        )
      );
    (memoList as any[]).forEach((m: any) => { memoMap[m.questionId] = m.memo || ''; });
  }

  // 6. 데이터 조합
  const review = topWrong.map(([qid, info]) => {
    const q = questionList.find((q: any) => q.id === qid);
    const correctIdx = typeof q?.answer === 'number' && !isNaN(q.answer) ? q.answer : -1;
    return {
      questionId: qid,
      question: q?.content,
      images: q?.images || [],
      options: q?.options || [],
      userAnswer: typeof info.lastAnswer.selectedOptionIndex === 'number' && !isNaN(info.lastAnswer.selectedOptionIndex) ? info.lastAnswer.selectedOptionIndex : -1,
      correctAnswer: correctIdx,
      explanation: q?.explanation,
      explanationImages: q?.explanationImages || [],
      tags: q?.tags || [],
      wrongCount: info.count,
      lastWrongDate: info.lastDate,
      examName: info.examName,
      lastExamDate: info.lastExamDate,
      memo: memoMap[qid] || '',
    };
  });

  return NextResponse.json({ review });
} 