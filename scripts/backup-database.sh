#!/bin/bash

# 데이터베이스 백업 스크립트
# 사용법: ./scripts/backup-database.sh [백업_이름]

set -e

# 환경 변수 로드
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# 백업 디렉토리 생성
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# 백업 이름 설정
BACKUP_NAME=${1:-"manual_backup"}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 데이터베이스 백업 시작..."
echo "📁 백업 디렉토리: $BACKUP_DIR"
echo "🏷️  백업 이름: $BACKUP_NAME"

# 1. SQL 덤프 백업
echo "📊 SQL 덤프 생성 중..."
docker exec quizapp-db-dev pg_dump \
    -U "$QUIZAPP_DB_USER" \
    -d "$QUIZAPP_DB_NAME" \
    --clean --if-exists --create \
    > "$BACKUP_DIR/${BACKUP_NAME}_${TIMESTAMP}.sql"

# 2. 마이그레이션 상태 백업
echo "📋 마이그레이션 상태 백업 중..."
cp -r drizzle/ "$BACKUP_DIR/"

# 3. 스키마 백업
echo "🏗️  스키마 백업 중..."
cp drizzle.config.ts "$BACKUP_DIR/"
cp schema.sql "$BACKUP_DIR/"

# 4. 환경 설정 백업
echo "⚙️  환경 설정 백업 중..."
cp .env "$BACKUP_DIR/"

# 5. Docker 볼륨 백업 (선택사항)
read -p "Docker 볼륨도 백업하시겠습니까? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🐳 Docker 볼륨 백업 중..."
    docker run --rm \
        -v quizapp_db_data_dev:/data \
        -v "$(pwd)/$BACKUP_DIR":/backup \
        alpine tar czf "/backup/db_volume_${TIMESTAMP}.tar.gz" -C /data .
fi

# 6. 백업 정보 생성
cat > "$BACKUP_DIR/backup_info.txt" << EOF
백업 정보
==========
백업 시간: $(date)
백업 이름: $BACKUP_NAME
마이그레이션 버전: 7 (0000-0006)
데이터베이스: $QUIZAPP_DB_NAME
사용자: $QUIZAPP_DB_USER
컨테이너: quizapp-db-dev

포함된 파일:
- SQL 덤프: ${BACKUP_NAME}_${TIMESTAMP}.sql
- 마이그레이션 파일: drizzle/ 디렉토리
- 스키마 설정: drizzle.config.ts, schema.sql
- 환경 설정: .env
EOF

echo "✅ 백업 완료!"
echo "📁 백업 위치: $BACKUP_DIR"
echo "📄 백업 정보: $BACKUP_DIR/backup_info.txt"

# 백업 크기 표시
du -sh "$BACKUP_DIR"
