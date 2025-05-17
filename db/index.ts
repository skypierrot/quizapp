import { drizzle } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';
import * as schema from './schema';

// DATABASE_URL 환경변수를 사용해 PostgreSQL에 연결합니다.
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@quizapp-db:5432/quizapp';

// 최대 재시도 횟수 및 지연 시간 설정
const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 2000;
const CONNECT_TIMEOUT_SEC = 5;

// 연결 재시도 함수
const createDBConnection = async () => {
  let retries = 0;
  let client: Sql<{}>;

  while (retries < MAX_RETRIES) {
    try {
      console.log(`PostgreSQL 연결 시도 중... (시도: ${retries + 1}/${MAX_RETRIES})`);

      // 연결 타임아웃 설정과 함께 클라이언트 생성
      client = postgres(connectionString, {
        connect_timeout: CONNECT_TIMEOUT_SEC,
        idle_timeout: 30
      });

      // 연결 테스트를 위한 간단한 쿼리 실행
      await client`SELECT 1`;
      console.log('PostgreSQL 연결 성공!');
      return client;
    } catch (error) {
      retries++;
      console.error(`PostgreSQL 연결 실패 (${retries}/${MAX_RETRIES}):`, error);
      
      if (retries >= MAX_RETRIES) {
        console.error('최대 재시도 횟수 초과. 데이터베이스 연결 실패');
        throw error;
      }

      // 재시도 전 지연 시간 설정
      console.log(`${RETRY_DELAY_MS}ms 후 재시도...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }

  throw new Error('데이터베이스 연결 실패');
};

// 클라이언트 비동기 초기화
let dbClient: Sql<{}> | undefined;
let initialized = false;
let initializationPromise: Promise<Sql<{}>> | null = null;

const initDB = async () => {
  if (!initialized && !initializationPromise) {
    initializationPromise = createDBConnection()
      .then(client => {
        dbClient = client;
        initialized = true;
        return client;
      })
      .catch(err => {
        console.error('DB 초기화 오류:', err);
        initialized = false;
        initializationPromise = null;
        throw err;
      });
  }
  return initializationPromise;
};

// DB 연결 시도 즉시 시작
initDB().catch(err => console.error('초기 DB 연결 오류:', err));

// DB 인스턴스 비동기 래퍼
const getDB = async () => {
  if (!initialized || !dbClient) {
    await initDB();
    if (!dbClient) {
      throw new Error('DB client could not be initialized after initDB.');
    }
  }
  return drizzle(dbClient, { schema });
};

// 기존 동기 방식 유지를 위한 호환성 처리
export const db = drizzle(postgres(connectionString), { schema });

// 비동기 DB 객체 - 필요한 경우 이를 사용
export const asyncDB = {
  get: getDB,
  isInitialized: () => initialized
};

// 추가: 연결 상태 확인 함수
export const checkDBConnection = async () => {
  try {
    const dbInstance = await getDB();
    await dbInstance.query.questions.findFirst();
    return true;
  } catch (error) {
    console.error('DB 연결 확인 중 오류:', error);
    return false;
  }
}; 