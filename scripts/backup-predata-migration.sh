#!/bin/bash

# Predata 마이그레이션 완료 상태 백업 스크립트
# 사용법: ./scripts/backup-predata-migration.sh [백업_이름]

set -e

# 환경 변수 로드
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# 백업 디렉토리 생성
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME=${1:-"predata_migration_complete"}
BACKUP_DIR="backups/predata_migration/${BACKUP_NAME}_${TIMESTAMP}"
mkdir -p "$BACKUP_DIR"

echo "🚀 Predata 마이그레이션 완료 상태 백업 시작..."
echo "📁 백업 디렉토리: $BACKUP_DIR"
echo "🏷️  백업 이름: $BACKUP_NAME"

# 1. 데이터베이스 통계 수집
echo "📊 데이터베이스 통계 수집 중..."
sudo docker exec quizapp-db-dev psql -U postgres -d quizapp -c "
SELECT 
    'questions' as table_name, COUNT(*) as count FROM questions
UNION ALL
SELECT 
    'exams' as table_name, COUNT(*) as count FROM exams
UNION ALL
SELECT 
    'images' as table_name, COUNT(*) as count FROM images
" > "$BACKUP_DIR/database_stats.txt"

# 2. SQL 덤프 백업 (전체 데이터베이스)
echo "📊 전체 데이터베이스 SQL 덤프 생성 중..."
sudo docker exec quizapp-db-dev pg_dump \
    -U postgres \
    -d quizapp \
    --clean --if-exists --create \
    > "$BACKUP_DIR/full_database_${TIMESTAMP}.sql"

# 3. 마이그레이션 스크립트 백업
echo "📋 마이그레이션 스크립트 백업 중..."
cp scripts/migratePredata.ts "$BACKUP_DIR/"
cp -r drizzle/ "$BACKUP_DIR/"

# 4. Predata 디렉토리 구조 백업
echo "📁 Predata 디렉토리 구조 백업 중..."
find predata/ -type d | sort > "$BACKUP_DIR/predata_directory_structure.txt"
find predata/ -name "*.html" | wc -l > "$BACKUP_DIR/total_html_files.txt"

# 5. 스키마 및 설정 파일 백업
echo "🏗️  스키마 및 설정 파일 백업 중..."
cp drizzle.config.ts "$BACKUP_DIR/"
cp schema.sql "$BACKUP_DIR/"
cp .env "$BACKUP_DIR/"

# 6. 마이그레이션 진행상태 백업
echo "📈 마이그레이션 진행상태 백업 중..."
if [ -f "scripts/migration_progress.json" ]; then
    cp scripts/migration_progress.json "$BACKUP_DIR/"
fi

if [ -f "scripts/migration_errors.log" ]; then
    cp scripts/migration_errors.log "$BACKUP_DIR/"
fi

# 7. Docker 볼륨 백업 (선택사항)
read -p "Docker 볼륨도 백업하시겠습니까? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🐳 Docker 볼륨 백업 중..."
    sudo docker run --rm \
        -v quizapp_db_data_dev:/data \
        -v "$(pwd)/$BACKUP_DIR":/backup \
        alpine tar czf "/backup/db_volume_${TIMESTAMP}.tar.gz" -C /data .
fi

# 8. 백업 정보 생성
cat > "$BACKUP_DIR/backup_info.txt" << EOF
Predata 마이그레이션 완료 상태 백업 정보
==========================================
백업 시간: $(date)
백업 이름: $BACKUP_NAME
마이그레이션 상태: 완료 ✅

데이터베이스 현황:
- 총 문제 수: $(cat "$BACKUP_DIR/database_stats.txt" | grep questions | awk '{print $3}')
- 총 시험 수: $(cat "$BACKUP_DIR/database_stats.txt" | grep exams | awk '{print $3}')
- 총 이미지 수: $(cat "$BACKUP_DIR/database_stats.txt" | grep images | awk '{print $3}')

포함된 파일:
- 전체 데이터베이스: full_database_${TIMESTAMP}.sql
- 마이그레이션 스크립트: migratePredata.ts
- 마이그레이션 파일: drizzle/ 디렉토리
- 스키마 설정: drizzle.config.ts, schema.sql
- 환경 설정: .env
- Predata 구조: predata_directory_structure.txt
- 총 HTML 파일 수: $(cat "$BACKUP_DIR/total_html_files.txt")

백업 크기: $(du -sh "$BACKUP_DIR" | cut -f1)

복원 방법:
1. 데이터베이스 복원: sudo docker exec -i quizapp-db-dev psql -U postgres -d quizapp < full_database_*.sql
2. 마이그레이션 파일 복원: cp -r drizzle/ /path/to/restore/
3. 애플리케이션 재시작: docker-compose -f docker-compose.dev.yml restart
EOF

echo "✅ Predata 마이그레이션 백업 완료!"
echo "📁 백업 위치: $BACKUP_DIR"
echo "📄 백업 정보: $BACKUP_DIR/backup_info.txt"

# 백업 크기 표시
echo "📊 백업 크기:"
du -sh "$BACKUP_DIR"

# 백업 완료 요약
echo ""
echo "🎉 백업 완료 요약"
echo "=================="
echo "📊 데이터베이스: $(cat "$BACKUP_DIR/database_stats.txt" | grep questions | awk '{print $3}')개 문제"
echo "📚 시험: $(cat "$BACKUP_DIR/database_stats.txt" | grep exams | awk '{print $3}')개"
echo "🖼️  이미지: $(cat "$BACKUP_DIR/database_stats.txt" | grep images | awk '{print $3}')개"
echo "📁 백업 크기: $(du -sh "$BACKUP_DIR" | cut -f1)"
echo "⏰ 백업 시간: $(date)"
