#!/bin/bash

# 개발 환경 시작 스크립트

# 이전 개발 환경 정리
echo "🚀 이전 개발 환경 컨테이너를 정리합니다..."
docker-compose -f docker-compose.dev.yml down

# 개발 환경 시작
echo "🔧 개발 환경을 구성 중입니다..."
docker-compose -f docker-compose.dev.yml up -d

# 로그 보기
echo "📋 개발 서버 로그를 표시합니다. Ctrl+C로 로그를 종료할 수 있습니다."
echo "🌐 개발 서버는 http://localhost:3772 에서 실행 중입니다."
docker logs -f quizapp-dev 