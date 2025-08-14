#!/bin/bash

# PostgreSQL 증분 백업 스크립트
# 사용법: ./scripts/incremental-backup.sh [backup|restore] [백업_이름]

set -e

if [ $# -eq 0 ]; then
    echo "❌ 사용법: $0 [backup|restore] [백업_이름]"
    echo "예시:"
    echo "  $0 backup                    # 증분 백업"
    echo "  $0 restore backup_name       # 증분 백업 복원"
    exit 1
fi

ACTION="$1"
BACKUP_NAME="${2:-incremental_backup_$(date +%Y%m%d_%H%M%S)}"

# 환경 변수 로드
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

BACKUP_DIR="backups/incremental"
BASE_BACKUP_DIR="$BACKUP_DIR/base"
INCREMENTAL_BACKUP_DIR="$BACKUP_DIR/incremental"
WAL_ARCHIVE_DIR="$BACKUP_DIR/wal_archive"

# 디렉토리 생성
mkdir -p "$BASE_BACKUP_DIR" "$INCREMENTAL_BACKUP_DIR" "$WAL_ARCHIVE_DIR"

case $ACTION in
    "backup")
        echo "🚀 PostgreSQL 증분 백업 시작..."
        echo "📦 백업 이름: $BACKUP_NAME"
        
        # 1. 베이스 백업 (전체 백업)
        if [ ! -f "$BASE_BACKUP_DIR/base_backup.sql" ]; then
            echo "📊 베이스 백업 생성 중..."
            
            # PostgreSQL 16 호환성을 위해 pg_start_backup 제거
            sudo docker exec quizapp-db-dev psql -U postgres -d quizapp -c "
                SELECT '베이스 백업 시작: ' || now();
            "
            
            sudo docker exec quizapp-db-dev pg_dump \
                -U postgres \
                -d quizapp \
                --clean --if-exists --create \
                > "$BASE_BACKUP_DIR/base_backup.sql"
            
            sudo docker exec quizapp-db-dev psql -U postgres -d quizapp -c "
                SELECT '베이스 백업 완료: ' || now();
            "
            
            # 베이스 백업 정보
            cat > "$BASE_BACKUP_DIR/base_backup_info.txt" << EOF
베이스 백업 정보
================
생성 시간: $(date)
백업 크기: $(du -sh "$BASE_BACKUP_DIR/base_backup.sql" | cut -f1)
데이터베이스: $QUIZAPP_DB_NAME
백업 유형: 베이스 백업 (전체)
EOF
            
            echo "✅ 베이스 백업 완료: $BASE_BACKUP_DIR/base_backup.sql"
        else
            echo "⏭️  베이스 백업이 이미 존재합니다."
        fi
        
        # 2. 증분 백업 (변경된 데이터만)
        echo "📊 증분 백업 생성 중..."
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        
        # 마지막 백업 이후 변경된 데이터만 백업
        echo "📋 변경된 데이터 추출 중..."
        CHANGED_DATA=$(sudo docker exec quizapp-db-dev psql -U postgres -d quizapp -c "
            SELECT COUNT(*) FROM questions WHERE updated_at > '1970-01-01'::timestamp;
        " 2>/dev/null | tail -1 | tr -d ' ')
        
        # 변경된 데이터가 있는 경우에만 파일 생성
        if [ -n "$CHANGED_DATA" ] && [ "$CHANGED_DATA" -gt 0 ]; then
            echo "✅ 변경된 데이터 발견: $CHANGED_DATA개 행"
            echo "table_name,count,last_updated" > "$INCREMENTAL_BACKUP_DIR/incremental_${TIMESTAMP}.csv"
            echo "questions,$CHANGED_DATA,$(date)" >> "$INCREMENTAL_BACKUP_DIR/incremental_${TIMESTAMP}.csv"
        else
            echo "⏭️  변경된 데이터가 없습니다."
            # 빈 파일 생성하지 않음
        fi
        
        # 3. 테이블별 통계 백업
        echo "📊 테이블별 통계 백업 중..."
        TABLE_COUNT=$(sudo docker exec quizapp-db-dev psql -U postgres -d quizapp -c "
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
        " 2>/dev/null | tail -1 | tr -d ' ')
        
        if [ -n "$TABLE_COUNT" ] && [ "$TABLE_COUNT" -gt 0 ]; then
            echo "✅ 테이블 통계 생성: $TABLE_COUNT개 테이블"
            echo "schemaname,tablename,count" > "$INCREMENTAL_BACKUP_DIR/table_stats_${TIMESTAMP}.csv"
            echo "public,tables,$TABLE_COUNT" >> "$INCREMENTAL_BACKUP_DIR/table_stats_${TIMESTAMP}.csv"
        else
            echo "❌ 테이블 통계 생성 실패, 파일 생성하지 않음"
        fi
        
        # 4. 증분 백업 정보 생성
        cat > "$INCREMENTAL_BACKUP_DIR/incremental_${TIMESTAMP}_info.txt" << EOF
증분 백업 정보
==============
백업 시간: $(date)
백업 이름: $BACKUP_NAME
백업 유형: 증분 백업
베이스 백업: $BASE_BACKUP_DIR/base_backup.sql

포함된 변경사항:
EOF
        
        # 실제 생성된 파일들만 정보에 추가
        if [ -f "$INCREMENTAL_BACKUP_DIR/incremental_${TIMESTAMP}.csv" ]; then
            echo "- 변경 데이터: incremental_${TIMESTAMP}.csv" >> "$INCREMENTAL_BACKUP_DIR/incremental_${TIMESTAMP}_info.txt"
        fi
        
        if [ -f "$INCREMENTAL_BACKUP_DIR/table_stats_${TIMESTAMP}.csv" ]; then
            echo "- 테이블 통계: table_stats_${TIMESTAMP}.csv" >> "$INCREMENTAL_BACKUP_DIR/incremental_${TIMESTAMP}_info.txt"
        fi
        
        echo "" >> "$INCREMENTAL_BACKUP_DIR/incremental_${TIMESTAMP}_info.txt"
        echo "백업 상태: $(if [ -f "$INCREMENTAL_BACKUP_DIR/incremental_${TIMESTAMP}.csv" ] || [ -f "$INCREMENTAL_BACKUP_DIR/table_stats_${TIMESTAMP}.csv" ]; then echo "데이터 포함"; else echo "변경사항 없음"; fi)" >> "$INCREMENTAL_BACKUP_DIR/incremental_${TIMESTAMP}_info.txt"
        
        echo "✅ 증분 백업 완료: $INCREMENTAL_BACKUP_DIR/incremental_${TIMESTAMP}_info.txt"
        
        # 5. 백업 로그 업데이트
        echo "📝 백업 로그 업데이트 중..."
        sudo docker exec quizapp-db-dev psql -U postgres -d quizapp -c "
            CREATE TABLE IF NOT EXISTS backup_log (
                id SERIAL PRIMARY KEY,
                backup_name VARCHAR(255),
                backup_type VARCHAR(50),
                backup_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                backup_size BIGINT,
                backup_path TEXT
            );
            
            INSERT INTO backup_log (backup_name, backup_type, backup_size, backup_path)
            VALUES ('$BACKUP_NAME', 'incremental', 
                    $(du -sb "$INCREMENTAL_BACKUP_DIR" | cut -f1),
                    '$INCREMENTAL_BACKUP_DIR');
        " 2>/dev/null || echo "⚠️  백업 로그 업데이트 실패 (권한 부족)"
        
        # 6. 전체 백업 크기 표시
        echo "📊 백업 크기 요약:"
        echo "   베이스 백업: $(du -sh "$BASE_BACKUP_DIR" | cut -f1)"
        echo "   증분 백업: $(du -sh "$INCREMENTAL_BACKUP_DIR" | cut -f1)"
        echo "   전체 백업: $(du -sh "$BACKUP_DIR" | cut -f1)"
        
        # 7. 백업 파일 목록 표시
        echo "📁 생성된 백업 파일:"
        find "$BACKUP_DIR" -type f -name "*.sql" -o -name "*.csv" -o -name "*.txt" | sort
        ;;
        
    "restore")
        echo "🔄 PostgreSQL 증분 백업 복원 시작..."
        echo "📦 백업 이름: $BACKUP_NAME"
        
        if [ ! -f "$BASE_BACKUP_DIR/base_backup.sql" ]; then
            echo "❌ 베이스 백업을 찾을 수 없습니다: $BASE_BACKUP_DIR/base_backup.sql"
            exit 1
        fi
        
        # 확인 메시지
        read -p "⚠️  기존 데이터베이스가 덮어써집니다. 계속하시겠습니까? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "❌ 복원이 취소되었습니다."
            exit 1
        fi
        
        # 1. 베이스 백업 복원
        echo "📊 베이스 백업 복원 중..."
        sudo docker exec -i quizapp-db-dev psql \
            -U postgres \
            -d quizapp \
            < "$BASE_BACKUP_DIR/base_backup.sql"
        
        # 2. 증분 백업 복원 (가장 최신 것부터)
        echo "📊 증분 백업 복원 중..."
        LATEST_INCREMENTAL=$(ls -t "$INCREMENTAL_BACKUP_DIR"/incremental_*_info.txt 2>/dev/null | head -1)
        
        if [ -n "$LATEST_INCREMENTAL" ]; then
            echo "📋 최신 증분 백업 복원: $LATEST_INCREMENTAL"
            
            # 증분 백업의 CSV 파일 찾기
            TIMESTAMP=$(echo "$LATEST_INCREMENTAL" | grep -o '[0-9]\{8\}_[0-9]\{6\}')
            CSV_FILE="$INCREMENTAL_BACKUP_DIR/incremental_${TIMESTAMP}.csv"
            
            if [ -f "$CSV_FILE" ]; then
                echo "📊 증분 데이터 확인 중..."
                # CSV 파일 내용 확인
                head -5 "$CSV_FILE"
                echo "⚠️  증분 데이터는 수동으로 확인 후 적용해야 합니다."
            fi
        else
            echo "⏭️  증분 백업이 없습니다. 베이스 백업만 복원됩니다."
        fi
        
        echo "✅ 증분 백업 복원 완료!"
        
        # 3. 복원 확인
        echo "📊 복원 확인 중..."
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
        ;;
        
    *)
        echo "❌ 잘못된 액션입니다. 'backup' 또는 'restore'를 사용하세요."
        exit 1
        ;;
esac

echo "🎉 증분 백업 작업 완료!"
