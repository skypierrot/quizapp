import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            기술자격학습플랫폼
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            대한민국 기술 자격시험 대비를 위한 최적의 학습 환경을 제공합니다.
            지금 시작하여 목표를 달성해보세요!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="px-8 py-3 text-lg">
              <Link href="/auth/sign-up">무료 회원가입</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-8 py-3 text-lg">
              <Link href="/auth/sign-in">로그인</Link>
            </Button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            이미 계정이 있으신가요? <Link href="/auth/sign-in" className="text-blue-600 hover:underline">로그인</Link>하세요
          </p>
        </div>
      </div>
    </section>
  );
} 