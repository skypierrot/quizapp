import { Button } from '@/components/ui/button';

const HeroSection = () => {
  return (
    <section className="py-20 px-4 text-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          기술자격시험
          <br />
          <span className="text-blue-600">학습 플랫폼</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
          체계적인 학습과 실전 연습으로 기술자격시험을 준비하세요
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="text-lg px-8 py-4">
            <a href="/auth/sign-up">무료 회원가입</a>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-lg px-8 py-4">
            <a href="/auth/sign-in">로그인</a>
          </Button>
        </div>
        <p className="mt-6 text-gray-500">
          이미 계정이 있으신가요? <a href="/auth/sign-in" className="text-blue-600 hover:underline">로그인</a>하세요
        </p>
      </div>
    </section>
  );
};

export default HeroSection; 