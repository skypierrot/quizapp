import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { examResults, type InsertExamResult } from '@/db/schema';
import type { INewExamResult, IExamResult } from '@/types';
import { eq, desc, and, gt, lt } from 'drizzle-orm';
import { updateStatsOnExamResultSave } from '@/middleware/statisticsMiddleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const results = await db
        .select()
        .from(examResults)
        .where(eq(examResults.userId, userId))
        .orderBy(desc(examResults.createdAt));
      
      return res.status(200).json(results as IExamResult[]);
    } catch (error) {
      console.error('Error fetching exam results:', error);
      return res.status(500).json({ message: '시험 결과를 불러오는 중 오류가 발생했습니다.' });
    }
  } else if (req.method === 'POST') {
    // 요청 헤더, 쿠키, 세션 모두 로그로 출력
    console.log('==== [API] /api/exam-results POST (Pages Router) ====');
    console.log('Headers:', req.headers);
    console.log('Cookies:', req.cookies);
    console.log('Session:', session);

    let resultData: INewExamResult;
    try {
      resultData = req.body;
      if (typeof resultData === 'string') {
        resultData = JSON.parse(resultData);
      }
    } catch (error) {
      return res.status(400).json({ message: '잘못된 요청 형식입니다.' });
    }

    // examSession 대신 examDate, examSubject 사용
    const { examName, examYear, examDate, examSubject, answers, score, correctCount, totalQuestions, elapsedTime, limitTime, subjectStats } = resultData;
    
    // 필수 필드 검사 업데이트
    if (!examName || typeof examYear !== 'number' || !examDate || !examSubject || !answers || 
        typeof score !== 'number' || typeof correctCount !== 'number' || 
        typeof totalQuestions !== 'number' || typeof elapsedTime !== 'number') {
      return res.status(400).json({ message: '필수 데이터가 누락되었습니다.' });
    }

    try {
      // 중복 결과 체크: 최근 10분 이내에 같은 시험에 대해 동일한 점수와 정답 수를 가진 결과가 있는지 확인
      // 임시 결과에서 저장한 경우 중복 가능성이 높음
      const now = new Date();
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000); // 10분 전
      
      const existingResults = await db
        .select()
        .from(examResults)
        .where(
          and(
            eq(examResults.userId, userId),
            eq(examResults.examName, examName),
            eq(examResults.examYear, examYear),
            eq(examResults.examDate, examDate),
            eq(examResults.examSubject, examSubject),
            eq(examResults.score, score),
            eq(examResults.correctCount, correctCount),
            eq(examResults.totalQuestions, totalQuestions),
            gt(examResults.createdAt, tenMinutesAgo)
          )
        )
        .orderBy(desc(examResults.createdAt))
        .limit(1);
      
      // 중복된 결과가 존재하면 해당 결과를 반환
      if (existingResults.length > 0) {
        console.log('[API] 중복 결과 감지:', existingResults[0].id);
        return res.status(200).json(existingResults[0]);
      }
      
      // 중복이 없으면 새 결과 저장
      const insertData: InsertExamResult = {
        userId,
        examName,
        examYear,
        examDate,    // 추가
        examSubject, // examSession 대신 사용
        answers,
        score,
        correctCount,
        totalQuestions,
        subjectStats: subjectStats || {}, // 과목별 통계 추가
        elapsedTime,
        limitTime: limitTime === undefined ? null : limitTime, // undefined면 null로 DB 저장
        // createdAt, updatedAt은 DB 스키마에서 defaultNow()로 자동 생성되므로 여기서 제외 가능
      };
      
      const [saved] = await db.insert(examResults).values(insertData).returning();
      // 시험 결과가 저장된 후 통계 업데이트
      try {
        await updateStatsOnExamResultSave(userId, {
          id: saved.id,
          examId: `${saved.examName}-${saved.examYear}-${saved.examSubject}`,
          score: saved.score,
          correctCount: saved.correctCount,
          totalQuestions: saved.totalQuestions,
          elapsedTime: saved.elapsedTime,
          createdAt: saved.createdAt,
        });
      } catch (err) {
        console.error('Failed to update stats on exam result save:', err);
      }
      return res.status(201).json(saved);
    } catch (error) {
      console.error('Error saving exam result:', error);
      return res.status(500).json({ message: '시험 결과를 저장하는 중 오류가 발생했습니다.' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 