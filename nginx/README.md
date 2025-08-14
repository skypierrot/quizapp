# Nginx Reverse Proxy 설정 가이드

이 프로젝트는 홈서버에서 동적 IP를 사용하여 외부 접속을 위한 Nginx Reverse Proxy 설정입니다.

## 📁 폴더 구조

```
nginx/
├── docker-compose.yml          # 도커 컴포즈 설정
├── nginx.conf                  # 메인 nginx 설정
├── conf.d/                     # 도메인별 설정 파일
│   └── geniduck.org.conf      # geniduck.org 도메인 설정
├── ssl/                        # SSL 인증서 저장소
├── logs/                       # nginx 로그 파일
├── scripts/                    # 관리 스크립트
│   ├── ddns-update.sh         # DDNS 업데이트
│   ├── ssl-renew.sh           # SSL 인증서 갱신
│   └── nginx-manager.sh       # nginx 관리
├── backups/                    # 백업 파일
├── .env                        # 환경 설정
└── crontab.txt                # 자동화 작업 설정
```

## 🚀 빠른 시작

### 1. 사전 준비사항

- Docker와 Docker Compose가 설치되어 있어야 합니다
- 클라우드플레어 계정과 도메인이 필요합니다
- 홈서버의 내부 IP 주소를 알아야 합니다

### 2. 환경 설정

`.env` 파일을 수정하여 실제 값으로 변경하세요:

```bash
# 도메인 설정
DOMAIN=geniduck.org

# 내부 서비스 IP 주소 (수정 필요)
QUIZAPP_IP=192.168.1.100  # 실제 내부 IP로 변경
QUIZAPP_PORT=3772

# 클라우드플레어 설정 (수정 필요)
CLOUDFLARE_ZONE_ID=your-zone-id-here
CLOUDFLARE_RECORD_ID=your-record-id-here
CLOUDFLARE_API_TOKEN=your-api-token-here

# SSL 인증서 설정
SSL_EMAIL=your-email@example.com
```

### 3. 클라우드플레어 설정

#### API 토큰 생성
1. 클라우드플레어 대시보드 → My Profile → API Tokens
2. "Create Custom Token" 클릭
3. 권한 설정:
   - Zone:Zone:Edit
   - Zone:DNS:Edit
4. Zone Resources에서 `geniduck.org` 선택
5. 토큰 생성 후 복사

#### Zone ID와 Record ID 확인
1. 클라우드플레어 대시보드 → `geniduck.org` 선택
2. 오른쪽 사이드바에서 Zone ID 확인
3. DNS → Records에서 A 레코드의 Record ID 확인

### 4. 서비스 시작

```bash
# nginx 폴더로 이동
cd /home/guri/develop/nginx

# 서비스 시작
./scripts/nginx-manager.sh start

# 상태 확인
./scripts/nginx-manager.sh status
```

## ⚙️ 상세 설정

### Nginx 설정 파일 수정

`conf.d/geniduck.org.conf`에서 내부 IP 주소를 수정하세요:

```nginx
# 퀴즈앱 프록시 설정
location / {
    # 내부 IP 주소로 변경 필요
    proxy_pass http://192.168.1.100:3772;  # 실제 IP로 변경
    # ... 기타 설정
}
```

### SSL 인증서 설정

Let's Encrypt 인증서를 자동으로 발급받으려면:

```bash
# certbot 설치 (Ubuntu/Debian)
sudo apt update
sudo apt install certbot

# 인증서 발급
./scripts/ssl-renew.sh
```

## 🔧 관리 명령어

### Nginx 관리

```bash
# 서비스 시작
./scripts/nginx-manager.sh start

# 서비스 중지
./scripts/nginx-manager.sh stop

# 서비스 재시작
./scripts/nginx-manager.sh restart

# 설정 재로드
./scripts/nginx-manager.sh reload

# 상태 확인
./scripts/nginx-manager.sh status

# 로그 보기
./scripts/nginx-manager.sh logs

# 설정 테스트
./scripts/nginx-manager.sh config-test
```

### DDNS 업데이트

```bash
# 수동 DDNS 업데이트
./scripts/ddns-update.sh

# 자동화 설정 (crontab에 추가)
crontab -e
# crontab.txt의 내용을 복사하여 붙여넣기
```

### SSL 인증서 갱신

```bash
# 수동 SSL 갱신
./scripts/ssl-renew.sh

# 자동 갱신은 crontab에 설정되어 있음
```

## 📊 모니터링

### 로그 파일 위치

- **접근 로그**: `logs/geniduck.org.access.log`
- **에러 로그**: `logs/geniduck.org.error.log`
- **DDNS 로그**: `logs/ddns-update.log`
- **SSL 로그**: `logs/ssl-renew.log`

### 실시간 로그 모니터링

```bash
# nginx 로그 실시간 보기
./scripts/nginx-manager.sh logs

# 특정 로그 파일 실시간 보기
tail -f logs/geniduck.org.access.log
```

## 🔒 보안 설정

### 방화벽 설정

```bash
# UFW 방화벽 설정 (Ubuntu)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8080/tcp  # phpMyAdmin (선택사항)
```

### Rate Limiting

nginx.conf에서 요청 제한 설정:

```nginx
# API 요청 제한: 10r/s
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

# 로그인 요청 제한: 5r/m
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
```

## 🚨 문제 해결

### 일반적인 문제들

#### 1. 포트 충돌
```bash
# 포트 사용 확인
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443

# 충돌하는 서비스 중지
sudo systemctl stop apache2  # 예시
```

#### 2. SSL 인증서 오류
```bash
# 인증서 파일 권한 확인
ls -la ssl/geniduck.org/

# 권한 수정
chmod 644 ssl/geniduck.org/*.pem
chmod 600 ssl/geniduck.org/privkey.pem
```

#### 3. DDNS 업데이트 실패
```bash
# API 토큰 확인
echo $CLOUDFLARE_API_TOKEN

# 수동 테스트
curl -X GET "https://api.cloudflare.com/client/v4/zones" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
```

### 로그 분석

```bash
# 에러 로그 확인
grep "ERROR" logs/geniduck.org.error.log

# 접근 로그 분석
awk '{print $1}' logs/geniduck.org.access.log | sort | uniq -c | sort -nr
```

## 📈 성능 최적화

### Gzip 압축
nginx.conf에서 이미 활성화되어 있습니다.

### 캐싱 설정
정적 파일에 대한 캐싱이 설정되어 있습니다.

### Worker 프로세스
`worker_processes auto;`로 CPU 코어 수에 맞게 자동 설정됩니다.

## 🔄 백업 및 복원

### 자동 백업
- SSL 인증서: 매일 자동 백업
- 로그 파일: 30일 보관
- 백업 파일: 7일 보관

### 수동 백업

```bash
# 전체 설정 백업
tar -czf nginx-backup-$(date +%Y%m%d).tar.gz \
  conf.d/ ssl/ scripts/ .env

# 설정만 백업
cp -r conf.d/ backups/config-$(date +%Y%m%d)
```

## 📞 지원

문제가 발생하면 다음을 확인하세요:

1. 로그 파일 확인
2. nginx 설정 테스트: `./scripts/nginx-manager.sh config-test`
3. 도커 컨테이너 상태: `docker ps`
4. 포트 사용 상태: `netstat -tlnp`

## 📝 변경 이력

- **v1.0.0**: 초기 설정 파일 생성
- 기본 nginx 설정
- DDNS 자동화
- SSL 인증서 자동 갱신
- 관리 스크립트

---

**주의**: 이 설정을 사용하기 전에 모든 IP 주소와 도메인을 실제 값으로 변경해야 합니다.
