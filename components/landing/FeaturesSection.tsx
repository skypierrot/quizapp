import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    title: '시험 문제 학습',
    description: '다양한 기술 자격증 시험 문제를 체계적으로 학습할 수 있습니다.',
    href: '/learn/exams'
  },
  {
    title: '학습 통계',
    description: '학습 현황과 정답률을 분석하여 효율적인 학습을 도와드립니다.',
    href: '/statistics'
  },
  {
    title: '시험 결과',
    description: '모든 시험 결과를 체계적으로 관리하고 확인할 수 있습니다.',
    href: '/results'
  },
  {
    title: '문제 관리',
    description: '새로운 문제를 등록하고 기존 문제를 관리할 수 있습니다.',
    href: '/manage/questions/list'
  },
  {
    title: '학습 커뮤니티',
    description: '다른 수험생들과 정보를 공유하고 소통할 수 있습니다.',
    href: '/community/forum'
  },
  {
    title: '개인 프로필',
    description: '학습 기록과 개인 설정을 관리할 수 있습니다.',
    href: '/profile'
  }
];

export function FeaturesSection() {
  return (
    <section className="bg-gray-50 dark:bg-gray-900 py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">주요 기능</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            학습에 필요한 모든 기능을 제공합니다
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature) => (
            <Link key={feature.title} href={feature.href} className="block">
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
} 