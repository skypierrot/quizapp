import { NextRequest, NextResponse } from 'next/server';
import { drizzle } from 'drizzle-orm/node-postgres';
import { userDailyStats } from '@/db/schema/userDailyStats';
import { Client } from 'pg';
import { eq } from 'drizzle-orm';

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
      rows = await db.select().from(userDailyStats).where(eq(userDailyStats.userId, userId));
    } else {
      rows = await db.select().from(userDailyStats);
    }
    await client.end();

    if (!rows.length) {
      return NextResponse.json({ totalStudyTime: 0, totalSolved: 0, correctRate: 0, streak: 0 });
    }

    const totalStudyTime = rows.reduce((acc, r) => acc + (r.totalStudyTime || 0), 0);
    const totalSolved = rows.reduce((acc, r) => acc + (r.solvedCount || 0), 0);
    const correctCount = rows.reduce((acc, r) => acc + (r.correctCount || 0), 0);
    const correctRate = totalSolved > 0 ? correctCount / totalSolved : 0;

    let streak = 0;
    if (userId) {
      const dates = rows.map(r => r.date).sort((a, b) => b.localeCompare(a));
      let prev = null;
      for (const d of dates) {
        if (!prev) { streak = 1; prev = d; continue; }
        const prevDate = new Date(prev);
        const currDate = new Date(d);
        prevDate.setDate(prevDate.getDate() - 1);
        if (prevDate.toISOString().slice(0, 10) === currDate.toISOString().slice(0, 10)) {
          streak++;
          prev = d;
        } else {
          break;
        }
      }
    }

    return NextResponse.json({
      totalStudyTime,
      totalSolved,
      correctRate,
      streak,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
} 