import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config(); // .env 파일 로드

const dbUrl = `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@localhost:5432/${process.env.POSTGRES_DB}`;

export default {
  schema: './db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: dbUrl
  }
} satisfies Config; 