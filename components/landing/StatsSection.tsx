import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react'; // Using lucide icon for checkmark

export function StatsSection() {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">학습 현황 관리</h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            맞춤형 학습 통계와 진도 관리를 통해 효율적인 학습이 가능합니다.
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle className="text-blue-500 w-5 h-5 mt-1 flex-shrink-0" />
              <span>문제별 정답률 및 풀이 시간 분석</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="text-blue-500 w-5 h-5 mt-1 flex-shrink-0" />
              <span>취약 분야 자동 분석 및 추천 학습</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="text-blue-500 w-5 h-5 mt-1 flex-shrink-0" />
              <span>학습 목표 설정 및 달성률 관리</span>
            </li>
          </ul>
          <Button asChild>
            <Link href="/statistics">학습 통계 보기</Link>
          </Button>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 h-80 flex items-center justify-center mt-6 md:mt-0">
          {/* Placeholder for a stats chart image or component */}
          <p className="text-gray-500 dark:text-gray-400 text-center">통계 차트 (구현 예정)</p>
        </div>
      </div>
    </section>
  );
} 