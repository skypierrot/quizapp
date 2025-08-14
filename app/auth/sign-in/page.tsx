'use client'
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogIn, UserPlus } from "lucide-react"

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-6">로그인</h1>
        <p className="mb-8 text-gray-600">
          계속하려면 Authentik 계정으로 로그인하세요.
        </p>
        
        <div className="space-y-4 mb-8">
          <Button 
            onClick={() => signIn("authentik")} 
            size="lg" 
            className="w-full"
          >
            <LogIn className="mr-2 h-5 w-5" />
            Authentik으로 로그인
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