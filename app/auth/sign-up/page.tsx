'use client'
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { CheckCircle, BookOpen, BarChart3, Users, Award } from "lucide-react"

export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] px-4">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-3xl font-bold mb-6">무료 회원가입</h1>
        
        {/* 혜택 안내 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">가입하면 얻을 수 있는 혜택</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <span className="text-sm">다양한 문제은행 접근</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <BarChart3 className="h-5 w-5 text-green-600" />
              <span className="text-sm">개인별 학습 통계</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
              <span className="text-sm">커뮤니티 참여</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
              <Award className="h-5 w-5 text-orange-600" />
              <span className="text-sm">학습 성과 추적</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <p className="mb-4 text-gray-700">
            Authentik 계정으로 간편하게 회원가입을 진행합니다.
          </p>
          <p className="text-sm text-gray-600 mb-6">
            • 기존 Authentik 계정이 있다면 바로 로그인 가능<br/>
            • 새로운 계정 생성도 간편하게 처리<br/>
            • 보안이 강화된 인증 시스템 사용
          </p>
          <Button 
            onClick={() => signIn("authentik", { screen_hint: "signup" })}
            size="lg"
            className="w-full md:w-auto px-8"
          >
            <CheckCircle className="mr-2 h-5 w-5" />
            Authentik으로 회원가입
          </Button>
        </div>

        <div className="text-sm text-gray-500">
          이미 계정이 있으신가요?{" "}
          <a href="/auth/sign-in" className="text-blue-600 hover:underline font-medium">
            로그인하기
          </a>
        </div>
      </div>
    </div>
  )
} 