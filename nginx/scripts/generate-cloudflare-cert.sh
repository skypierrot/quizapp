#!/bin/bash

# 클라우드플레어 자체 서명된 SSL 인증서 생성 스크립트
# 사용법: ./generate-cloudflare-cert.sh

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# 설정 변수
DOMAINS=("geniduck.org" "quiz.geniduck.org")
SSL_DIR="/etc/nginx/ssl"
CONTAINER_SSL_DIR="/home/guri/develop/nginx/ssl"

log "클라우드플레어 SSL 인증서 생성 시작"

# 각 도메인에 대해 인증서 생성
for domain in "${DOMAINS[@]}"; do
    log "도메인: $domain 처리 중..."
    
    # SSL 디렉토리 생성
    mkdir -p "$CONTAINER_SSL_DIR/$domain"
    
    # 자체 서명된 인증서 생성
    log "자체 서명된 인증서 생성 중..."
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$CONTAINER_SSL_DIR/$domain/key.pem" \
        -out "$CONTAINER_SSL_DIR/$domain/cert.pem" \
        -subj "/C=KR/ST=Seoul/L=Seoul/O=GeniDuck/OU=IT/CN=$domain" \
        -addext "subjectAltName=DNS:$domain,DNS:*.$domain"
    
    if [ $? -eq 0 ]; then
        log "SUCCESS: $domain 인증서 생성 완료"
        
        # 권한 설정
        chmod 600 "$CONTAINER_SSL_DIR/$domain/key.pem"
        chmod 644 "$CONTAINER_SSL_DIR/$domain/cert.pem"
        
        log "권한 설정 완료: $domain"
    else
        error "FAILED: $domain 인증서 생성 실패"
        exit 1
    fi
done

log "모든 도메인 인증서 생성 완료"
info "다음 단계:"
info "1. 클라우드플레어에서 SSL/TLS 모드를 'Full (strict)'로 설정"
info "2. nginx 설정 테스트 및 재시작"
info "3. DNS 레코드 추가 (quiz.geniduck.org)"
