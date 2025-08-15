import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config(); // .env 파일 로드

const dbUrl = `postgres://${process.env.QUIZAPP_DB_USER}:${process.env.QUIZAPP_DB_PASSWORD}@quizapp-db:5432/${process.env.QUIZAPP_DB_NAME}`;

export default {
  schema: './db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: dbUrl
  }
} satisfies Config; 