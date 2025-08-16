'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, FileText, BarChart3, Target, Clock, Award } from 'lucide-react';

export default function LearnPage() {
  const learningFeatures = [
    {
      title: '시험준비',
      description: '체계적인 시험 준비와 학습 관리',
      icon: Target,
      href: '/learn/exams',
      color: 'bg-blue-500',
    },
    {
      title: '문제관리',
      description: '문제 등록 및 관리 시스템',
      icon: FileText,
      href: '/manage/questions/list',
      color: 'bg-green-500',
    },
    {
      title: '커뮤니티',
      description: '학습자들과 정보 공유 및 소통',
      icon: Award,
      href: '/community/forum',
      color: 'bg-purple-500',
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          학습 센터
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          기술자격시험 대비를 위한 체계적인 학습 환경을 제공합니다.
          문제 풀이, 복습, 진도 관리 등 다양한 학습 도구를 활용해보세요.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {learningFeatures.map((feature, index) => {
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
          학습 팁
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-white p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">📚 체계적인 학습</h3>
            <p className="text-gray-600 text-sm">
              매일 일정한 시간을 할애하여 꾸준히 학습하세요. 
              작은 목표부터 시작하여 점진적으로 실력을 향상시키는 것이 중요합니다.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">🔄 반복 학습</h3>
            <p className="text-gray-600 text-sm">
              틀린 문제는 반드시 다시 풀어보세요. 
              오답노트를 활용하여 취약한 부분을 파악하고 보완하세요.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">📊 진도 관리</h3>
            <p className="text-gray-600 text-sm">
              학습 통계를 통해 자신의 진도를 파악하고 
              효율적인 학습 계획을 세워보세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

