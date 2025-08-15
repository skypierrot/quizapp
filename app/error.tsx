'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 에러 로깅
    console.error('Global error caught:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            문제가 발생했습니다
          </h1>
          <p className="text-gray-600">
            예상치 못한 오류가 발생했습니다. 다시 시도해주세요.
          </p>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 mb-2">
              개발자 정보 (클릭하여 확장)
            </summary>
            <div className="bg-gray-50 p-3 rounded text-xs font-mono text-gray-700 overflow-auto">
              <p><strong>Error:</strong> {error.message}</p>
              {error.digest && <p><strong>Digest:</strong> {error.digest}</p>}
              <p><strong>Stack:</strong></p>
              <pre className="whitespace-pre-wrap">{error.stack}</pre>
            </div>
          </details>
        )}
        
        <div className="space-y-3">
          <Button 
            onClick={reset}
            className="w-full"
            size="lg"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            다시 시도
          </Button>
          
          <Button 
            asChild 
            variant="outline" 
            className="w-full"
            size="lg"
          >
            <a href="/">
              홈으로 돌아가기
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
