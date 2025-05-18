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
      if (typeof resultData === 'string') {
        resultData = JSON.parse(resultData);
      }
    } catch (error) {
      return res.status(400).json({ message: '잘못된 요청 형식입니다.' });
    }

    // examSession 대신 examDate, examSubject 사용
    const { examName, examYear, examDate, examSubject, answers, score, correctCount, totalQuestions, elapsedTime, limitTime } = resultData;
    
    // 필수 필드 검사 업데이트
    if (!examName || typeof examYear !== 'number' || !examDate || !examSubject || !answers || 
        typeof score !== 'number' || typeof correctCount !== 'number' || 
        typeof totalQuestions !== 'number' || typeof elapsedTime !== 'number') {
      return res.status(400).json({ message: '필수 데이터가 누락되었습니다.' });
    }

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
      elapsedTime,
      limitTime: limitTime === undefined ? null : limitTime, // undefined면 null로 DB 저장
      // createdAt, updatedAt은 DB 스키마에서 defaultNow()로 자동 생성되므로 여기서 제외 가능
    };
    const [saved] = await db.insert(examResults).values(insertData).returning();
    return res.status(201).json(saved);
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 