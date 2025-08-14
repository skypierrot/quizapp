#!/bin/bash

# Nginx 관리 스크립트
# 사용법: ./nginx-manager.sh [start|stop|restart|reload|status|logs|config-test]

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# 도커 컴포즈 실행 함수
run_docker_compose() {
    local action="$1"
    log "도커 컴포즈 $action 실행 중..."
    
    case "$action" in
        "start")
            docker-compose up -d
            ;;
        "stop")
            docker-compose down
            ;;
        "restart")
            docker-compose restart
            ;;
        *)
            error "알 수 없는 액션: $action"
            exit 1
            ;;
    esac
    
    if [ $? -eq 0 ]; then
        log "도커 컴포즈 $action 완료"
    else
        error "도커 컴포즈 $action 실패"
        exit 1
    fi
}

# nginx 상태 확인
check_nginx_status() {
    if docker ps | grep -q "nginx-proxy"; then
        log "Nginx 컨테이너가 실행 중입니다"
        return 0
    else
        log "Nginx 컨테이너가 실행되지 않았습니다"
        return 1
    fi
}

# nginx 설정 테스트
test_nginx_config() {
    log "Nginx 설정 테스트 중..."
    docker exec nginx-proxy nginx -t
    if [ $? -eq 0 ]; then
        log "Nginx 설정 테스트 통과"
    else
        error "Nginx 설정 테스트 실패"
        exit 1
    fi
}

# nginx 재시작
reload_nginx() {
    log "Nginx 설정 재로드 중..."
    docker exec nginx-proxy nginx -s reload
    if [ $? -eq 0 ]; then
        log "Nginx 설정 재로드 완료"
    else
        error "Nginx 설정 재로드 실패"
        exit 1
    fi
}

# 로그 보기
show_logs() {
    log "Nginx 로그 표시 중... (Ctrl+C로 종료)"
    docker logs -f nginx-proxy
}

# 메인 함수
main() {
    case "$1" in
        "start")
            run_docker_compose "start"
            ;;
        "stop")
            run_docker_compose "stop"
            ;;
        "restart")
            run_docker_compose "restart"
            ;;
        "reload")
            if check_nginx_status; then
                reload_nginx
            else
                error "Nginx가 실행되지 않았습니다. 먼저 시작해주세요."
                exit 1
            fi
            ;;
        "status")
            check_nginx_status
            if [ $? -eq 0 ]; then
                info "컨테이너 상태:"
                docker ps --filter "name=nginx"
                echo
                info "포트 사용 상태:"
                netstat -tlnp | grep -E ":(80|443|8080)"
            fi
            ;;
        "logs")
            if check_nginx_status; then
                show_logs
            else
                error "Nginx가 실행되지 않았습니다."
                exit 1
            fi
            ;;
        "config-test")
            if check_nginx_status; then
                test_nginx_config
            else
                error "Nginx가 실행되지 않았습니다."
                exit 1
            fi
            ;;
        *)
            echo "사용법: $0 [start|stop|restart|reload|status|logs|config-test]"
            echo
            echo "명령어 설명:"
            echo "  start       - Nginx 서비스 시작"
            echo "  stop        - Nginx 서비스 중지"
            echo "  restart     - Nginx 서비스 재시작"
            echo "  reload      - Nginx 설정 재로드"
            echo "  status      - Nginx 상태 확인"
            echo "  logs        - Nginx 로그 실시간 보기"
            echo "  config-test - Nginx 설정 파일 테스트"
            exit 1
            ;;
    esac
}

# 스크립트 실행
main "$@"
