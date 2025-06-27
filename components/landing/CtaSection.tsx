import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function CtaSection() {
  return (
    <section className="bg-blue-600 py-16">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            지금 바로 시작하세요
          </h2>
          <p className="text-xl text-blue-100">
            무료 회원가입으로 모든 기능을 이용할 수 있습니다
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              <Link href="/learn/exams">학습 시작하기</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600">
              <Link href="/statistics">통계 둘러보기</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
} 