import type { Config } from 'drizzle-kit';

export default {
  schema: './db/schema/index.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@quizapp-db:5432/quizapp',
  },
} satisfies Config; 