import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { examResults, type InsertExamResult } from '@/db/schema';
import type { INewExamResult } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // 요청 헤더, 쿠키, 세션 모두 로그로 출력
    console.log('==== [API] /api/exam-results POST (Pages Router) ====');
    console.log('Headers:', req.headers);
    console.log('Cookies:', req.cookies);
    const session = await getServerSession(req, res, authOptions);
    console.log('Session:', session);
    const userId = session?.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let resultData: INewExamResult;
    try {
      resultData = req.body;
      // 만약 body가 파싱되지 않았다면 JSON 파싱 시도
      if (typeof resultData === 'string') {
        resultData = JSON.parse(resultData);
      }
    } catch (error) {
      return res.status(400).json({ message: '잘못된 요청 형식입니다.' });
    }

    const { examName, examYear, examSession, answers, score, correctCount, totalQuestions, elapsedTime } = resultData;
    if (!examName || !examYear || !examSession || !answers || typeof score !== 'number' || typeof correctCount !== 'number' || typeof totalQuestions !== 'number' || typeof elapsedTime !== 'number') {
      return res.status(400).json({ message: '필수 데이터가 누락되었습니다.' });
    }

    const insertData: InsertExamResult = {
      userId,
      examName,
      examYear,
      examSession,
      answers,
      score,
      correctCount,
      totalQuestions,
      elapsedTime,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const [saved] = await db.insert(examResults).values(insertData).returning();
    return res.status(201).json(saved);
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 