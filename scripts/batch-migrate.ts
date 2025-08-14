import { execSync } from 'child_process';

// 처리할 시험 폴더 목록 (간단한 것부터 복잡한 것 순서)
const EXAM_FOLDERS = [
  // 9급 시험들 (간단한 구조)
  '9급_국가직_공무원_국어',
  '9급_국가직_공무원_사회',
  '9급_국가직_공무원_경제학개론',
  '9급_국가직_공무원_공직선거법',
  '9급_국가직_공무원_관세법개론',
  '9급_국가직_공무원_교육학개론',
  '9급_국가직_공무원_교정학개론',
  '9급_국가직_공무원_국제법개론',
  '9급_국가직_공무원_기계설계',
  '9급_국가직_공무원_기계일반',
  '9급_국가직_공무원_네트워크보안',
  '9급_국가직_공무원_노동법개론',
  '9급_국가직_공무원_무선공학개론',
  
  // 기사 시험들 (복잡한 구조)
  '건설안전기사',
  '전기기사',
  '기계기사',
  '화학기사',
  '토목기사',
  '건축기사',
  '정보처리기사',
  '컴퓨터활용능력',
];

async function batchMigrate() {
  console.log('🚀 배치 마이그레이션 시작');
  console.log(`📋 총 ${EXAM_FOLDERS.length}개 시험 폴더 처리 예정`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < EXAM_FOLDERS.length; i++) {
    const examFolder = EXAM_FOLDERS[i];
    console.log(`\n📝 [${i + 1}/${EXAM_FOLDERS.length}] ${examFolder} 처리 중...`);
    
    try {
      // migratePredata.ts 스크립트를 직접 실행
      const command = `npx tsx scripts/migratePredata.ts --targetExamName=${examFolder} --resume --skipProcessed`;
      console.log(`🔧 실행 명령: ${command}`);
      
      execSync(command, { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      successCount++;
      console.log(`✅ ${examFolder} 처리 완료`);
      
      // 다음 시험 전 잠시 대기 (데이터베이스 부하 방지)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      failCount++;
      console.error(`❌ ${examFolder} 처리 실패:`, error);
      
      // 실패한 경우에도 계속 진행
      continue;
    }
  }
  
  console.log(`\n🎉 배치 마이그레이션 완료!`);
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`❌ 실패: ${failCount}개`);
  console.log(`📊 총 처리: ${successCount + failCount}개`);
}

// 스크립트 실행
if (require.main === module) {
  batchMigrate().catch(console.error);
}

export { batchMigrate };
