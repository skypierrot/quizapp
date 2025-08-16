'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Target, Clock, Award } from 'lucide-react';

export default function ExamsPage() {
  const examFeatures = [
    {
      title: '과목별 문제',
      description: '전기, 전자, 정보통신 등 과목별로 문제를 풀어보세요',
      icon: BookOpen,
      href: '/learn/exams',
      color: 'bg-blue-500',
    },
    {
      title: '난이도별 연습',
      description: '초급, 중급, 고급 난이도로 단계별 학습하세요',
      icon: Target,
      href: '/learn/exams',
      color: 'bg-green-500',
    },
    {
      title: '실전 모의고사',
      description: '실제 시험과 동일한 환경에서 모의고사를 풀어보세요',
      icon: Clock,
      href: '/learn/exams',
      color: 'bg-purple-500',
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          문제 은행
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          다양한 과목과 난이도의 문제를 풀어보며 
          체계적으로 실력을 향상시키세요.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {examFeatures.map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="text-center">
                <div className={`${feature.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription className="text-gray-600">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button asChild className="w-full">
                  <Link href={feature.href}>
                    시작하기
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          학습 가이드
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          <div className="bg-white p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">📚 체계적 학습</h3>
            <p className="text-gray-600 text-sm">
              과목별로 체계적으로 학습하고, 난이도를 점진적으로 높여가며 
              실력을 향상시키세요.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">⏰ 시간 관리</h3>
            <p className="text-gray-600 text-sm">
              실제 시험과 동일한 시간 제한을 두고 연습하여 
              시험 환경에 익숙해지세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

