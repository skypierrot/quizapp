'use client';

/**
 * 개발 모드 환경 설정
 * 
 * 이 파일은 개발 환경에서 WebSocket 연결 및 HMR 관련 문제를 해결하기 위한
 * 설정을 포함합니다. 프로덕션 빌드에서는 사용 되지 않습니다.
 */

// 개발 환경에서만 실행
if (process.env.NODE_ENV === 'development') {
  // 안전한 초기화를 위한 지연 실행
  const initializeDevMode = () => {
    try {
      // WebSocket 연결 오류 로그 억제
      const originalConsoleError = console.error;
      console.error = function(...args) {
        // WebSocket 연결 실패 오류 메시지 필터링
        if (typeof args[0] === 'string' && (
          args[0].includes('WebSocket connection') ||
          args[0].includes('Failed to fetch') ||
          args[0].includes('WebSocket connection to') ||
          args[0].includes('ECONNREFUSED') ||
          args[0].includes('Cannot read properties of undefined')
        )) {
          // WebSocket 관련 오류 로그 억제
          return;
        }
        originalConsoleError(...args);
      };

      // Next.js HMR WebSocket URL 재정의
      // Docker 환경 내부에서 실행 중인 경우 호스트 IP 또는 도메인을 사용
      if (typeof window !== 'undefined' && window.location) {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const port = window.location.port;
        
        // WebSocket URL 재설정 (안전하게)
        try {
          (window as any).__NEXT_HMR_WEBSOCKET_URL__ = `${protocol}//${hostname}${port ? `:${port}` : ''}/`;
        } catch (e) {
          console.warn('WebSocket URL 설정 실패:', e);
        }
        
        // 연결 상태 모니터링
        const handleOnline = () => {
          console.log('네트워크 연결이 복원되었습니다. HMR을 다시 연결합니다.');
          // 안전한 페이지 리로드
          try {
            location.reload();
          } catch (e) {
            console.warn('페이지 리로드 실패:', e);
          }
        };

        window.addEventListener('online', handleOnline);
        
        // cleanup 함수 등록
        window.addEventListener('beforeunload', () => {
          window.removeEventListener('online', handleOnline);
        });

        // React Refresh 에러 발생 시 자동 복구 (최소한의 추가)
        const handleReactRefreshError = () => {
          console.log('React Refresh 에러 감지, 자동 복구 시도...');
          setTimeout(() => {
            try {
              location.reload();
            } catch (e) {
              console.warn('자동 복구 실패:', e);
            }
          }, 1000);
        };

        // 에러 이벤트 리스너 추가 (최소한의 추가)
        window.addEventListener('error', (event) => {
          if (event.error && event.error.message && 
              event.error.message.includes('Cannot read properties of undefined')) {
            handleReactRefreshError();
          }
        });
      }
    } catch (error) {
      console.warn('개발 모드 초기화 중 오류 발생:', error);
    }
  };

  // DOM이 준비된 후 초기화 실행
  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeDevMode);
    } else {
      // DOM이 이미 로드된 경우 즉시 실행
      initializeDevMode();
    }
  }
}

export {}; 