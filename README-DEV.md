# 개발 환경 가이드

## 소개

이 프로젝트는 개발 효율을 높이기 위해 Docker를 기반으로 한 핫 리로딩 개발 환경을 제공합니다. 코드 변경 시 컨테이너를 재빌드할 필요 없이 즉시 변경 사항이 적용됩니다.

## 개발 환경 시작하기

### 1. 개발 스크립트 실행

```bash
./dev.sh
```

이 스크립트는 개발용 Docker 컨테이너를 시작하고 로그를 표시합니다.

### 2. 직접 명령어로 시작

```bash
# 개발 환경 시작
docker-compose -f docker-compose.dev.yml up -d

# 로그 확인
docker logs -f quizapp-dev
```

## 개발 환경 특징

- **볼륨 마운팅**: 로컬 코드가 컨테이너에 실시간으로 동기화됩니다.
- **핫 리로딩**: 코드 변경 시 Next.js 개발 서버가 자동으로 변경을 감지하고 새로고침합니다.
- **독립된 DB**: 개발용 데이터베이스가 별도로 실행됩니다.

## 개발 / 프로덕션 전환

### 개발 환경 (핫 리로딩)

```bash
# 개발 환경 시작
./dev.sh

# 또는
docker-compose -f docker-compose.dev.yml up -d
```

### 프로덕션 환경 (최적화된 빌드)

```bash
# 프로덕션 환경 빌드 및 시작
docker-compose down && docker-compose build --no-cache && docker-compose up -d
```

## 문제 해결

### 핫 리로딩이 작동하지 않는 경우

1. 컨테이너 로그 확인: `docker logs quizapp-dev`
2. 컨테이너 재시작: `docker-compose -f docker-compose.dev.yml restart web`
3. 개발 서버 재시작: 컨테이너에 접속하여 수동 재시작
   ```bash
   docker exec -it quizapp-dev sh
   npm run dev
   ```

### node_modules 관련 문제

개발 환경은 컨테이너 내부의 node_modules를 사용합니다. 새 패키지를 설치하면 개발 환경을 재시작해야 합니다.

```bash
# 패키지 설치 후 개발 환경 재시작
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up --build -d
``` 