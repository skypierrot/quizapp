import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config(); // .env 파일 로드

const runMigrate = async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined in environment variables');
  }

  console.log('Starting database migration...');
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Database migration completed successfully.');
  } catch (error) {
    console.error('Error during database migration:', error);
    process.exit(1); // 실패 시 종료
  } finally {
    await sql.end(); // 연결 종료
    console.log('Database connection closed.');
  }
};

runMigrate(); 