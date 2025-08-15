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
      // WebSocket 연결 오류만 선택적으로 억제 (webpack 에러는 표시)
      const originalConsoleError = console.error;
      console.error = function(...args) {
        // WebSocket 연결 실패 오류 메시지만 필터링
        if (typeof args[0] === 'string' && (
          args[0].includes('WebSocket connection') ||
          args[0].includes('ECONNREFUSED')
        )) {
          // WebSocket 관련 오류만 로그 억제
          return;
        }
        originalConsoleError(...args);
      };

      // Next.js HMR WebSocket URL 재정의 (Docker 환경 최적화)
      if (typeof window !== 'undefined' && window.location) {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const port = window.location.port;
        
        // WebSocket URL 재설정 (Docker 환경에 맞게)
        try {
          // Docker 컨테이너 내부에서 실행 중인 경우 호스트 IP 사용
          const wsHost = hostname === 'localhost' ? 'localhost' : hostname;
          (window as any).__NEXT_HMR_WEBSOCKET_URL__ = `${protocol}//${wsHost}${port ? `:${port}` : ''}/`;
          
          console.log('HMR WebSocket URL 설정됨:', `${protocol}//${wsHost}${port ? `:${port}` : ''}/`);
        } catch (e) {
          console.warn('WebSocket URL 설정 실패:', e);
        }
        
        // 연결 상태 모니터링 (개선된 에러 처리)
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

        // React Refresh 에러 발생 시 자동 복구 (개선된 에러 감지)
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

        // 에러 이벤트 리스너 추가 (Next.js 15 + Webpack 에러 패턴 감지)
        window.addEventListener('error', (event) => {
          if (event.error && event.error.message && (
            event.error.message.includes('Cannot read properties of undefined') ||
            event.error.message.includes('options.factory') ||
            event.error.message.includes('__webpack_require__') ||
            event.error.message.includes('webpack') ||
            event.error.message.includes('factory.call') ||
            event.error.message.includes('undefined is not a function') ||
            event.error.message.includes('TypeError: Cannot read properties') ||
            event.error.message.includes('react-server-dom-webpack-client') ||
            event.error.message.includes('initializeModuleChunk') ||
            event.error.message.includes('readChunk') ||
            event.error.message.includes('requireModule') ||
            event.error.message.includes('webpack-internal://') ||
            event.error.message.includes('module.hot') ||
            event.error.message.includes('$RefreshHelpers$')
          )) {
            console.log('Next.js 15 Webpack 모듈 로딩 에러 감지:', event.error.message);
            handleReactRefreshError();
          }
        });

        // unhandledrejection 이벤트도 처리 (Next.js 15 에러 패턴)
        window.addEventListener('unhandledrejection', (event) => {
          if (event.reason && event.reason.message && (
            event.reason.message.includes('Cannot read properties of undefined') ||
            event.reason.message.includes('options.factory') ||
            event.reason.message.includes('__webpack_require__') ||
            event.reason.message.includes('webpack') ||
            event.reason.message.includes('factory.call') ||
            event.reason.message.includes('undefined is not a function') ||
            event.reason.message.includes('react-server-dom-webpack-client') ||
            event.reason.message.includes('webpack-internal://')
          )) {
            console.log('Promise rejection 감지, Next.js 15 Webpack 에러일 가능성:', event.reason);
            handleReactRefreshError();
          }
        });

        // Webpack 모듈 로딩 실패 감지 (Next.js 15 최적화)
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
          return originalFetch.apply(this, args).catch(error => {
            if (error.message && (
              error.message.includes('webpack') ||
              error.message.includes('__webpack_require__') ||
              error.message.includes('options.factory') ||
              error.message.includes('react-server-dom-webpack-client') ||
              error.message.includes('webpack-internal://')
            )) {
              console.log('Fetch 에러에서 Next.js 15 Webpack 문제 감지:', error);
              handleReactRefreshError();
            }
            throw error;
          });
        };

        // Next.js 15 특화 에러 감지 (추가)
        const handleNextJS15Error = () => {
          console.log('Next.js 15 특화 에러 감지, 페이지 새로고침 시도...');
          setTimeout(() => {
            try {
              // 안전한 페이지 새로고침
              if (window.location && window.location.reload) {
                window.location.reload();
              }
            } catch (e) {
              console.warn('Next.js 15 에러 복구 실패:', e);
            }
          }, 2000);
        };

        // Next.js 15 런타임 에러 감지
        window.addEventListener('error', (event) => {
          if (event.filename && (
            event.filename.includes('webpack.js') ||
            event.filename.includes('react-server-dom-webpack-client') ||
            event.filename.includes('main-app.js') ||
            event.filename.includes('webpack-internal://')
          )) {
            console.log('Next.js 15 런타임 에러 감지:', event.filename);
            handleNextJS15Error();
          }
        });

        // Webpack 모듈 로딩 상태 모니터링 (추가)
        const monitorWebpackStatus = () => {
          try {
            // Webpack HMR 상태 확인
            if (window.__NEXT_DATA__ && window.__NEXT_DATA__.buildId) {
              console.log('Next.js 15 Webpack 상태 모니터링 활성화');
            }
          } catch (e) {
            console.warn('Webpack 상태 모니터링 초기화 실패:', e);
          }
        };

        // 모니터링 시작
        monitorWebpackStatus();
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