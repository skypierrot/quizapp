'use client'
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
      <h1 className="text-2xl font-semibold mb-6">로그인</h1>
      <p className="mb-8 text-center text-gray-600">
        계속하려면 Authentik 계정으로 로그인하세요.
      </p>
      <Button onClick={() => signIn("authentik")}>Authentik으로 로그인</Button>
    </div>
  )
} 