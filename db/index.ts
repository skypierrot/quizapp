import { drizzle } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';
import * as schema from './schema';

// DATABASE_URL 환경변수를 사용해 PostgreSQL에 연결합니다.
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@quizapp-db:5432/quizapp';

// 애플리케이션 전체에서 사용할 단일 PostgreSQL 클라이언트 인스턴스 생성
// 연결 옵션은 필요에 따라 여기에 추가할 수 있습니다.
// 예: const client = postgres(connectionString, { max: 10, idle_timeout: 30 });
// postgres.js는 기본적으로 연결을 관리하며, 필요할 때 연결하고 유휴 상태일 때 닫습니다.
// max 옵션으로 동시에 열 수 있는 최대 연결 수를 제어할 수 있습니다. (기본값: 10)
const client: Sql<{}> = postgres(connectionString, {
  idle_timeout: 20, // 유휴 연결 유지 시간(초)
  max_lifetime: 60 * 5, // 최대 연결 수명(초)
  connect_timeout: 5, // 연결 시도 타임아웃(초)
  // max: 10, // 동시에 열 수 있는 최대 연결 수 (기본값 10이므로 대부분의 경우 명시적 설정 불필요)
});

// 단일 클라이언트 인스턴스를 사용하여 Drizzle 인스턴스 생성
export const db = drizzle(client, { schema });

// 아래의 연결 재시도 및 비동기 초기화 로직은 현재 방식에서는 불필요하거나 혼란을 야기할 수 있으므로 주석 처리합니다.
// 필요하다면 애플리케이션 전체에서 asyncDB.get()을 사용하도록 리팩토링해야 합니다.

/*
// 최대 재시도 횟수 및 지연 시간 설정
const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 2000;
const CONNECT_TIMEOUT_SEC = 5;

// 연결 재시도 함수
const createDBConnection = async () => {
  let retries = 0;
  let localClient: Sql<{}>;

  while (retries < MAX_RETRIES) {
    try {
      console.log(`PostgreSQL 연결 시도 중... (시도: ${retries + 1}/${MAX_RETRIES})`);

      // 연결 타임아웃 설정과 함께 클라이언트 생성
      localClient = postgres(connectionString, {
        connect_timeout: CONNECT_TIMEOUT_SEC,
        idle_timeout: 30
      });

      // 연결 테스트를 위한 간단한 쿼리 실행
      await localClient`SELECT 1`;
      console.log('PostgreSQL 연결 성공!');
      return localClient;
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
let dbClientInitialized: Sql<{}> | undefined;
let initialized = false;
let initializationPromise: Promise<Sql<{}>> | null = null;

const initDB = async () => {
  if (!initialized && !initializationPromise) {
    initializationPromise = createDBConnection()
      .then(client => {
        dbClientInitialized = client;
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
  if (!initialized || !dbClientInitialized) {
    await initDB();
    if (!dbClientInitialized) {
      throw new Error('DB client could not be initialized after initDB.');
    }
  }
  return drizzle(dbClientInitialized, { schema });
};

// 비동기 DB 객체 - 필요한 경우 이를 사용
export const asyncDB = {
  get: getDB,
  isInitialized: () => initialized
};

// 추가: 연결 상태 확인 함수
export const checkDBConnection = async () => {
  try {
    const dbInstance = await getDB();
    // 간단한 쿼리로 연결 상태 확인
    // schema.questions가 실제로 존재하는지, 그리고 findFirst가 적절한지 확인 필요
    // 예시: await dbInstance.execute(sql`SELECT 1`);
    // 또는 특정 테이블의 존재 유무 확인 등
    // await dbInstance.query.questions.findFirst(); 
    await dbInstance.execute(postgres.sql`SELECT 1`);
    return true;
  } catch (error) {
    console.error('DB 연결 확인 중 오류:', error);
    return false;
  }
}; 
*/ 