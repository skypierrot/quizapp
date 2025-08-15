#!/bin/bash

# 클라우드플레어 DDNS 업데이트 스크립트
# 사용법: ./ddns-update.sh

# 설정 변수 (사용 전 수정 필요)
ZONE_ID="your-zone-id-here"
RECORD_ID="your-record-id-here"
API_TOKEN="your-api-token-here"
DOMAIN="geniduck.org"
IP_FILE="/tmp/last_ip"
LOG_FILE="/var/log/nginx/ddns-update.log"

# 로그 함수
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# 에러 체크 함수
check_error() {
    if [ $? -ne 0 ]; then
        log "ERROR: $1"
        exit 1
    fi
}

# 현재 공인 IP 주소 가져오기
log "현재 공인 IP 주소 확인 중..."
CURRENT_IP=$(curl -s --max-time 10 ifconfig.me)
check_error "공인 IP 주소를 가져올 수 없습니다"

if [ -z "$CURRENT_IP" ]; then
    log "ERROR: 공인 IP 주소가 비어있습니다"
    exit 1
fi

log "현재 공인 IP: $CURRENT_IP"

# 이전 IP 주소 확인
if [ -f "$IP_FILE" ]; then
    STORED_IP=$(cat "$IP_FILE")
    log "저장된 IP: $STORED_IP"
else
    STORED_IP=""
    log "저장된 IP 없음"
fi

# IP가 변경되었는지 확인
if [ "$CURRENT_IP" = "$STORED_IP" ]; then
    log "IP 주소가 변경되지 않았습니다. 업데이트 불필요"
    exit 0
fi

log "IP 주소가 변경되었습니다. 클라우드플레어 DNS 업데이트 중..."

# 클라우드플레어 DNS 레코드 업데이트
RESPONSE=$(curl -s -X PUT \
    "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$RECORD_ID" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json" \
    --data "{
        \"type\": \"A\",
        \"name\": \"$DOMAIN\",
        \"content\": \"$CURRENT_IP\",
        \"ttl\": 1,
        \"proxied\": false
    }")

# 응답 확인
if echo "$RESPONSE" | grep -q '"success":true'; then
    log "SUCCESS: DNS 레코드가 성공적으로 업데이트되었습니다"
    echo "$CURRENT_IP" > "$IP_FILE"
    log "새 IP 주소 저장됨: $CURRENT_IP"
else
    log "ERROR: DNS 업데이트 실패"
    log "응답: $RESPONSE"
    exit 1
fi

log "DDNS 업데이트 완료"
