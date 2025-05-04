import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center">
          {/* Remove the main h1 title */}
          {/* <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              기술자격시험 학습 플랫폼
            </h1> */}
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mb-8">
            대한민국 기술 자격시험 대비를 위한 최적의 학습 환경을 제공합니다
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg">
              <Link href="/learn/exams">학습 시작하기</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              {/* TODO: Add guide page link */}
              <Link href="#">이용 가이드</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
} 