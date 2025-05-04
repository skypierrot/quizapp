import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function CtaSection() {
  return (
    <section className="container mx-auto px-4 py-12 text-center space-y-6">
      <h2 className="text-3xl font-bold">지금 바로 시작하세요</h2>
      <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
        회원가입 후 모든 기능을 무료로 이용할 수 있습니다.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button size="lg" asChild>
          <Link href="/sign-up">무료 회원가입</Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/sign-in">로그인</Link>
        </Button>
      </div>
    </section>
  );
} 