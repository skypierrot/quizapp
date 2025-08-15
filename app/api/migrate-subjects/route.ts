// 비활성화된 파일 - 스키마에 없는 컬럼(examSubject) 참조로 인해 주석 처리
// 추후 스키마 업데이트 후 활성화 예정

/*
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { questions, exams } from '@/db/schema';
import { eq, isNull, sql } from 'drizzle-orm';

// 과목이 없는 문제들에 과목 정보를 채워넣기 위한 API
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // 관리자 권한 확인
  if (!session?.user?.email || !session.user.email.endsWith('@admin.com')) {
    return NextResponse.json({ message: '관리자 권한이 필요합니다.' }, { status: 403 });
  }

  try {
    // 1. examSubject가 없거나 '미지정'인 문제들 찾기
    const questionsMissingSubject = await db
      .select({
        id: questions.id,
        examId: questions.examId,
      })
      .from(questions)
      .where(
        sql`${questions.examSubject} IS NULL OR ${questions.examSubject} = '미지정' OR ${questions.examSubject} = ''`
      );

    if (questionsMissingSubject.length === 0) {
      return NextResponse.json({ message: '모든 문제에 과목 정보가 있습니다.' });
    }

    // 2. 각 문제에 대해 examId를 통해 시험 정보 찾기 및 업데이트
    const updatedCount = await updateQuestionsFromExams(questionsMissingSubject);

    // 3. examId가 없는 문제들은 examName, examDate로 시험 정보 찾아서 업데이트
    const questionsWithoutExamId = await db
      .select({
        id: questions.id,
        examName: questions.examName,
        examDate: questions.examDate,
      })
      .from(questions)
      .where(
        sql`${questions.examId} IS NULL AND (${questions.examSubject} IS NULL OR ${questions.examSubject} = '미지정' OR ${questions.examSubject} = '')`
      );

    const additionalUpdates = await updateQuestionsFromNameDate(questionsWithoutExamId);

    return NextResponse.json({
      message: '과목 정보 업데이트 완료',
      updatedFromExamId: updatedCount,
      updatedFromNameDate: additionalUpdates,
      totalUpdated: updatedCount + additionalUpdates,
    });
  } catch (error) {
    console.error('과목 마이그레이션 오류:', error);
    return NextResponse.json({ error: '과목 정보 업데이트 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// examId를 통해 문제의 과목 정보 업데이트
async function updateQuestionsFromExams(questionList: { id: string; examId: string | null }[]) {
  let updateCount = 0;

  for (const question of questionList) {
    if (!question.examId) continue;

    // 해당 시험 정보 조회
    const examInfo = await db
      .select({
        subject: exams.subject,
        name: exams.name,
        date: exams.date,
      })
      .from(exams)
      .where(eq(exams.id, question.examId))
      .limit(1);

    if (examInfo.length > 0 && examInfo[0].subject) {
      // 과목 정보 업데이트
      await db
        .update(questions)
        .set({
          examSubject: examInfo[0].subject,
          examName: examInfo[0].name,
          examDate: examInfo[0].date,
          updatedAt: new Date(),
        })
        .where(eq(questions.id, question.id));

      updateCount++;
    }
  }

  return updateCount;
}

// examName, examDate로 문제의 과목 정보 업데이트
async function updateQuestionsFromNameDate(questionList: { id: string; examName: string | null; examDate: string | null }[]) {
  let updateCount = 0;

  for (const question of questionList) {
    if (!question.examName || !question.examDate) continue;

    // 해당 시험 정보 조회
    const examInfo = await db
      .select({
        subject: exams.subject,
        id: exams.id,
      })
      .from(exams)
      .where(
        sql`${exams.name} = ${question.examName} AND ${exams.date} = ${question.examDate}`
      )
      .limit(1);

    if (examInfo.length > 0 && examInfo[0].subject) {
      // 과목 정보 업데이트
      await db
        .update(questions)
        .set({
          examSubject: examInfo[0].subject,
          examId: examInfo[0].id,
          updatedAt: new Date(),
        })
        .where(eq(questions.id, question.id));

      updateCount++;
    }
  }

  return updateCount;
}

// 통계 조회 (GET 메서드)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // 관리자 권한 확인
  if (!session?.user?.email || !session.user.email.endsWith('@admin.com')) {
    return NextResponse.json({ message: '관리자 권한이 필요합니다.' }, { status: 403 });
  }

  try {
    // 과목별 문제 수 통계
    const subjectStats = await db
      .select({
        subject: questions.examSubject,
        count: sql<number>`count(*)::int`,
      })
      .from(questions)
      .groupBy(questions.examSubject)
      .orderBy(sql`count(*) DESC`);

    // 과목 정보가 없는 문제 수
    const missingSubjectCount = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(questions)
      .where(
        sql`${questions.examSubject} IS NULL OR ${questions.examSubject} = '미지정' OR ${questions.examSubject} = ''`
      );

    return NextResponse.json({
      subjectStats,
      missingSubjectCount: missingSubjectCount[0]?.count || 0,
      totalQuestions: subjectStats.reduce((sum, stat) => sum + stat.count, 0),
    });
  } catch (error) {
    console.error('과목 통계 조회 오류:', error);
    return NextResponse.json({ error: '과목 통계 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
*/

// 현재는 빈 내용으로 TypeScript 에러 방지
export {}; 