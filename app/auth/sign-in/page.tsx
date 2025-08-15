'use client'
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogIn, UserPlus } from "lucide-react"
import { useState, useEffect } from "react"

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignIn = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const result = await signIn("authentik", { 
        callbackUrl: "/",
        redirect: false 
      })
      
      if (result?.error) {
        console.error('Sign in error:', result.error)
        if (result.error === 'Configuration') {
          setError('인증 서버 설정 오류입니다. 관리자에게 문의해주세요.')
        } else if (result.error === 'AccessDenied') {
          setError('접근이 거부되었습니다. 계정 권한을 확인해주세요.')
        } else if (result.error === 'Verification') {
          setError('인증 검증에 실패했습니다. 다시 시도해주세요.')
        } else {
          setError(`로그인 중 오류가 발생했습니다: ${result.error}`)
        }
      } else if (result?.ok) {
        // 성공 시 리다이렉트
        window.location.href = result.url || "/"
      }
    } catch (err) {
      console.error('Sign in error:', err)
      setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  // Hydration 안전성
  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] px-4">
        <div className="max-w-md w-full text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6"></div>
            <div className="h-4 bg-gray-200 rounded mb-8"></div>
            <div className="h-12 bg-gray-200 rounded mb-4"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-6">로그인</h1>
        <p className="mb-8 text-gray-600">
          계속하려면 Authentik 계정으로 로그인하세요.
        </p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        
        <div className="space-y-4 mb-8">
          <Button 
            onClick={handleSignIn}
            disabled={isLoading}
            size="lg" 
            className="w-full"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                로그인 중...
              </div>
            ) : (
              <>
                <LogIn className="mr-2 h-5 w-5" />
                Authentik으로 로그인
              </>
            )}
          </Button>
          
          <Button 
            asChild 
            variant="outline" 
            size="lg" 
            className="w-full"
          >
            <a href="/auth/sign-up">
              <UserPlus className="mr-2 h-5 w-5" />
              회원가입하기
            </a>
          </Button>
        </div>

        <div className="text-sm text-gray-500">
          계정이 없으신가요?{" "}
          <a href="/auth/sign-up" className="text-blue-600 hover:underline font-medium">
            무료로 가입하기
          </a>
        </div>
      </div>
    </div>
  )
} 