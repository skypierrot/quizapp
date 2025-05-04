import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    title: '문제 은행',
    description: '다양한 기술 자격증 시험 문제를 체계적으로 관리하고 학습할 수 있습니다.',
    href: '/learn/exams'
  },
  {
    title: '모의고사',
    description: '실제 시험과 동일한 환경에서 모의고사를 진행하고 결과를 분석할 수 있습니다.',
    href: '/exams'
  },
  {
    title: '오답 노트',
    description: '틀린 문제를 효과적으로 복습하고 취약점을 개선할 수 있는 오답 노트 기능을 제공합니다.',
    href: '/wrong-answers'
  },
  {
    title: '문제 관리',
    description: '등록된 문제를 확인하고 관리하세요.',
    href: '/manage/questions/list'
  }
];

export function FeaturesSection() {
  return (
    <section className="bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">주요 기능</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {features.map((feature) => (
            <Link key={feature.title} href={feature.href} className="block group h-full">
              <Card className="shadow-sm hover:shadow-md transition-shadow h-full cursor-pointer flex flex-col p-6 dark:bg-gray-800">
                <CardHeader className="flex flex-col items-center text-center p-0 mb-2">
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white mb-2">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-0 w-full flex-1 flex flex-col justify-start">
                  <p className="text-base text-gray-500 dark:text-gray-400 text-left">{feature.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
} 