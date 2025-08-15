# 기술자격시험 학습 플랫폼

대한민국 기술 자격시험의 공개된 문제를 저장하고 관리하여, 사용자가 효과적으로 학습하고 시험을 준비할 수 있도록 지원하는 웹 플랫폼입니다.

## 주요 기능

- **회원 관리**: 회원가입, 로그인(Clerk 사용)
- **게시판**: 공지사항, 학습 정보 공유
- **문제 관리**: 
  - 문제 출제, 수정 및 삭제
  - 다중 문제 복사 및 붙여넣기 지원(텍스트, 이미지)
  - 문제와 선택지 구분하여 입력
  - 태그 관리(년도, 과목, 유형, 회차)
- **학습 및 시험 관리**:
  - 태그별, 회차별 문제 선택 풀이 기능
  - 국가시험 양식 기반 시험 화면
  - 시험 결과 저장 및 오답 관리, 오답 반복 학습
- **모바일 접근성**: 한 화면당 한 문제씩 제공하는 시험 화면 구성

## 기술 스택

- **프론트엔드**: Next.js(App Router), TypeScript, TailwindCSS, ShadCN
- **백엔드**: Next.js Route Handler, Clerk 인증
- **데이터베이스**: PostgreSQL(Drizzle ORM 사용)
- **환경 관리**: Docker, Docker Compose

## 시작하기

1. 저장소 클론
```bash
git clone https://github.com/your-username/quizapp.git
cd quizapp
```

2. 환경 변수 설정
```bash
cp .env.example .env
# .env 파일을 편집하여 필요한 환경 변수 설정
```

3. Docker Compose로 실행
```bash
docker-compose up -d
```

4. 웹 브라우저에서 접속
```
http://localhost:3772
```

## 개발 환경 설정

로컬에서 개발하려면:

```bash
npm install
npm run dev
```

## 백업 시스템

QuizApp은 다양한 백업 방법을 통해 데이터를 안전하게 보호합니다.

### 🚀 빠른 백업
```bash
# Predata 마이그레이션 백업
./scripts/quick-backup-predata.sh

# Docker 볼륨 백업
./scripts/backup-restore-volume.sh backup
```

### 📚 상세 가이드
- [백업 시스템 전체 개요](./docs/BACKUP_SYSTEM_OVERVIEW.md)
- [Docker 볼륨 백업/복원 가이드](./docs/DOCKER_VOLUME_BACKUP_RESTORE.md)
- [Predata 마이그레이션 백업 가이드](./docs/PREDATA_MIGRATION_BACKUP.md)

### 📊 현재 데이터 현황
- **총 문제 수**: 1,183,619개
- **총 시험 수**: 24,387개
- **총 이미지 수**: 220,387개
- **마이그레이션 상태**: 완료 ✅

## 라이센스

이 프로젝트는 MIT 라이센스를 따릅니다. 

## 10. Docker Compose 설정

### 10.1 Production (`docker-compose.yml`)
```yaml
version: '3.8'
services:
  web:
    build: .
    container_name: quizapp
    environment:
      DATABASE_URL: ${DATABASE_URL}
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      CLERK_SECRET_KEY: ${CLERK_SECRET_KEY}
    ports:
      - "3772:3000"
    volumes:
      - ./public/images:/app/public/images
      - ./public/uploads:/app/public/uploads
    networks:
      - ngnet
    depends_on:
      - db
      
  db:
    image: postgres:16-alpine
    container_name: quizapp-db
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - db_data:/var/lib/postgresql/data
    networks:
      - ngnet

networks:
  ngnet:
    external: true

volumes:
  db_data:
```

### 10.2 Development (`docker-compose.dev.yml`)
```yaml
services:
  web:
    build: 
      context: .
      dockerfile: Dockerfile.dev
    container_name: quizapp-dev
    ports:
      - "3772:3000"
    volumes:
      - ./:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DATABASE_URL=${DATABASE_URL}
      - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      - CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
      - HOSTNAME=0.0.0.0
      - NEXT_WEBPACK_USEPOLLING=1
      - WATCHPACK_POLLING=true
    command: npm run dev
    networks:
      - ngnet

  db:
    image: postgres:16-alpine
    container_name: quizapp-db-dev
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    volumes:
      - db_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - ngnet

networks:
  ngnet:
    external: true

volumes:
  db_data:
``` 