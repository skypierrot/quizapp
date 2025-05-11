import { NextRequest, NextResponse } from 'next/server';
import { drizzle } from 'drizzle-orm/node-postgres';
import { userDailyStats } from '@/db/schema/userDailyStats';
import { Client } from 'pg';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    const client = new Client({
      connectionString: process.env.DATABASE_URL ||
        'postgres://postgres:postgres@localhost:5432/quizapp',
    });
    await client.connect();
    const db = drizzle(client);

    let rows;
    if (userId) {
      rows = await db
        .select({
          date: userDailyStats.date,
          solvedCount: userDailyStats.solvedCount,
          totalStudyTime: userDailyStats.totalStudyTime,
          correctCount: userDailyStats.correctCount,
        })
        .from(userDailyStats)
        .where(eq(userDailyStats.userId, userId))
        .orderBy(desc(userDailyStats.date))
        .limit(30);
    } else {
      // 전체 통계: 최근 30일 날짜별로 합산
      rows = await db
        .select({
          date: userDailyStats.date,
          solvedCount: userDailyStats.solvedCount,
          totalStudyTime: userDailyStats.totalStudyTime,
          correctCount: userDailyStats.correctCount,
        })
        .from(userDailyStats)
        .orderBy(desc(userDailyStats.date));
      // 날짜별로 합산
      const map = new Map();
      for (const row of rows) {
        if (!map.has(row.date)) {
          map.set(row.date, { ...row });
        } else {
          const prev = map.get(row.date);
          map.set(row.date, {
            date: row.date,
            solvedCount: prev.solvedCount + (row.solvedCount || 0),
            totalStudyTime: prev.totalStudyTime + (row.totalStudyTime || 0),
            correctCount: prev.correctCount + (row.correctCount || 0),
          });
        }
      }
      rows = Array.from(map.values())
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-30); // 최근 30일만
    }

    await client.end();

    // 날짜 오름차순 정렬 (개인 통계는 이미 30개만, 전체 통계는 위에서 정렬)
    const data = rows.sort((a, b) => a.date.localeCompare(b.date));
    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
} 