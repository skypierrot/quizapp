#!/bin/bash

# Predata 마이그레이션 빠른 백업 스크립트
# 마이그레이션 완료 상태의 간단한 백업

set -e

# 환경 변수 로드
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="predata_migration_quick_${TIMESTAMP}"

echo "🚀 Predata 마이그레이션 빠른 백업 시작: $BACKUP_NAME"

# 백업 디렉토리 생성
mkdir -p "backups/predata_quick/$BACKUP_NAME"

# 1. 데이터베이스 통계
echo "📊 데이터베이스 통계 수집..."
sudo docker exec quizapp-db-dev psql -U postgres -d quizapp -c "
SELECT 
    'questions' as table_name, COUNT(*) as count FROM questions
UNION ALL
SELECT 
    'exams' as table_name, COUNT(*) as count FROM exams
UNION ALL
SELECT 
    'images' as table_name, COUNT(*) as count FROM images
" > "backups/predata_quick/$BACKUP_NAME/database_stats.txt"

# 2. SQL 덤프 (전체)
echo "📊 SQL 덤프 생성..."
sudo docker exec quizapp-db-dev pg_dump \
    -U postgres \
    -d quizapp \
    > "backups/predata_quick/$BACKUP_NAME/database.sql"

# 3. 마이그레이션 스크립트
echo "📋 마이그레이션 스크립트 복사..."
cp scripts/migratePredata.ts "backups/predata_quick/$BACKUP_NAME/"

# 4. 마이그레이션 파일
echo "📋 마이그레이션 파일 복사..."
cp -r drizzle/ "backups/predata_quick/$BACKUP_NAME/"

# 5. 스키마 파일
echo "🏗️  스키마 파일 복사..."
cp drizzle.config.ts "backups/predata_quick/$BACKUP_NAME/"
cp schema.sql "backups/predata_quick/$BACKUP_NAME/"

# 6. 환경 설정
echo "⚙️  환경 설정 복사..."
cp .env "backups/predata_quick/$BACKUP_NAME/"

# 7. 백업 정보
cat > "backups/predata_quick/$BACKUP_NAME/backup_info.txt" << EOF
Predata 마이그레이션 빠른 백업 정보
====================================
백업 시간: $(date)
백업 이름: $BACKUP_NAME
마이그레이션 상태: 완료 ✅

데이터베이스 현황:
- 총 문제 수: $(cat "backups/predata_quick/$BACKUP_NAME/database_stats.txt" | grep questions | awk '{print $3}')
- 총 시험 수: $(cat "backups/predata_quick/$BACKUP_NAME/database_stats.txt" | grep exams | awk '{print $3}')
- 총 이미지 수: $(cat "backups/predata_quick/$BACKUP_NAME/database_stats.txt" | grep images | awk '{print $3}')

포함된 파일:
- 데이터베이스: database.sql
- 마이그레이션 스크립트: migratePredata.ts
- 마이그레이션 파일: drizzle/ 디렉토리
- 스키마 설정: drizzle.config.ts, schema.sql
- 환경 설정: .env

복원 방법:
1. 데이터베이스 복원: sudo docker exec -i quizapp-db-dev psql -U postgres -d quizapp < database.sql
2. 마이그레이션 파일 복원: cp -r drizzle/ /path/to/restore/
3. 애플리케이션 재시작: docker-compose -f docker-compose.dev.yml restart
EOF

echo "✅ Predata 마이그레이션 빠른 백업 완료: backups/predata_quick/$BACKUP_NAME"
du -sh "backups/predata_quick/$BACKUP_NAME"

echo ""
echo "🎉 백업 완료 요약"
echo "=================="
echo "📊 데이터베이스: $(cat "backups/predata_quick/$BACKUP_NAME/database_stats.txt" | grep questions | awk '{print $3}')개 문제"
echo "📚 시험: $(cat "backups/predata_quick/$BACKUP_NAME/database_stats.txt" | grep exams | awk '{print $3}')개"
echo "🖼️  이미지: $(cat "backups/predata_quick/$BACKUP_NAME/database_stats.txt" | grep images | awk '{print $3}')개"
echo "📁 백업 크기: $(du -sh "backups/predata_quick/$BACKUP_NAME" | cut -f1)"
echo "⏰ 백업 시간: $(date)"

