import Link from 'next/link';
import { Button } from '@/components/ui/button';

const CommunitySection = () => {
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
          학습 커뮤니티
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          다른 학습자들과 정보를 공유하고 함께 성장하세요
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a 
            href="/community/forum" 
            className="inline-block px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-lg"
          >
            커뮤니티 참여하기
          </a>
          <a 
            href="/community/notice" 
            className="inline-block px-8 py-4 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-600 hover:text-white transition-colors text-lg"
          >
            공지사항 보기
          </a>
        </div>
      </div>
    </section>
  );
};

export default CommunitySection; 