import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function CommunitySection() {
  return (
    <section className="bg-gray-50 dark:bg-gray-900 py-16">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">학습 커뮤니티</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            전국의 수험생들과 정보를 공유하고 함께 성장하세요
          </p>
          
          <div className="space-y-4 mb-8">
            <p className="text-gray-700 dark:text-gray-300">• 시험 정보와 학습 팁 공유</p>
            <p className="text-gray-700 dark:text-gray-300">• 스터디 그룹 및 동료 찾기</p>
            <p className="text-gray-700 dark:text-gray-300">• 학습 방법 및 노하우 교환</p>
            <p className="text-gray-700 dark:text-gray-300">• 서로 격려하며 동기부여</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link href="/community/forum">커뮤니티 참여하기</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/community/notice">공지사항 보기</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
} 