'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, TrendingUp, BookOpen } from 'lucide-react';

export default function WrongAnswersPage() {
  const wrongAnswerFeatures = [
    {
      title: '오답 분석',
      description: '틀린 문제를 분석하여 취약한 부분을 파악하세요',
      icon: AlertTriangle,
      href: '/learn/review-quiz',
      color: 'bg-red-500',
    },
    {
      title: '반복 학습',
      description: '틀린 문제를 다시 풀어보며 실력을 향상시키세요',
      icon: RefreshCw,
      href: '/learn/review-quiz',
      color: 'bg-orange-500',
    },
    {
      title: '진도 추적',
      description: '오답률 변화를 통해 학습 진도를 확인하세요',
      icon: TrendingUp,
      href: '/statistics',
      color: 'bg-green-500',
    },
    {
      title: '학습 가이드',
      description: '오답을 바탕으로 맞춤형 학습 계획을 세우세요',
      icon: BookOpen,
      href: '/learn',
      color: 'bg-blue-500',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          오답노트
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          틀린 문제를 체계적으로 관리하고 반복 학습을 통해 
          취약한 부분을 보완하여 실력을 향상시키세요.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {wrongAnswerFeatures.map((feature, index) => {
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
          오답 관리 팁
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-white p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">📊 체계적 관리</h3>
            <p className="text-gray-600 text-sm">
              오답을 과목별, 난이도별로 분류하여 
              체계적으로 관리하고 추적하세요.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">🔄 반복 학습</h3>
            <p className="text-gray-600 text-sm">
              틀린 문제는 반드시 다시 풀어보고, 
              해설을 꼼꼼히 읽어 이해하세요.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">📈 성과 측정</h3>
            <p className="text-gray-600 text-sm">
              오답률 변화를 통해 학습 효과를 측정하고 
              학습 계획을 조정하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

