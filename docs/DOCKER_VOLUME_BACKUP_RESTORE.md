# Docker 볼륨 백업/복원 가이드

## 📋 개요

이 문서는 QuizApp 프로젝트의 Docker 볼륨 백업/복원 과정을 설명합니다. Docker 볼륨을 사용하여 데이터베이스의 모든 데이터를 안전하게 백업하고, 필요시 완벽하게 복원할 수 있습니다.

## 🎯 왜 Docker 볼륨 백업인가?

### ✅ 장점
- **완벽한 데이터 보존**: 1,183,619개 문제, 24,387개 시험, 220,387개 이미지 모두 보존
- **컨테이너 독립성**: 컨테이너 재빌드/재시작해도 데이터 유지
- **빠른 복원**: SQL 덤프보다 빠른 복원 속도
- **파일 시스템 레벨**: PostgreSQL 데이터 파일을 직접 백업

### 🔍 현재 프로젝트 설정
```yaml
# docker-compose.dev.yml
volumes:
  db_data_dev:  # PostgreSQL 데이터 저장소

services:
  quizapp-db:
    volumes:
      - db_data_dev:/var/lib/postgresql/data  # PostgreSQL 데이터 디렉토리
```

## 🚀 백업 과정

### 1. 자동화된 백업 스크립트 사용 (권장)

#### **기본 백업**
```bash
# 현재 상태 백업
./scripts/backup-restore-volume.sh backup
```

#### **백업 결과**
```
🚀 Docker 볼륨 백업 시작...
📦 볼륨: quizapp_db_data_dev
📁 백업 경로: backups/volumes/quizapp_db_data_dev_20250813_233630.tar.gz
📊 볼륨 데이터 압축 중...
✅ 볼륨 백업 완료: backups/volumes/quizapp_db_data_dev_20250813_233630.tar.gz
📊 백업 크기: 400M
📄 백업 정보: backups/volumes/volume_backup_info_20250813_233630.txt
```

### 2. 수동 백업 (고급 사용자용)

#### **직접 명령어 실행**
```bash
# 백업 디렉토리 생성
mkdir -p backups/volumes

# 볼륨 백업
sudo docker run --rm \
    -v quizapp_db_data_dev:/data \
    -v $(pwd)/backups/volumes:/backup \
    alpine tar czf "/backup/quizapp_db_$(date +%Y%m%d_%H%M%S).tar.gz" -C /data .
```

### 3. 백업 파일 구조

```
backups/volumes/
├── quizapp_db_data_dev_20250813_233630.tar.gz    # 메인 백업 파일 (400MB)
├── volume_backup_info_20250813_233630.txt        # 백업 정보
└── ...
```

#### **백업 정보 파일 내용**
```
Docker 볼륨 백업 정보
=====================
백업 시간: Wed 13 Aug 2025 11:37:13 PM UTC
볼륨 이름: quizapp_db_data_dev
백업 파일: quizapp_db_data_dev_20250813_233630.tar.gz
백업 크기: 400M

복원 방법:
1. 컨테이너 중지: docker-compose -f docker-compose.dev.yml down
2. 볼륨 복원: ./scripts/backup-restore-volume.sh restore quizapp_db_data_dev_20250813_233630.tar.gz
3. 컨테이너 시작: docker-compose -f docker-compose.dev.yml up -d
```

## 🔄 복원 과정

### 1. 자동화된 복원 스크립트 사용 (권장)

#### **기본 복원**
```bash
# 백업 파일로 복원
./scripts/backup-restore-volume.sh restore backups/volumes/quizapp_db_data_dev_20250813_233630.tar.gz
```

#### **복원 과정**
```
🔄 Docker 볼륨 복원 시작...
📦 볼륨: quizapp_db_data_dev
📁 백업 파일: quizapp_db_data_dev_20250813_233630.tar.gz

⚠️  기존 볼륨 데이터가 덮어써집니다. 계속하시겠습니까? (y/N): y

🛑 컨테이너 중지 중...
기존 볼륨을 제거하고 새로 생성하시겠습니까? (y/N): y
🗑️  기존 볼륨 제거 중...
🚀 새 컨테이너 시작 중...
⏳ PostgreSQL 초기화 대기 중...
📊 볼륨 데이터 복원 중...
✅ 볼륨 복원 완료!
🔄 컨테이너 재시작 중...
📊 복원 확인 중...

 table_name | count  
------------+--------
 questions  | 1183619
 exams      |  24387
 images     | 220387

🎉 볼륨 복원 완료!
```

### 2. 수동 복원 (고급 사용자용)

#### **단계별 복원 과정**
```bash
# 1. 컨테이너 중지
docker-compose -f docker-compose.dev.yml down

# 2. 기존 볼륨 제거 (선택사항)
sudo docker volume rm quizapp_db_data_dev

# 3. 새 컨테이너 시작 (빈 볼륨 생성)
docker-compose -f docker-compose.dev.yml up -d quizapp-db

# 4. PostgreSQL 초기화 대기
sleep 10

# 5. 백업 데이터 복원
sudo docker run --rm \
    -v quizapp_db_data_dev:/data \
    -v $(pwd):/backup \
    alpine sh -c "cd /data && tar xzf /backup/backups/volumes/quizapp_db_data_dev_20250813_233630.tar.gz"

# 6. 컨테이너 재시작
docker-compose -f docker-compose.dev.yml restart
```

## 📊 실제 사용 시나리오

### 시나리오 1: 개발 환경 재빌드

```bash
# 1. 현재 상태 백업
./scripts/backup-restore-volume.sh backup

# 2. 시스템 재빌드
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d --build

# 3. 백업된 데이터 복원
./scripts/backup-restore-volume.sh restore backups/volumes/quizapp_db_data_dev_20250813_233630.tar.gz
```

### 시나리오 2: 프로덕션 배포

```bash
# 1. 개발 환경에서 백업
./scripts/backup-restore-volume.sh backup

# 2. 프로덕션 서버에 백업 파일 전송
scp backups/volumes/quizapp_db_data_dev_*.tar.gz user@prod-server:/backups/

# 3. 프로덕션에서 복원
./scripts/backup-restore-volume.sh restore quizapp_db_data_dev_20250813_233630.tar.gz
```

### 시나리오 3: 데이터 마이그레이션 테스트

```bash
# 1. 현재 상태 백업
./scripts/backup-restore-volume.sh backup

# 2. 마이그레이션 테스트 실행
npx tsx scripts/migratePredata.ts --targetExamName=테스트시험

# 3. 테스트 결과 확인 후 원래 상태로 복원
./scripts/backup-restore-volume.sh restore backups/volumes/quizapp_db_data_dev_20250813_233630.tar.gz
```

## 🛠️ 문제 해결

### 일반적인 문제들

#### **1. 권한 문제**
```bash
# Docker 소켓 접근 권한 오류
sudo docker exec quizapp-db-dev psql -U postgres -d quizapp -c "SELECT 1"

# 또는 사용자를 docker 그룹에 추가
sudo usermod -aG docker $USER
newgrp docker
```

#### **2. 볼륨을 찾을 수 없는 경우**
```bash
# 볼륨 목록 확인
sudo docker volume ls | grep quizapp

# 볼륨 상세 정보 확인
sudo docker volume inspect quizapp_db_data_dev
```

#### **3. 복원 후 데이터가 보이지 않는 경우**
```bash
# PostgreSQL 서비스 상태 확인
sudo docker exec quizapp-db-dev pg_isready

# 데이터베이스 연결 테스트
sudo docker exec quizapp-db-dev psql -U postgres -d quizapp -c "SELECT COUNT(*) FROM questions;"

# 필요시 컨테이너 재시작
docker-compose -f docker-compose.dev.yml restart
```

### 백업 크기 최적화

#### **백업 크기 확인**
```bash
# 현재 백업 크기
du -sh backups/volumes/*.tar.gz

# 볼륨 크기 확인
sudo docker system df -v | grep quizapp_db_data_dev
```

#### **백업 압축 최적화**
```bash
# 더 높은 압축률 (시간은 더 오래 걸림)
sudo docker run --rm \
    -v quizapp_db_data_dev:/data \
    -v $(pwd)/backups:/backup \
    alpine tar cJf "/backup/quizapp_db_$(date +%Y%m%d_%H%M%S).tar.xz" -C /data .
```

## 📈 모니터링 및 유지보수

### 정기 백업 스케줄링

#### **Cron 작업 설정**
```bash
# crontab 편집
crontab -e

# 매일 새벽 2시에 백업 (예시)
0 2 * * * cd /home/guri/develop/quizapp && ./scripts/backup-restore-volume.sh backup

# 매주 일요일 새벽 3시에 백업 (예시)
0 3 * * 0 cd /home/guri/develop/quizapp && ./scripts/backup-restore-volume.sh backup
```

#### **백업 정리**
```bash
# 30일 이상 된 백업 파일 삭제
find backups/volumes -name "*.tar.gz" -mtime +30 -delete

# 백업 디렉토리 크기 확인
du -sh backups/volumes/
```

### 백업 검증

#### **백업 파일 무결성 확인**
```bash
# tar 파일 내용 확인
tar -tzf backups/volumes/quizapp_db_data_dev_20250813_233630.tar.gz | head -20

# 백업 파일 크기 확인
ls -lh backups/volumes/quizapp_db_data_dev_20250813_233630.tar.gz
```

## 🔒 보안 고려사항

### 백업 파일 보안

#### **접근 권한 설정**
```bash
# 백업 디렉토리 권한 설정
chmod 700 backups/volumes/

# 백업 파일 권한 설정
chmod 600 backups/volumes/*.tar.gz
```

#### **백업 파일 암호화 (선택사항)**
```bash
# GPG로 백업 파일 암호화
gpg --encrypt --recipient your-email@example.com backups/volumes/quizapp_db_data_dev_20250813_233630.tar.gz

# 암호화된 파일 복원
gpg --decrypt quizapp_db_data_dev_20250813_233630.tar.gz.gpg | tar xzf -
```

## 📚 추가 리소스

### 관련 문서
- [Docker 볼륨 관리 공식 문서](https://docs.docker.com/storage/volumes/)
- [PostgreSQL 백업/복원 가이드](https://www.postgresql.org/docs/current/backup.html)
- [QuizApp 마이그레이션 가이드](./MIGRATION_GUIDE.md)

### 유용한 명령어
```bash
# 볼륨 사용량 확인
sudo docker system df -v

# 컨테이너 로그 확인
docker-compose -f docker-compose.dev.yml logs quizapp-db

# PostgreSQL 상태 확인
sudo docker exec quizapp-db-dev pg_isready -U postgres -d quizapp
```

## 🎯 결론

Docker 볼륨 백업/복원은 QuizApp 프로젝트의 데이터를 안전하게 보호하는 가장 효과적인 방법입니다. 

**주요 이점:**
- ✅ **완벽한 데이터 보존**: 1,183,619개 문제 모두 보존
- ✅ **빠른 복원**: SQL 덤프보다 빠른 복원 속도
- ✅ **자동화**: 스크립트를 통한 간편한 백업/복원
- ✅ **안전성**: 컨테이너 재빌드해도 데이터 유지

정기적인 백업을 통해 데이터 손실 위험을 최소화하고, 언제든지 안전하게 시스템을 복구할 수 있습니다.

