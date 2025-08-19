#!/bin/bash

# Docker 볼륨 백업/복원 스크립트
# 사용법: ./scripts/backup-restore-volume.sh [backup|restore] [백업파일경로]

set -e

if [ $# -eq 0 ]; then
    echo "❌ 사용법: $0 [backup|restore] [백업파일경로]"
    echo "예시:"
    echo "  $0 backup                    # 볼륨 백업"
    echo "  $0 restore backup.tar.gz     # 볼륨 복원"
    exit 1
fi

ACTION="$1"
BACKUP_FILE="$2"

# 환경 변수 로드
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

VOLUME_NAME="quizapp_db_data_dev"
BACKUP_DIR="backups/volumes"

case $ACTION in
    "backup")
        echo "🚀 Docker 볼륨 백업 시작..."
        echo "📦 볼륨: $VOLUME_NAME"
        
        # 백업 디렉토리 생성
        mkdir -p "$BACKUP_DIR"
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        BACKUP_PATH="$BACKUP_DIR/${VOLUME_NAME}_${TIMESTAMP}.tar.gz"
        
        echo "📁 백업 경로: $BACKUP_PATH"
        
        # 볼륨 백업
        echo "📊 볼륨 데이터 압축 중..."
        sudo docker run --rm \
            -v "$VOLUME_NAME":/data \
            -v "$(pwd)/$BACKUP_DIR":/backup \
            alpine tar czf "/backup/$(basename $BACKUP_PATH)" -C /data .
        
        echo "✅ 볼륨 백업 완료: $BACKUP_PATH"
        echo "📊 백업 크기: $(du -sh "$BACKUP_PATH" | cut -f1)"
        
        # 백업 정보 생성
        cat > "$BACKUP_DIR/volume_backup_info_${TIMESTAMP}.txt" << EOF
Docker 볼륨 백업 정보
=====================
백업 시간: $(date)
볼륨 이름: $VOLUME_NAME
백업 파일: $(basename $BACKUP_PATH)
백업 크기: $(du -sh "$BACKUP_PATH" | cut -f1)

복원 방법:
1. 컨테이너 중지: docker-compose -f docker-compose.dev.yml down
2. 볼륨 복원: $0 restore $(basename $BACKUP_PATH)
3. 컨테이너 시작: docker-compose -f docker-compose.dev.yml up -d
EOF
        
        echo "📄 백업 정보: $BACKUP_DIR/volume_backup_info_${TIMESTAMP}.txt"
        ;;
        
    "restore")
        if [ -z "$BACKUP_FILE" ]; then
            echo "❌ 복원할 백업 파일을 지정해주세요."
            echo "사용법: $0 restore [백업파일경로]"
            exit 1
        fi
        
        if [ ! -f "$BACKUP_FILE" ]; then
            echo "❌ 백업 파일을 찾을 수 없습니다: $BACKUP_FILE"
            exit 1
        fi
        
        echo "🔄 Docker 볼륨 복원 시작..."
        echo "📦 볼륨: $VOLUME_NAME"
        echo "📁 백업 파일: $BACKUP_FILE"
        
        # 확인 메시지 (자동 진행)
        echo "⚠️  기존 볼륨 데이터가 덮어써집니다. 자동으로 진행합니다."
        
        # 컨테이너 중지
        echo "🛑 컨테이너 중지 중..."
        docker-compose -f docker-compose.dev.yml down
        
        # 기존 볼륨 제거 (자동 진행)
        echo "🗑️  기존 볼륨 제거 중..."
        sudo docker volume rm "$VOLUME_NAME" 2>/dev/null || true
        
        # 새 컨테이너 시작 (빈 볼륨 생성)
        echo "🚀 새 컨테이너 시작 중..."
        if ! docker-compose -f docker-compose.dev.yml up -d quizapp-db; then
            echo "❌ 데이터베이스 컨테이너 시작 실패"
            exit 1
        fi
        
        # 컨테이너 상태 확인
        if ! docker ps | grep -q quizapp-db-dev; then
            echo "❌ 데이터베이스 컨테이너가 실행되지 않음"
            exit 1
        fi
        
        # PostgreSQL 초기화 완료 대기 (안정적인 복원을 위해)
        echo "⏳ PostgreSQL 초기화 완료 대기 중..."
        echo "   - PostgreSQL 서비스 시작 대기..."
        sleep 5
        
        # PostgreSQL이 실제로 준비될 때까지 대기
        echo "   - PostgreSQL 연결 준비 상태 확인 중..."
        while ! docker exec quizapp-db-dev pg_isready -U postgres -d quizapp >/dev/null 2>&1; do
            echo "   ⏳ PostgreSQL 초기화 진행 중... (잠시 후 재시도)"
            sleep 3
        done
        
        echo "   ✅ PostgreSQL 초기화 완료!"
        echo "   - 추가 안정화 대기 중..."
        sleep 5
        
        # 볼륨 복원
        echo "📊 볼륨 데이터 복원 중..."
        sudo docker run --rm \
            -v "$VOLUME_NAME":/data \
            -v "$(pwd)":/backup \
            alpine sh -c "cd /data && tar xzf /backup/$BACKUP_FILE"
        
        echo "✅ 볼륨 복원 완료!"
        
        # 컨테이너 재시작
        echo "🔄 컨테이너 재시작 중..."
        docker-compose -f docker-compose.dev.yml restart
        
        # 복원 후 데이터베이스 상태 검증
        echo "📊 복원 결과 검증 중..."
        sleep 5
        
        # 테이블 존재 여부 먼저 확인
        echo "   - 테이블 구조 확인 중..."
        TABLE_CHECK=$(docker exec quizapp-db-dev psql -U postgres -d quizapp -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
        
        if [ "$TABLE_CHECK" -gt 0 ]; then
            echo "   ✅ 테이블 구조 복원 완료 (총 $TABLE_CHECK개 테이블)"
            
            # 주요 테이블 데이터 수 확인
            echo "   - 주요 테이블 데이터 수 확인 중..."
            docker exec quizapp-db-dev psql -U postgres -d quizapp -c "
SELECT 
    'questions' as table_name, COUNT(*) as count FROM questions
UNION ALL
SELECT 
    'exams' as table_name, COUNT(*) as count FROM exams
UNION ALL
SELECT 
    'images' as table_name, COUNT(*) as count FROM images
UNION ALL
SELECT 
    'user' as table_name, COUNT(*) as count FROM \"user\"
UNION ALL
SELECT 
    'threads' as table_name, COUNT(*) as count FROM threads
ORDER BY table_name;
" 2>/dev/null || echo "   ⚠️  일부 테이블 데이터 확인 실패 (정상적인 상황일 수 있음)"
        else
            echo "   ❌ 테이블 구조 복원 실패"
            echo "   - 로그 확인이 필요합니다"
        fi
        
        echo "🎉 볼륨 복원 완료!"
        echo "📝 다음 단계:"
        echo "   1. 애플리케이션 상태 확인"
        echo "   2. 데이터베이스 연결 테스트"
        echo "   3. 문제 수 확인"
        ;;
        
    *)
        echo "❌ 잘못된 액션입니다. 'backup' 또는 'restore'를 사용하세요."
        exit 1
        ;;
esac

