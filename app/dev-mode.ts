'use client';

/**
 * 개발 모드 환경 설정
 * 
 * 이 파일은 개발 환경에서 WebSocket 연결 및 HMR 관련 문제를 해결하기 위한
 * 설정을 포함합니다. 프로덕션 빌드에서는 사용되지 않습니다.
 */

// 개발 환경에서만 실행
if (process.env.NODE_ENV === 'development') {
  // WebSocket 연결 오류 로그 억제
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // WebSocket 연결 실패 오류 메시지 필터링
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('WebSocket connection') ||
       args[0].includes('Failed to fetch') ||
       args[0].includes('WebSocket connection to') ||
       args[0].includes('ECONNREFUSED'))
    ) {
      // WebSocket 관련 오류 로그 억제
      return;
    }
    originalConsoleError(...args);
  };

  // Next.js HMR WebSocket URL 재정의
  // Docker 환경 내부에서 실행 중인 경우 호스트 IP 또는 도메인을 사용
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const port = window.location.port;
    
    // WebSocket URL 재설정
    (window as any).__NEXT_HMR_WEBSOCKET_URL__ = `${protocol}//${hostname}${port ? `:${port}` : ''}/`;
    
    // 연결 상태 모니터링
    window.addEventListener('online', () => {
      console.log('네트워크 연결이 복원되었습니다. HMR을 다시 연결합니다.');
      location.reload();
    });
  }
}

export {}; 