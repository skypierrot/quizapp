import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../db';
import { userQuestionOptionMemos } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 인증: NextAuth 세션 기반
  const session = await getServerSession(req, res, authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const { questionId, optionIndex } = req.query;
    if (!questionId || optionIndex === undefined) {
      return res.status(400).json({ error: 'questionId, optionIndex required' });
    }
    const qid = String(questionId);
    const idx = Number(optionIndex);
    const [memoRow] = await db
      .select()
      .from(userQuestionOptionMemos)
      .where(
        and(
          eq(userQuestionOptionMemos.userId, userId),
          eq(userQuestionOptionMemos.questionId, qid),
          eq(userQuestionOptionMemos.optionIndex, idx)
        )
      );
    if (!memoRow) {
      return res.status(404).json({ memo: '' });
    }
    return res.status(200).json({ memo: memoRow.memo });
  }

  if (req.method === 'POST') {
    const { questionId, optionIndex, memo } = req.body;
    if (!questionId || optionIndex === undefined || memo === undefined) {
      return res.status(400).json({ error: 'questionId, optionIndex, memo required' });
    }
    const qid = String(questionId);
    const idx = Number(optionIndex);
    // upsert: 있으면 update, 없으면 insert
    const [existing] = await db
      .select()
      .from(userQuestionOptionMemos)
      .where(
        and(
          eq(userQuestionOptionMemos.userId, userId),
          eq(userQuestionOptionMemos.questionId, qid),
          eq(userQuestionOptionMemos.optionIndex, idx)
        )
      );
    if (existing) {
      await db
        .update(userQuestionOptionMemos)
        .set({ memo, updatedAt: new Date() })
        .where(
          and(
            eq(userQuestionOptionMemos.userId, userId),
            eq(userQuestionOptionMemos.questionId, qid),
            eq(userQuestionOptionMemos.optionIndex, idx)
          )
        );
    } else {
      await db.insert(userQuestionOptionMemos).values({
        userId,
        questionId: qid,
        optionIndex: idx,
        memo,
        updatedAt: new Date(),
      });
    }
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 