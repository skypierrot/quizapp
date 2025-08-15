# 웹페이지 개발 제안서

## 1. 프로젝트 개요

본 프로젝트는 대한민국의 기술자격 시험 문제를 효율적으로 관리 및 학습할 수 있는 웹사이트 구축을 목표로 한다. 웹사이트는 공개된 기출문제를 체계적으로 관리하고, 사용자 맞춤형 학습과 모의 시험 제공을 통해 수험생의 합격률을 높이는 것을 주목적으로 한다.

## 2. 개발 환경 및 폴더 구조 설계

### 개발 환경
Docker 기반 컨테이너 환경
NAS 기반의 UnraidOS 7.0 환경
Nginx Proxy Manager를 통한 SSL 및 접속 관리

### 예상되는 폴더 구조(달라져도 무방)
```
exam-website
├── backend
│   ├── controllers
│   ├── models
│   ├── routes
│   ├── utils
│   ├── middleware
│   ├── services
│   ├── validators
│   ├── config
│   ├── tests
│   ├── Dockerfile
│   └── server.js
├── frontend
│   ├── components
│   ├── hooks
│   ├── pages
│   ├── styles
│   ├── utils
│   ├── contexts
│   ├── Dockerfile
│   └── next.config.js
├── database
│   ├── migrations
│   ├── seeders
│   ├── Dockerfile
│   └── init.sql
├── uploads
│   ├── questions
│   └── solutions
├── logs
├── scripts
└── docker-compose.yml
```

## 3. 주요 사용 함수 및 사용자 접근 플로우

### 주요 사용 함수 (백엔드)
사용자 관리 (`registerUser`, `loginUser`, `authenticateUser`)
문제 관리 (`createQuestion`, `updateQuestion`, `bulkUploadQuestions`, `deleteQuestion`)
시험 관리 (`generateExam`, `saveExamProgress`, `recordExamResult`, `fetchExamResults`)
파싱 기능 (`parseClipboardQuestions`)

### 사용자 접근 플로우
회원가입 및 로그인 → 대시보드 → 문제 및 시험 선택 → 풀이 및 시험 진행 → 결과 확인 → 오답 관리 및 반복 학습

## 4. 프론트엔드 및 백엔드 기술 스택 및 패키지

### 프론트엔드 (Next.js 기반)
React: 18.x
Next.js: 14.x
Axios: 1.x
React Query: 4.x
Tailwind CSS: 3.x
React Hook Form: 7.x
Zustand: 4.x (상태관리)
Framer Motion: 11.x (애니메이션)

### 백엔드 (Node.js 기반)
Node.js: 20.x
Express.js: 4.x
PostgreSQL: 16.x
Sequelize: 6.x
jsonwebtoken: 9.x
Multer: 1.x
Joi: 17.x (입력값 검증)
Winston: 3.x (로그 관리)

## 5. Docker 환경 설정

### docker-compose.yml 구조
Backend, Frontend, Database 분리 컨테이너
볼륨 마운트로 데이터 영속성 보장

### Nginx Proxy Manager 설정
외부 구축된 Nginx Proxy Manager 연동
내부/외부 환경에 맞는 SSL 및 포워딩 구성

## 6. 버전 관리 및 호환성
Git 기반의 버전 관리
의존성 버전 명확히 정의 (package-lock.json, yarn.lock 활용)

## 7. 보안 및 최적화 전략

### 보안
JWT 기반 인증/인가 전략
API rate limiting 구현 (express-rate-limit)
보안 취약점 정기 점검 및 자동화 테스트 구현

### 최적화
캐싱 전략(Redis 또는 메모리 기반 캐싱)
데이터베이스 인덱스 최적화
이미지 최적화 및 lazy loading

## 8. 데이터 관리 전략
데이터 마이그레이션 및 시딩 전략 정의
주기적인 백업 및 복구 전략 수립
로그 수집 및 모니터링 (Prometheus, Grafana)

## 9. 테스트 전략
유닛 테스트(Jest, Mocha)
통합 테스트(Postman/Newman)
E2E 테스트(Cypress, Playwright)

## 10. CI/CD 전략
GitHub Actions 활용한 자동 배포
Docker Hub 또는 자체 Docker Registry 사용

## 11. 유지보수 및 확장성
RESTful API 기반 설계 및 Swagger 문서화
모듈화 설계로 확장 용이

## 12. 위험 관리
데이터 손실 및 서버 다운 대비 장애 복구 전략 수립
트래픽 급증 시 대응 전략(Auto-scaling, 부하분산)

## 13. 향후 고려사항
외부 서비스 연동(SMS, 소셜 로그인, 결제)
서버리스 기능 도입 가능성
머신러닝을 통한 추천 시스템 개발 가능성

---

