import type { Config } from 'drizzle-kit';

export default {
  schema: './db/schema-images.ts',
  out: './drizzle',
  dialect: 'postgresql' as const,
  dbCredentials: {
    host: 'db',
    port: 5432,
    user: 'postgres',
    password: 'password',
    database: 'quizapp',
  },
} satisfies Config; 