import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function CommunitySection() {
  return (
    <section className="bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container mx-auto px-4 text-center space-y-6">
        <h2 className="text-3xl font-bold">함께 성장하는 학습 커뮤니티</h2>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          다양한 수험생들과 정보를 공유하고 함께 성장하세요.
        </p>
        <Button asChild>
          <Link href="/community/forum">커뮤니티 바로가기</Link>
        </Button>
      </div>
    </section>
  );
} 