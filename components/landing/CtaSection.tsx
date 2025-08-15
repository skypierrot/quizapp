import Link from 'next/link';
import { Button } from '@/components/ui/button';

const CtaSection = () => {
  return (
    <section className="py-20 px-4 bg-blue-600 text-white">
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          지금 바로 시작하세요
        </h2>
        <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
          기술자격시험 준비를 위한 최적의 학습 환경이 여러분을 기다리고 있습니다
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a 
            href="/learn/exams" 
            className="inline-block px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors text-lg"
          >
            학습 시작하기
          </a>
          <a 
            href="/statistics" 
            className="inline-block px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-colors text-lg"
          >
            통계 둘러보기
          </a>
        </div>
      </div>
    </section>
  );
};

export default CtaSection; 