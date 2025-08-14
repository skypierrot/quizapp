#!/bin/bash

# 빠른 백업 스크립트
# 마이그레이션 완료 상태의 간단한 백업

set -e

# 환경 변수 로드
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="migration_complete_${TIMESTAMP}"

echo "🚀 빠른 백업 시작: $BACKUP_NAME"

# 백업 디렉토리 생성
mkdir -p "backups/$BACKUP_NAME"

# 1. SQL 덤프
echo "📊 SQL 덤프 생성..."
docker exec quizapp-db-dev pg_dump \
    -U "$QUIZAPP_DB_USER" \
    -d "$QUIZAPP_DB_NAME" \
    > "backups/$BACKUP_NAME/database.sql"

# 2. 마이그레이션 파일
echo "📋 마이그레이션 파일 복사..."
cp -r drizzle/ "backups/$BACKUP_NAME/"

# 3. 스키마 파일
echo "🏗️  스키마 파일 복사..."
cp drizzle.config.ts "backups/$BACKUP_NAME/"
cp schema.sql "backups/$BACKUP_NAME/"

# 4. 환경 설정
echo "⚙️  환경 설정 복사..."
cp .env "backups/$BACKUP_NAME/"

# 5. 백업 정보
cat > "backups/$BACKUP_NAME/backup_info.txt" << EOF
빠른 백업 정보
===============
백업 시간: $(date)
백업 이름: $BACKUP_NAME
마이그레이션 상태: 완료 (7개)
데이터베이스: $QUIZAPP_DB_NAME
EOF

echo "✅ 빠른 백업 완료: backups/$BACKUP_NAME"
du -sh "backups/$BACKUP_NAME"

