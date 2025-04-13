import type { Config } from 'drizzle-kit';

export default {
  schema: './db/schema-images.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@db:5432/quizapp',
  },
} satisfies Config; 