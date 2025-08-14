#!/bin/bash

# Predata 마이그레이션 백업 복원 스크립트
# 사용법: ./scripts/restore-predata-migration.sh [백업_디렉토리_경로]

set -e

if [ $# -eq 0 ]; then
    echo "❌ 사용법: $0 [백업_디렉토리_경로]"
    echo "예시: $0 backups/predata_migration/predata_migration_complete_20241228_143022"
    exit 1
fi

BACKUP_DIR="$1"

if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ 백업 디렉토리를 찾을 수 없습니다: $BACKUP_DIR"
    exit 1
fi

# 환경 변수 로드
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

echo "🔄 Predata 마이그레이션 복원 시작..."
echo "📁 백업 디렉토리: $BACKUP_DIR"

# 백업 정보 확인
if [ -f "$BACKUP_DIR/backup_info.txt" ]; then
    echo "📄 백업 정보:"
    cat "$BACKUP_DIR/backup_info.txt"
    echo
fi

# 확인 메시지
read -p "⚠️  기존 데이터베이스가 덮어써집니다. 계속하시겠습니까? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 복원이 취소되었습니다."
    exit 1
fi

# SQL 파일 찾기
SQL_FILES=($(find "$BACKUP_DIR" -name "full_database_*.sql" -type f))
if [ ${#SQL_FILES[@]} -eq 0 ]; then
    echo "❌ SQL 백업 파일을 찾을 수 없습니다."
    exit 1
fi

# 가장 최신 SQL 파일 선택
LATEST_SQL=""
for file in "${SQL_FILES[@]}"; do
    if [ -z "$LATEST_SQL" ] || [[ "$file" > "$LATEST_SQL" ]]; then
        LATEST_SQL="$file"
    fi
done

echo "📊 복원할 SQL 파일: $LATEST_SQL"

# 데이터베이스 복원
echo "🔄 데이터베이스 복원 중..."
sudo docker exec -i quizapp-db-dev psql \
    -U postgres \
    -d quizapp \
    < "$LATEST_SQL"

echo "✅ 데이터베이스 복원 완료!"

# 복원 후 데이터베이스 상태 확인
echo "📊 복원 후 데이터베이스 상태 확인 중..."
sudo docker exec quizapp-db-dev psql -U postgres -d quizapp -c "
SELECT 
    'questions' as table_name, COUNT(*) as count FROM questions
UNION ALL
SELECT 
    'exams' as table_name, COUNT(*) as count FROM exams
UNION ALL
SELECT 
    'images' as table_name, COUNT(*) as count FROM images
"

# 마이그레이션 파일 복원 (선택사항)
read -p "마이그레이션 파일도 복원하시겠습니까? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📋 마이그레이션 파일 복원 중..."
    
    # 기존 drizzle 디렉토리 백업
    if [ -d "drizzle" ]; then
        mv drizzle "drizzle.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    # 백업에서 복원
    cp -r "$BACKUP_DIR/drizzle" .
    
    # 마이그레이션 스크립트 복원
    if [ -f "$BACKUP_DIR/migratePredata.ts" ]; then
        cp "$BACKUP_DIR/migratePredata.ts" scripts/
    fi
    
    echo "✅ 마이그레이션 파일 복원 완료!"
fi

# 스키마 파일 복원 (선택사항)
read -p "스키마 파일도 복원하시겠습니까? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🏗️  스키마 파일 복원 중..."
    
    if [ -f "$BACKUP_DIR/drizzle.config.ts" ]; then
        cp "$BACKUP_DIR/drizzle.config.ts" .
    fi
    
    if [ -f "$BACKUP_DIR/schema.sql" ]; then
        cp "$BACKUP_DIR/schema.sql" .
    fi
    
    echo "✅ 스키마 파일 복원 완료!"
fi

echo "🎉 Predata 마이그레이션 복원 작업이 완료되었습니다!"
echo "📝 다음 단계:"
echo "   1. 애플리케이션 재시작: docker-compose -f docker-compose.dev.yml restart"
echo "   2. 데이터베이스 연결 확인"
echo "   3. 마이그레이션 상태 확인: npm run db:studio"
echo "   4. 문제 수 확인: 데이터베이스에서 questions 테이블 카운트"

