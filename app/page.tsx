import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// 서버 컴포넌트 정의
export default function Home() {
  return (
    <div className="flex flex-col">
      {/* 히어로 섹션 */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center text-center">
            {/* Remove the main h1 title */}
            {/* <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              기술자격시험 학습 플랫폼
            </h1> */}
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mb-8">
              대한민국 기술 자격시험 대비를 위한 최적의 학습 환경을 제공합니다
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-black text-white px-6 py-3 rounded-md font-medium">
                학습 시작하기
              </button>
              <button className="border border-gray-300 px-6 py-3 rounded-md font-medium">
                이용 가이드
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 주요 기능 섹션 */}
      <section className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">주요 기능</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>문제 은행</CardTitle>
              </CardHeader>
              <CardContent>
                <p>다양한 기술 자격증 시험 문제를 체계적으로 관리하고 학습할 수 있습니다.</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/bank">문제 은행 보기</Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>모의고사</CardTitle>
              </CardHeader>
              <CardContent>
                <p>실제 시험과 동일한 환경에서 모의고사를 진행하고 결과를 분석할 수 있습니다.</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/practice">모의고사 보기</Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>오답 노트</CardTitle>
              </CardHeader>
              <CardContent>
                <p>틀린 문제를 효과적으로 복습하고 취약점을 개선할 수 있는 오답 노트 기능을 제공합니다.</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/wrong-answers">오답 노트 보기</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>문제 관리</CardTitle>
              </CardHeader>
              <CardContent>
                <p>등록된 문제를 수정하거나 새로운 문제를 추가할 수 있습니다. (관리자)</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/questions/list">문제 관리하기</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* 학습 통계 및 관리 섹션 */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">학습 현황 관리</h2>
            <p className="text-xl text-gray-600">
              맞춤형 학습 통계와 진도 관리를 통해 효율적인 학습이 가능합니다.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <div className="rounded-full bg-blue-500 p-1 mt-1"></div>
                <span>문제별 정답률 및 풀이 시간 분석</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="rounded-full bg-blue-500 p-1 mt-1"></div>
                <span>취약 분야 자동 분석 및 추천 학습</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="rounded-full bg-blue-500 p-1 mt-1"></div>
                <span>학습 목표 설정 및 달성률 관리</span>
              </li>
            </ul>
            <Button asChild>
              <Link href="/statistics">학습 통계 보기</Link>
            </Button>
          </div>
          <div className="bg-gray-100 rounded-lg p-6 h-80 flex items-center justify-center mt-6 md:mt-0">
            <p className="text-gray-500 text-center">통계 차트 이미지</p>
          </div>
        </div>
      </section>

      {/* 커뮤니티 섹션 */}
      <section className="bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl font-bold">함께 성장하는 학습 커뮤니티</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            다양한 수험생들과 정보를 공유하고 함께 성장하세요.
          </p>
          <Button asChild>
            <Link href="/community/forum">커뮤니티 바로가기</Link>
          </Button>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="container mx-auto px-4 py-12 text-center space-y-6">
        <h2 className="text-3xl font-bold">지금 바로 시작하세요</h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
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
    </div>
  );
} 