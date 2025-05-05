'use client'
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"

export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
      <h1 className="text-2xl font-semibold mb-6">회원가입</h1>
      <p className="mb-8 text-center text-gray-600">
        Authentik 계정으로 회원가입을 진행합니다.
      </p>
      <Button onClick={() => signIn("authentik", { screen_hint: "signup" })}>
        Authentik으로 회원가입
      </Button>
    </div>
  )
} 