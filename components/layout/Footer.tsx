import Link from 'next/link';
import { Separator } from '../ui/separator';

const Footer = () => {
  return (
    <footer className="bg-white border-t">
      <div className="container py-8 md:py-12 px-4 mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">기술자격시험 학습 플랫폼</h3>
            <p className="text-sm text-gray-500">
              대한민국 기술 자격시험 대비를 위한 최적의 학습 환경을 제공합니다.
            </p>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">서비스</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/exams" className="text-sm text-gray-500 hover:text-gray-900">문제 은행</Link>
              </li>
              <li>
                <Link href="/practice" className="text-sm text-gray-500 hover:text-gray-900">모의고사</Link>
              </li>
              <li>
                <Link href="/wrong-answers" className="text-sm text-gray-500 hover:text-gray-900">오답 노트</Link>
              </li>
              <li>
                <Link href="/statistics" className="text-sm text-gray-500 hover:text-gray-900">학습 통계</Link>
              </li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">커뮤니티</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/community/notice" className="text-sm text-gray-500 hover:text-gray-900">공지사항</Link>
              </li>
              <li>
                <Link href="/community/forum" className="text-sm text-gray-500 hover:text-gray-900">학습 정보 공유</Link>
              </li>
              <li>
                <Link href="/guide" className="text-sm text-gray-500 hover:text-gray-900">이용 가이드</Link>
              </li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">고객지원</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/faq" className="text-sm text-gray-500 hover:text-gray-900">자주 묻는 질문</Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-gray-500 hover:text-gray-900">문의하기</Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-900">개인정보처리방침</Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-900">이용약관</Link>
              </li>
            </ul>
          </div>
        </div>
        
        <Separator className="my-6" />
        
        <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500">
          <p>&copy; 2025 기술자격시험 학습 플랫폼. All rights reserved.</p>
          <div className="mt-4 sm:mt-0">
            <Link href="/privacy" className="hover:text-gray-900 mr-4">개인정보처리방침</Link>
            <Link href="/terms" className="hover:text-gray-900">이용약관</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 