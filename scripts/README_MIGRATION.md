# 🚀 개선된 Predata 마이그레이션 스크립트

## 📋 개요

이 스크립트는 중단된 predata 마이그레이션을 스마트하게 재시작할 수 있도록 개선되었습니다. 데이터베이스 기반 진행상태 추적, 중복 처리 방지, 에러 복구 메커니즘을 제공합니다.

## ✨ 주요 개선사항

### 🔄 **스마트 재시작 시스템**
- **데이터베이스 기반 진행상태 확인**: 이미 처리된 파일을 자동으로 식별
- **중복 처리 방지**: `--skip-processed` 옵션으로 이미 처리된 파일 스킵
- **진행률 추적**: 실시간 진행률 및 예상 완료 시간 표시

### 🛡️ **에러 처리 및 복구**
- **상세한 에러 로깅**: `migration_errors.log` 파일에 에러 정보 저장
- **자동 재시도**: `--retry-failed` 옵션으로 실패한 파일 재처리
- **데이터베이스 부하 방지**: 에러 발생 시 자동 대기

### 📊 **모니터링 및 통계**
- **데이터베이스 통계**: 현재 등록된 문제 수, 시험 수 표시
- **진행상태 저장**: `migration_progress.json` 파일에 진행상태 저장
- **성능 메트릭**: 파일별 처리 시간 및 전체 예상 완료 시간

## 🚀 사용법

### 기본 명령어

```bash
# 특정 시험의 모든 파일 처리 (중복 스킵)
npx tsx scripts/migratePredata.ts --targetExamName=건설안전기사 --skip-processed

# 중단된 지점부터 재개
npx tsx scripts/migratePredata.ts --resume --targetExamName=건설안전기사

# 강제로 모든 파일 재처리
npx tsx scripts/migratePredata.ts --force --targetExamName=건설안전기사

# 테스트 실행 (데이터베이스에 저장하지 않음)
npx tsx scripts/migratePredata.ts --targetExamName=건설안전기사 --dry-run

# 파일 수 제한하여 테스트
npx tsx scripts/migratePredata.ts --targetExamName=건설안전기사 --limit=10 --dry-run
```

### 고급 옵션

```bash
# 이미 처리된 파일 스킵 (기본값: true)
npx tsx scripts/migratePredata.ts --targetExamName=건설안전기사 --skip-processed

# 실패한 파일 재시도
npx tsx scripts/migratePredata.ts --targetExamName=건설안전기사 --retry-failed

# 단일 파일 처리
npx tsx scripts/migratePredata.ts --singleFile=건설안전기사/2024-01-15_result.html

# 파싱만 테스트 (데이터베이스 연결 없음)
npx tsx scripts/migratePredata.ts --parse-only --singleFile=건설안전기사/2024-01-15_result.html
```

## 📁 파일 구조

```
scripts/
├── migratePredata.ts          # 개선된 마이그레이션 스크립트
├── migratePredata.ts.backup   # 기존 스크립트 백업
├── migration_progress.json    # 진행상태 저장 파일 (자동 생성)
├── migration_errors.log       # 에러 로그 파일 (자동 생성)
└── README_MIGRATION.md        # 이 파일
```

## 🔧 주요 기능 설명

### 1. 스마트 파일 스킵
- 데이터베이스에서 이미 처리된 시험명 확인
- 해당 시험의 HTML 파일들을 자동으로 스킵
- 진행상태 파일과 데이터베이스 상태 동기화

### 2. 진행상태 추적
- 실시간 진행률 표시 (예: 45/150 (30.00%))
- 예상 완료 시간 계산
- 경과 시간 및 남은 시간 표시

### 3. 에러 처리
- 파일별 에러 정보 상세 로깅
- 에러 발생 시 자동 대기 (데이터베이스 부하 방지)
- 실패한 파일 목록 관리

### 4. 성능 최적화
- 이미 처리된 파일 자동 스킵으로 불필요한 작업 방지
- 배치 처리로 데이터베이스 연결 효율성 향상
- 메모리 사용량 최적화

## 📊 진행상태 모니터링

### 진행상태 파일 (`migration_progress.json`)
```json
{
  "lastUpdated": "2024-08-13T13:45:00.000Z",
  "totalFiles": 150,
  "processedFiles": 45,
  "failedFiles": ["file1.html", "file2.html"],
  "successfulFiles": ["file3.html", "file4.html"],
  "currentFile": "file5.html",
  "startTime": "2024-08-13T13:00:00.000Z",
  "estimatedTimeRemaining": "2024-08-13T15:30:00.000Z",
  "databaseStats": {
    "totalQuestions": 348505,
    "totalExams": 293,
    "lastProcessedExam": "건설안전기사"
  }
}
```

### 에러 로그 파일 (`migration_errors.log`)
```
[2024-08-13T13:45:00.000Z] /path/to/file.html: Error message
Context: Processing failed at 2024-08-13T13:45:00.000Z
Stack trace...
---
```

## 🚨 주의사항

1. **백업 필수**: 마이그레이션 전 기존 스크립트 백업
2. **테스트 권장**: `--dry-run` 옵션으로 먼저 테스트
3. **데이터베이스 연결**: 도커 컨테이너 내에서 실행
4. **권한 확인**: 파일 읽기/쓰기 권한 확인

## 🔍 문제 해결

### 일반적인 문제들

1. **"No target specified" 에러**
   - `--targetExamName` 또는 `--singleFile` 옵션 확인
   - 옵션 순서 및 형식 확인

2. **데이터베이스 연결 실패**
   - 도커 컨테이너 상태 확인
   - 데이터베이스 서비스 실행 상태 확인

3. **권한 오류**
   - 파일 및 디렉토리 권한 확인
   - 도커 컨테이너 내 사용자 권한 확인

### 디버깅

```bash
# 상세한 로그 출력
npx tsx scripts/migratePredata.ts --targetExamName=건설안전기사 --limit=1 --dry-run

# 진행상태 파일 확인
cat scripts/migration_progress.json

# 에러 로그 확인
tail -f scripts/migration_errors.log
```

## 📈 성능 팁

1. **배치 크기 조정**: `--limit` 옵션으로 적절한 배치 크기 설정
2. **스킵 옵션 활용**: `--skip-processed`로 중복 작업 방지
3. **모니터링**: 진행상태 파일을 통한 실시간 모니터링
4. **에러 분석**: 에러 로그를 통한 문제점 파악 및 해결

## 🤝 지원

문제가 발생하거나 추가 기능이 필요한 경우:
1. 에러 로그 파일 확인
2. 진행상태 파일 분석
3. `--dry-run` 옵션으로 테스트
4. 필요시 기존 백업 파일로 복구

---

**마지막 업데이트**: 2024-08-13
**버전**: 2.0.0 (개선된 버전)
