import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

// 마이그레이션 스크립트 실행 함수
async function runMigration() {
  // Docker 컨테이너 내부에서는 'db'라는 서비스명을 사용합니다
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@db:5432/quizapp';
  
  // SQL 클라이언트 설정
  const migrationClient = postgres(connectionString, { max: 1 });
  
  // DB 인스턴스 생성
  console.log('🚀 마이그레이션 시작...');
  console.log(`연결 문자열: ${connectionString}`);
  
  try {
    // 마이그레이션 실행
    await migrate(drizzle(migrationClient), {
      migrationsFolder: 'drizzle',
    });
    console.log('✅ 마이그레이션 완료!');
  } catch (error) {
    console.error('❌ 마이그레이션 오류:', error);
  } finally {
    // 연결 종료
    await migrationClient.end();
  }
}

// 마이그레이션 실행
runMigration().catch((error) => {
  console.error('치명적인 오류:', error);
  process.exit(1);
}); 