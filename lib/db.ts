import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// PostgreSQL 드라이버 설정
const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set in the environment variables.');
}

// SQL 로깅 활성화
const client = postgres(connectionString, {
  debug: (connection, query, params, type) => {
    console.log('\n--- Drizzle Query Start ---');
    console.log('[Type]:', type);
    console.log('[Query]:', query);
    console.log('[Params]:', params);
    console.log('--- Drizzle Query End ---\n');
  },
  // 연결 재시도 로직은 그대로 유지
  max_lifetime: 60 * 30, // 30 minutes
  idle_timeout: 20, // 20 seconds
  max: 10, // Max connections
  onnotice: (notice) => console.log('[DB Notice]:', notice),
  transform: {
    undefined: null,
  },
});

// Drizzle 인스턴스 생성
export const db = drizzle(client);

// --- 기존 연결 로직은 주석 처리하거나 삭제 ---
// let connectionAttempts = 0;
// const maxConnectionAttempts = 10;
// const retryInterval = 5000; // 5 seconds

// async function connectWithRetry() {
//   while (connectionAttempts < maxConnectionAttempts) {
//     try {
//       console.log(`PostgreSQL 연결 시도 중... (시도: ${connectionAttempts + 1}/${maxConnectionAttempts})`);
//       await client`SELECT 1`; // Test connection
//       console.log('PostgreSQL 연결 성공!');
//       return;
//     } catch (error: any) {
//       console.error(`PostgreSQL 연결 실패 (시도: ${connectionAttempts + 1}):`, error.message);
//       connectionAttempts++;
//       if (connectionAttempts >= maxConnectionAttempts) {
//         console.error('최대 연결 시도 횟수 도달. PostgreSQL 연결 실패.');
//         throw new Error('Failed to connect to PostgreSQL after multiple retries.');
//       }
//       await new Promise(resolve => setTimeout(resolve, retryInterval));
//     }
//   }
// }

// // 애플리케이션 시작 시 연결 시도
// connectWithRetry().catch(err => {
//   console.error('초기 DB 연결 프로세스 오류:', err);
//   process.exit(1); // 연결 실패 시 프로세스 종료
// });

// // 연결 상태 확인 함수 (필요 시 사용)
// export async function ensureDBConnection() {
//   try {
//     await client`SELECT 1`;
//   } catch (error) {
//     console.error('DB 연결 확인 실패:', error);
//     await connectWithRetry(); // 재연결 시도
//   }
// }

// db 모듈 재내보내기
// export { db, asyncDB, checkDBConnection } from '@/db'; 