import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import { userDailyStats } from '../db/schema/userDailyStats';
import { Client } from 'pg';

// DB 연결
const client = new Client({
  connectionString: process.env.DATABASE_URL ||
    'postgres://postgres:postgres@localhost:5432/quizapp',
});

async function batchUserDailyStats() {
  await client.connect();
  const db = drizzle(client);

  // 1. exam_results에서 userId, createdAt(날짜), elapsedTime, totalQuestions, correctCount 집계 (raw SQL)
  const results = await db.execute(
    sql`
      SELECT
        "user_id" as "userId",
        DATE("created_at") as "date",
        SUM("elapsed_time") as "totalStudyTime",
        SUM("total_questions") as "solvedCount",
        SUM("correct_count") as "correctCount"
      FROM exam_results
      GROUP BY "user_id", DATE("created_at")
    `
  );

  for (const row of results.rows) {
    const id = `${row.userId}_${row.date}`;
    await db.insert(userDailyStats)
      .values({
        id,
        userId: row.userId,
        date: row.date,
        totalStudyTime: Number(row.totalStudyTime),
        solvedCount: Number(row.solvedCount),
        correctCount: Number(row.correctCount),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [userDailyStats.id],
        set: {
          totalStudyTime: Number(row.totalStudyTime),
          solvedCount: Number(row.solvedCount),
          correctCount: Number(row.correctCount),
          updatedAt: new Date(),
        },
      });
  }
  await client.end();
  console.log('user_daily_stats 집계 완료');
}

batchUserDailyStats().catch(console.error); 