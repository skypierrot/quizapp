'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error | null;
  errorInfo?: ErrorInfo | null;
  isReactRefreshError?: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // React Refresh 관련 에러인지 확인
    const isReactRefreshError = ErrorBoundary.isReactRefreshError(error);
    
    return {
      hasError: true,
      error,
      isReactRefreshError,
    };
  }

  private static isReactRefreshError(error: Error): boolean {
    const errorMessage = error.message || '';
    const errorStack = error.stack || '';
    
    // React Refresh 관련 에러 패턴들 (Docker 환경에 최적화된 패턴)
    const reactRefreshPatterns = [
      'Cannot read properties of undefined (reading \'call\')',
      'options.factory',
      'originalFactory.call',
      'React Refresh',
      'webpack',
      'HMR',
      'Hot Module Replacement',
      'react-server-dom-webpack-client',
      '__webpack_require__',
      'module.hot',
      '$RefreshHelpers$',
      'factory.call',
      'Cannot read properties of undefined',
      'undefined is not a function',
      'TypeError: Cannot read properties'
    ];
    
    return reactRefreshPatterns.some(pattern => 
      errorMessage.includes(pattern) || errorStack.includes(pattern)
    );
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // React Refresh 에러인 경우 자동으로 페이지 새로고침
    if (ErrorBoundary.isReactRefreshError(error)) {
      console.log('React Refresh 에러 감지, 페이지를 새로고침합니다...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // React Refresh 에러인 경우 특별한 처리
      if (this.state.isReactRefreshError) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
              <div className="mb-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                개발 서버 재시작 중
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                React Refresh 에러가 발생했습니다. 페이지를 자동으로 새로고침합니다.
              </p>
              <div className="flex space-x-3 justify-center">
                <button
                  onClick={this.handleReload}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  지금 새로고침
                </button>
                <button
                  onClick={this.handleRetry}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  다시 시도
                </button>
              </div>
            </div>
          </div>
        );
      }

      // 일반적인 에러인 경우
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
              <div className="mb-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                예상치 못한 오류가 발생했습니다
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                문제가 지속되면 페이지를 새로고침하거나 관리자에게 문의하세요.
              </p>
              <div className="flex space-x-3 justify-center">
                <button
                  onClick={this.handleRetry}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  다시 시도
                </button>
                <button
                  onClick={this.handleReload}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  페이지 새로고침
                </button>
              </div>
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                    개발자 정보 보기
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-700 overflow-auto">
                    <div><strong>Error:</strong> {this.state.error?.toString()}</div>
                    <div><strong>Stack:</strong> {this.state.error?.stack}</div>
                    <div><strong>Component Stack:</strong> {this.state.errorInfo?.componentStack}</div>
                  </div>
                </details>
              )}
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
