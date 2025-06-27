'use client'

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"

export default function SignInPage() {
  const handleSignIn = () => {
    // 'oidc'는 lib/auth.ts에 설정된 OIDC Provider의 ID입니다.
    // 만약 Provider ID를 다르게 설정했다면 해당 ID를 사용해야 합니다.
    // signIn("authentik") // 이전 Provider ID
    signIn("authentik") // Provider ID를 authentik으로 수정
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
      <h1 className="text-2xl font-semibold mb-6">로그인</h1>
      <p className="mb-8 text-center text-gray-600">
        계속하려면 Authentik 계정으로 로그인하세요.
      </p>
      <Button onClick={handleSignIn}>Authentik으로 로그인</Button>
      {/* 필요시 다른 로그인 옵션 추가 가능 */}
    </div>
  )
} 