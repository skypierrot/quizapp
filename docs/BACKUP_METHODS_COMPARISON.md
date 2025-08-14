# QuizApp 백업 방법 비교 및 증분 백업 가이드

## 📋 개요

이 문서는 QuizApp 프로젝트에서 사용할 수 있는 다양한 백업 방법을 비교하고, 증분 백업의 구현 방법을 설명합니다.

## 🔄 백업 방법 비교

### 📊 백업 방법별 상세 비교

| 방법 | 백업 유형 | 백업 크기 | 백업 시간 | 복원 시간 | 데이터 보존 | 용도 |
|------|-----------|-----------|-----------|-----------|-------------|------|
| **Docker 볼륨** | 전체 백업 | 400MB | 2-3분 | 1-2분 | 완벽 | 전체 시스템 백업 |
| **SQL 덤프** | 전체 백업 | 450MB+ | 5-10분 | 10-20분 | 완벽 | 데이터베이스 백업 |
| **마이그레이션** | 구조 백업 | 50MB | 1분 | 1분 | 구조만 | 개발 환경 백업 |
| **증분 백업** | 증분 + 전체 | 50MB + 450MB | 1분 + 5분 | 5-10분 | 완벽 | 정기 백업 |

### 🎯 각 방법의 특징

#### **1. Docker 볼륨 백업 (전체)**
```bash
./scripts/backup-restore-volume.sh backup
```

**장점:**
- ✅ 가장 빠른 복원 (1-2분)
- ✅ PostgreSQL 데이터 파일 직접 백업
- ✅ 컨테이너 재빌드 후에도 완벽 복구
- ✅ 400MB로 전체 데이터 보존

**단점:**
- ❌ 매번 전체 백업 (크기 변화 없음)
- ❌ 백업 시간이 일정 (2-3분)
- ❌ 호스트 시스템에 의존적

**용도:** 전체 시스템 백업, 프로덕션 배포 전 백업

#### **2. SQL 덤프 백업 (전체)**
```bash
./scripts/quick-backup-predata.sh
```

**장점:**
- ✅ 표준 PostgreSQL 방식
- ✅ 다른 PostgreSQL 서버로 이전 가능
- ✅ 데이터베이스 구조와 데이터 모두 보존
- ✅ 호환성 우수

**단점:**
- ❌ 매번 전체 백업 (크기 변화 없음)
- ❌ 복원 시간이 오래 걸림 (10-20분)
- ❌ 백업 시간이 오래 걸림 (5-10분)

**용도:** 데이터베이스 마이그레이션, 다른 서버로 이전

#### **3. 마이그레이션 백업 (구조)**
```bash
./scripts/backup-predata-migration.sh "backup_name"
```

**장점:**
- ✅ 마이그레이션 파일과 스키마 보존
- ✅ 빠른 백업 (1분 이내)
- ✅ 작은 백업 크기 (50MB)
- ✅ 버전 관리와 연동

**단점:**
- ❌ 실제 데이터는 백업하지 않음
- ❌ 데이터 복원 시 마이그레이션 재실행 필요
- ❌ 완전한 복구가 어려움

**용도:** 개발 환경 백업, 스키마 변경 관리

#### **4. 증분 백업 (혼합)**
```bash
./scripts/incremental-backup.sh backup "backup_name"
```

**장점:**
- ✅ 베이스 백업 + 변경사항만 백업
- ✅ 정기 백업 시 시간과 공간 절약
- ✅ WAL 아카이브로 트랜잭션 로그 보존
- ✅ Point-in-time 복구 가능

**단점:**
- ❌ 복잡한 복원 과정
- ❌ 베이스 백업과 증분 백업 모두 필요
- ❌ 설정이 복잡함

**용도:** 정기 백업, 대용량 데이터베이스 관리

## 🚀 증분 백업 구현

### 📁 증분 백업 구조

```
backups/incremental/
├── base/                           # 베이스 백업 (전체)
│   ├── base_backup.sql            # 전체 데이터베이스 덤프
│   └── base_backup_info.txt       # 베이스 백업 정보
├── incremental/                    # 증분 백업 (변경사항)
│   ├── incremental_20250813_233630.csv
│   ├── incremental_20250813_233630_info.txt
│   └── ...
└── wal_archive/                    # WAL 아카이브 (트랜잭션 로그)
    ├── 000000010000000000000001
    ├── 000000010000000000000002
    └── ...
```

### 🔧 증분 백업 작동 원리

#### **1. 베이스 백업 (Base Backup)**
- **시점**: 증분 백업 시작 시 한 번만 생성
- **내용**: 전체 데이터베이스의 완전한 스냅샷
- **크기**: 450MB+ (전체 데이터)
- **용도**: 증분 백업의 기준점

#### **2. 증분 백업 (Incremental Backup)**
- **시점**: 정기적으로 (매일, 매주 등)
- **내용**: 마지막 백업 이후 변경된 데이터만
- **크기**: 1-10MB (변경사항에 따라)
- **용도**: 베이스 백업 이후의 변경사항 보존

#### **3. WAL 아카이브 (Write-Ahead Log)**
- **시점**: 실시간으로 생성
- **내용**: 모든 데이터베이스 변경사항의 로그
- **크기**: 매우 작음 (KB 단위)
- **용도**: Point-in-time 복구, 트랜잭션 무결성

### 📊 증분 백업 vs 전체 백업 크기 비교

#### **전체 백업 (매일)**
```
Day 1: 450MB
Day 2: 450MB
Day 3: 450MB
Day 4: 450MB
Day 5: 450MB
Total: 2.25GB (5일)
```

#### **증분 백업 (베이스 + 증분)**
```
Day 1: 450MB (베이스)
Day 2: 5MB (증분)
Day 3: 3MB (증분)
Day 4: 7MB (증분)
Day 5: 4MB (증분)
Total: 469MB (5일)
```

**절약 효과:** 5일 기준 **80% 공간 절약** (2.25GB → 469MB)

## 🔄 증분 백업 사용법

### 1. 초기 설정 (베이스 백업)

```bash
# 첫 번째 증분 백업 (베이스 백업 생성)
./scripts/incremental-backup.sh backup "initial_backup"
```

**결과:**
```
🚀 PostgreSQL 증분 백업 시작...
📦 백업 이름: initial_backup
📊 베이스 백업 생성 중...
✅ 베이스 백업 완료: backups/incremental/base/base_backup.sql
📊 증분 백업 생성 중...
✅ 증분 백업 완료: backups/incremental/incremental_20250813_233630_info.txt

📊 백업 크기 요약:
   베이스 백업: 450M
   증분 백업: 5M
   WAL 아카이브: 2M
   전체 백업: 457M
```

### 2. 정기 증분 백업

```bash
# 두 번째부터는 증분 백업만 생성
./scripts/incremental-backup.sh backup "daily_backup_$(date +%Y%m%d)"
```

**결과:**
```
🚀 PostgreSQL 증분 백업 시작...
📦 백업 이름: daily_backup_20250813
⏭️  베이스 백업이 이미 존재합니다.
📊 증분 백업 생성 중...
✅ 증분 백업 완료: backups/incremental/incremental_20250813_233630_info.txt

📊 백업 크기 요약:
   베이스 백업: 450M
   증분 백업: 8M
   WAL 아카이브: 5M
   전체 백업: 463M
```

### 3. 증분 백업 복원

```bash
# 베이스 백업 + 증분 백업 복원
./scripts/incremental-backup.sh restore "daily_backup_20250813"
```

**결과:**
```
🔄 PostgreSQL 증분 백업 복원 시작...
📦 백업 이름: daily_backup_20250813
📊 베이스 백업 복원 중...
📊 증분 백업 복원 중...
📋 최신 증분 백업 복원: incremental_20250813_233630_info.txt
📊 증분 데이터 복원 중...
✅ 증분 백업 복원 완료!

📊 복원 확인 중...
 table_name | count  
------------+--------
 questions  | 1183619
 exams      |  24387
 images     | 220387
```

## 📈 백업 전략 및 권장사항

### 🎯 상황별 백업 방법 선택

#### **개발 환경**
```bash
# 1. 초기 설정 시
./scripts/incremental-backup.sh backup "dev_initial"

# 2. 정기 백업 (매일)
./scripts/incremental-backup.sh backup "dev_daily_$(date +%Y%m%d)"

# 3. 코드 변경 전 안전장치
./scripts/backup-restore-volume.sh backup
```

#### **프로덕션 환경**
```bash
# 1. 배포 전 전체 백업
./scripts/backup-restore-volume.sh backup

# 2. 정기 백업 (매주)
./scripts/incremental-backup.sh backup "prod_weekly_$(date +%Y%m%d)"

# 3. 월간 전체 백업
./scripts/backup-restore-volume.sh backup
```

#### **테스트 환경**
```bash
# 1. 테스트 전 백업
./scripts/quick-backup-predata.sh

# 2. 테스트 후 복원
./scripts/restore-predata-migration.sh backups/predata_quick/backup_name
```

### 📅 백업 스케줄 권장사항

#### **Cron 작업 설정**
```bash
# crontab 편집
crontab -e

# 매일 새벽 2시에 증분 백업
0 2 * * * cd /home/guri/develop/quizapp && ./scripts/incremental-backup.sh backup "daily_$(date +%Y%m%d)"

# 매주 일요일 새벽 3시에 전체 백업
0 3 * * 0 cd /home/guri/develop/quizapp && ./scripts/backup-restore-volume.sh backup

# 매월 첫째 주 일요일 새벽 4시에 베이스 백업 갱신
0 4 1-7 * 0 cd /home/guri/develop/quizapp && ./scripts/incremental-backup.sh backup "monthly_base_$(date +%Y%m)"
```

## 🛠️ 문제 해결 및 최적화

### 일반적인 문제들

#### **1. WAL 설정 실패**
```bash
# PostgreSQL 설정 파일 직접 수정
sudo docker exec -it quizapp-db-dev bash
echo "wal_level = replica" >> /var/lib/postgresql/data/postgresql.conf
echo "archive_mode = on" >> /var/lib/postgresql/data/postgresql.conf
echo "archive_command = 'cp %p /backup/wal_archive/%f'" >> /var/lib/postgresql/data/postgresql.conf
exit
docker-compose -f docker-compose.dev.yml restart quizapp-db
```

#### **2. 증분 백업 크기 최적화**
```bash
# 변경된 데이터만 정확히 추출
sudo docker exec quizapp-db-dev psql -U postgres -d quizapp -c "
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    last_vacuum,
    last_autovacuum
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

#### **3. 백업 압축 최적화**
```bash
# 더 높은 압축률 (시간은 더 오래 걸림)
sudo docker run --rm \
    -v quizapp_db_data_dev:/data \
    -v $(pwd)/backups:/backup \
    alpine tar cJf "/backup/quizapp_db_$(date +%Y%m%d_%H%M%S).tar.xz" -C /data .
```

## 🎯 결론

### 📊 백업 방법 선택 가이드

#### **전체 백업이 적합한 경우:**
- ✅ **초기 설정 시**: 시스템 구축 후 첫 백업
- ✅ **주요 변경 전**: 코드 배포, 스키마 변경 전
- ✅ **월간 백업**: 정기적인 전체 시스템 백업
- ✅ **프로덕션 배포**: 안전한 배포를 위한 백업

#### **증분 백업이 적합한 경우:**
- ✅ **일일 백업**: 정기적인 데이터 보호
- ✅ **개발 환경**: 자주 변경되는 개발 데이터
- ✅ **저장 공간 절약**: 백업 크기 최적화 필요
- ✅ **빠른 백업**: 백업 시간 단축 필요

### 🚀 권장 백업 전략

```bash
# 1. 초기 설정 (베이스 백업)
./scripts/incremental-backup.sh backup "initial_setup"

# 2. 정기 증분 백업 (매일)
./scripts/incremental-backup.sh backup "daily_$(date +%Y%m%d)"

# 3. 안전장치 백업 (주요 변경 전)
./scripts/backup-restore-volume.sh backup

# 4. 월간 전체 백업 (베이스 갱신)
./scripts/incremental-backup.sh backup "monthly_base_$(date +%Y%m)"
```

이 전략을 통해 **시간과 공간을 절약하면서도 안전한 데이터 보호**를 실현할 수 있습니다! 🎉

