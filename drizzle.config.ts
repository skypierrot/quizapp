import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config(); // .env 파일 로드

export default {
  schema: './db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  exclude: ['./legacy/**'], // legacy 폴더 제외 추가
  dbCredentials: {
    // connectionString 대신 DATABASE_URL 환경 변수 직접 참조 (dotenv 로드 후)
    url: process.env.DATABASE_URL!,
  },
} satisfies Config; 