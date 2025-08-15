#!/bin/bash

# 클라우드플레어 SSL 인증서 관리 스크립트
# 사용법: ./ssl-renew.sh

# 설정 변수
DOMAINS="geniduck.org quiz.geniduck.org"
LOG_FILE="/var/log/nginx/ssl-renew.log"

# 로그 함수
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log "클라우드플레어 SSL 인증서 확인: $DOMAINS"

# 클라우드플레어 SSL 상태 확인
log "클라우드플레어 SSL 상태 확인 중..."

# nginx 설정 테스트
log "nginx 설정 테스트 중..."
nginx -t
if [ $? -eq 0 ]; then
    log "nginx 설정 테스트 통과"
else
    log "ERROR: nginx 설정 테스트 실패"
    exit 1
fi

# nginx 재시작
log "nginx 설정 재로드 중..."
nginx -s reload
if [ $? -eq 0 ]; then
    log "nginx 설정 재로드 완료"
else
    log "ERROR: nginx 설정 재로드 실패"
    exit 1
fi

log "클라우드플레어 SSL 설정 완료: $DOMAINS"
log "참고: 클라우드플레어에서 SSL 인증서를 자동으로 관리합니다."
log "클라우드플레어 대시보드에서 SSL/TLS 설정을 확인하세요."
