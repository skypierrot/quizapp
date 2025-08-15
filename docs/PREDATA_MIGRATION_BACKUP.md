# Predata 마이그레이션 백업 가이드

## 📋 개요

이 문서는 QuizApp 프로젝트의 Predata 마이그레이션 완료 상태를 백업하고 복원하는 과정을 설명합니다. Predata 디렉토리의 HTML 파일들을 파싱하여 데이터베이스에 업로드한 모든 데이터를 안전하게 보호할 수 있습니다.

## 🎯 현재 마이그레이션 상태

### 📊 데이터베이스 현황
- **총 문제 수**: 1,183,619개
- **총 시험 수**: 24,387개
- **총 이미지 수**: 220,387개
- **마이그레이션 상태**: 완료 ✅

### 🔍 마이그레이션 파일 구조
```
drizzle/
├── 0000_rapid_vanisher.sql          # 초기 스키마
├── 0001_plain_jimmy_woo.sql         # 기본 테이블
├── 0002_wonderful_firebrand.sql     # 문제 테이블
├── 0003_minor_the_hand.sql          # 시험 테이블
├── 0004_volatile_jamie_braddock.sql # 이미지 테이블
├── 0005_smart_shen.sql              # 옵션 테이블
├── 0006_flat_secret_warriors.sql    # 최종 마이그레이션
├── meta/
│   ├── _journal.json                # 마이그레이션 기록
│   ├── 0000_snapshot.json           # 스냅샷
│   └── ...
├── schema.ts                        # Drizzle 스키마
└── relations.ts                     # 테이블 관계
```

## 🚀 백업 방법

### 1. 빠른 백업 (권장)

#### **기본 명령어**
```bash
# Predata 마이그레이션 빠른 백업
./scripts/quick-backup-predata.sh
```

#### **백업 결과**
```
🚀 Predata 마이그레이션 빠른 백업 시작: predata_migration_quick_20250813_233630
📊 데이터베이스 통계 수집...
📊 SQL 덤프 생성...
📋 마이그레이션 스크립트 복사...
📋 마이그레이션 파일 복사...
🏗️  스키마 파일 복사...
⚙️  환경 설정 복사...
✅ Predata 마이그레이션 빠른 백업 완료: backups/predata_quick/predata_migration_quick_20250813_233630

🎉 백업 완료 요약
==================
📊 데이터베이스: 1183619개 문제
📚 시험: 24387개
🖼️  이미지: 220387개
📁 백업 크기: 450M
⏰ 백업 시간: Wed Aug 13 23:36:30 UTC 2025
```

### 2. 상세 백업

#### **기본 명령어**
```bash
# Predata 마이그레이션 상세 백업
./scripts/backup-predata-migration.sh "predata_complete_backup"
```

#### **백업 내용**
- ✅ **데이터베이스**: 전체 SQL 덤프
- ✅ **마이그레이션 스크립트**: `migratePredata.ts`
- ✅ **마이그레이션 파일**: `drizzle/` 디렉토리
- ✅ **스키마**: `drizzle.config.ts`, `schema.sql`
- ✅ **환경설정**: `.env` 파일
- ✅ **Predata 구조**: 디렉토리 구조 및 HTML 파일 수
- ✅ **Docker 볼륨**: 선택적 백업

### 3. 수동 백업 (고급 사용자용)

#### **단계별 백업**
```bash
# 1. 백업 디렉토리 생성
mkdir -p backups/manual/$(date +%Y%m%d_%H%M%S)

# 2. 데이터베이스 SQL 덤프
sudo docker exec quizapp-db-dev pg_dump \
    -U postgres \
    -d quizapp \
    --clean --if-exists --create \
    > backups/manual/$(date +%Y%m%d_%H%M%S)/database.sql

# 3. 마이그레이션 파일 복사
cp -r drizzle/ backups/manual/$(date +%Y%m%d_%H%M%S)/

# 4. 스키마 파일 복사
cp drizzle.config.ts schema.sql backups/manual/$(date +%Y%m%d_%H%M%S)/

# 5. 환경 설정 복사
cp .env backups/manual/$(date +%Y%m%d_%H%M%S)/
```

## 🔄 복원 방법

### 1. 자동화된 복원 스크립트 사용 (권장)

#### **기본 명령어**
```bash
# Predata 마이그레이션 백업 복원
./scripts/restore-predata-migration.sh backups/predata_quick/predata_migration_quick_20250813_233630
```

#### **복원 과정**
```
🔄 Predata 마이그레이션 복원 시작...
📁 백업 디렉토리: backups/predata_quick/predata_migration_quick_20250813_233630

📄 백업 정보:
Predata 마이그레이션 빠른 백업 정보
=====================================
백업 시간: Wed Aug 13 23:36:30 UTC 2025
백업 이름: predata_migration_quick_20250813_233630
마이그레이션 상태: 완료 ✅

⚠️  기존 데이터베이스가 덮어써집니다. 계속하시겠습니까? (y/N): y

📊 복원할 SQL 파일: backups/predata_quick/predata_migration_quick_20250813_233630/database.sql
🔄 데이터베이스 복원 중...
✅ 데이터베이스 복원 완료!

마이그레이션 파일도 복원하시겠습니까? (y/N): y
📋 마이그레이션 파일 복원 중...
✅ 마이그레이션 파일 복원 완료!

🎉 Predata 마이그레이션 복원 작업이 완료되었습니다!
```

### 2. 수동 복원 (고급 사용자용)

#### **단계별 복원**
```bash
# 1. 데이터베이스 복원
sudo docker exec -i quizapp-db-dev psql \
    -U postgres \
    -d quizapp \
    < backups/predata_quick/predata_migration_quick_20250813_233630/database.sql

# 2. 마이그레이션 파일 복원
cp -r backups/predata_quick/predata_migration_quick_20250813_233630/drizzle/ .

# 3. 스키마 파일 복원
cp backups/predata_quick/predata_migration_quick_20250813_233630/drizzle.config.ts .
cp backups/predata_quick/predata_migration_quick_20250813_233630/schema.sql .

# 4. 애플리케이션 재시작
docker-compose -f docker-compose.dev.yml restart
```

## 📊 백업 파일 구조

### 빠른 백업 구조
```
backups/predata_quick/
└── predata_migration_quick_20250813_233630/
    ├── database_stats.txt           # 데이터베이스 통계
    ├── database.sql                 # 전체 SQL 덤프
    ├── migratePredata.ts            # 마이그레이션 스크립트
    ├── drizzle/                     # 마이그레이션 파일들
    │   ├── 0000_rapid_vanisher.sql
    │   ├── 0001_plain_jimmy_woo.sql
    │   ├── ...
    │   └── meta/
    ├── drizzle.config.ts            # Drizzle 설정
    ├── schema.sql                   # 스키마 SQL
    ├── .env                         # 환경 설정
    └── backup_info.txt              # 백업 정보
```

### 상세 백업 구조
```
backups/predata_migration/
└── predata_complete_backup_20250813_233630/
    ├── database_stats.txt           # 데이터베이스 통계
    ├── full_database_20250813_233630.sql  # 전체 SQL 덤프
    ├── migratePredata.ts            # 마이그레이션 스크립트
    ├── drizzle/                     # 마이그레이션 파일들
    ├── drizzle.config.ts            # Drizzle 설정
    ├── schema.sql                   # 스키마 SQL
    ├── .env                         # 환경 설정
    ├── predata_directory_structure.txt  # Predata 디렉토리 구조
    ├── total_html_files.txt         # 총 HTML 파일 수
    ├── migration_progress.json      # 마이그레이션 진행상태 (존재시)
    ├── migration_errors.log         # 마이그레이션 에러 로그 (존재시)
    ├── db_volume_20250813_233630.tar.gz  # Docker 볼륨 (선택사항)
    └── backup_info.txt              # 상세 백업 정보
```

## 📈 실제 사용 시나리오

### 시나리오 1: 개발 환경 백업

```bash
# 1. 현재 상태 백업
./scripts/quick-backup-predata.sh

# 2. 개발 작업 진행
# ... 코드 수정, 테스트 등 ...

# 3. 문제 발생 시 복원
./scripts/restore-predata-migration.sh backups/predata_quick/predata_migration_quick_20250813_233630
```

### 시나리오 2: 프로덕션 배포

```bash
# 1. 개발 환경에서 백업
./scripts/backup-predata-migration.sh "production_deployment"

# 2. 프로덕션 서버에 백업 파일 전송
scp -r backups/predata_migration/production_deployment_20250813_233630/ user@prod-server:/backups/

# 3. 프로덕션에서 복원
./scripts/restore-predata-migration.sh /backups/production_deployment_20250813_233630
```

### 시나리오 3: 마이그레이션 테스트

```bash
# 1. 현재 상태 백업
./scripts/quick-backup-predata.sh

# 2. 새로운 마이그레이션 테스트
npx tsx scripts/migratePredata.ts --targetExamName=테스트시험 --dry-run

# 3. 테스트 결과 확인 후 원래 상태로 복원
./scripts/restore-predata-migration.sh backups/predata_quick/predata_migration_quick_20250813_233630
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

#### **2. 백업 파일을 찾을 수 없는 경우**
```bash
# 백업 디렉토리 확인
ls -la backups/predata_quick/
ls -la backups/predata_migration/

# 백업 파일 검색
find backups/ -name "*.sql" -type f
```

#### **3. 복원 후 데이터가 보이지 않는 경우**
```bash
# 데이터베이스 연결 확인
sudo docker exec quizapp-db-dev psql -U postgres -d quizapp -c "SELECT COUNT(*) FROM questions;"

# 마이그레이션 상태 확인
sudo docker exec quizapp-db-dev psql -U postgres -d quizapp -c "SELECT * FROM drizzle.__drizzle_migrations;"

# 필요시 컨테이너 재시작
docker-compose -f docker-compose.dev.yml restart
```

### 백업 크기 최적화

#### **백업 크기 확인**
```bash
# 현재 백업 크기
du -sh backups/predata_quick/*/
du -sh backups/predata_migration/*/

# 데이터베이스 크기 확인
sudo docker exec quizapp-db-dev psql -U postgres -d quizapp -c "
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

## 📈 모니터링 및 유지보수

### 정기 백업 스케줄링

#### **Cron 작업 설정**
```bash
# crontab 편집
crontab -e

# 매일 새벽 2시에 백업 (예시)
0 2 * * * cd /home/guri/develop/quizapp && ./scripts/quick-backup-predata.sh

# 매주 일요일 새벽 3시에 상세 백업 (예시)
0 3 * * 0 cd /home/guri/develop/quizapp && ./scripts/backup-predata-migration.sh "weekly_backup"
```

#### **백업 정리**
```bash
# 30일 이상 된 백업 파일 삭제
find backups/predata_quick -type d -mtime +30 -exec rm -rf {} \;
find backups/predata_migration -type d -mtime +30 -exec rm -rf {} \;

# 백업 디렉토리 크기 확인
du -sh backups/predata_quick/
du -sh backups/predata_migration/
```

### 백업 검증

#### **백업 파일 무결성 확인**
```bash
# SQL 파일 내용 확인
head -20 backups/predata_quick/predata_migration_quick_20250813_233630/database.sql

# 마이그레이션 파일 확인
ls -la backups/predata_quick/predata_migration_quick_20250813_233630/drizzle/

# 백업 정보 확인
cat backups/predata_quick/predata_migration_quick_20250813_233630/backup_info.txt
```

## 🔒 보안 고려사항

### 백업 파일 보안

#### **접근 권한 설정**
```bash
# 백업 디렉토리 권한 설정
chmod 700 backups/predata_quick/
chmod 700 backups/predata_migration/

# 백업 파일 권한 설정
find backups/ -type f -exec chmod 600 {} \;
```

#### **백업 파일 암호화 (선택사항)**
```bash
# GPG로 백업 파일 암호화
gpg --encrypt --recipient your-email@example.com backups/predata_quick/predata_migration_quick_20250813_233630/database.sql

# 암호화된 파일 복원
gpg --decrypt database.sql.gpg > database.sql
```

## 📚 추가 리소스

### 관련 문서
- [Docker 볼륨 백업/복원 가이드](./DOCKER_VOLUME_BACKUP_RESTORE.md)
- [QuizApp 마이그레이션 가이드](./MIGRATION_GUIDE.md)
- [Drizzle ORM 공식 문서](https://orm.drizzle.team/)

### 유용한 명령어
```bash
# 마이그레이션 상태 확인
npx drizzle-kit studio

# 데이터베이스 연결 테스트
sudo docker exec quizapp-db-dev psql -U postgres -d quizapp -c "SELECT version();"

# 마이그레이션 기록 확인
sudo docker exec quizapp-db-dev psql -U postgres -d quizapp -c "SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at DESC;"
```

## 🎯 결론

Predata 마이그레이션 백업은 QuizApp 프로젝트의 핵심 데이터를 안전하게 보호하는 필수적인 과정입니다.

**주요 이점:**
- ✅ **완벽한 데이터 보존**: 1,183,619개 문제 모두 보존
- ✅ **마이그레이션 상태 보존**: 7개 마이그레이션 파일 모두 보존
- ✅ **빠른 복원**: 자동화된 스크립트로 간편한 복원
- ✅ **다양한 백업 옵션**: 빠른 백업부터 상세 백업까지

정기적인 백업을 통해 마이그레이션 완료 상태를 보존하고, 언제든지 안전하게 시스템을 복구할 수 있습니다.

