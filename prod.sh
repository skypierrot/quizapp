#!/bin/bash

echo "🚀 QuizApp 프로덕션 환경 시작 중..."

# 기존 프로덕션 컨테이너 중지 및 제거
echo "📦 기존 프로덕션 컨테이너 정리 중..."
docker-compose -f docker-compose.prod.yml down

# 프로덕션 환경 변수 확인
if [ ! -f .env.production ]; then
    echo "❌ .env.production 파일이 없습니다!"
    echo "📝 .env.production 파일을 생성하고 프로덕션 환경 변수를 설정해주세요."
    exit 1
fi

# 프로덕션 컨테이너 빌드 및 시작
echo "🔨 프로덕션 컨테이너 빌드 중..."
docker-compose -f docker-compose.prod.yml up -d --build

# 컨테이너 상태 확인
echo "📊 컨테이너 상태 확인 중..."
sleep 10
docker ps | grep quizapp

echo "✅ 프로덕션 환경이 시작되었습니다!"
echo "🌐 애플리케이션: http://localhost:3772"
echo "🗄️  데이터베이스: localhost:5433"
echo ""
echo "📋 로그 확인: docker logs quizapp-prod -f"
echo "🛑 중지: docker-compose -f docker-compose.prod.yml down"
