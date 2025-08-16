import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const FeaturesSection = () => {
  const features = [
    {
      title: "시험준비",
      description: "다양한 기술자격시험 문제를 체계적으로 학습할 수 있습니다.",
      icon: "📚",
      href: "/learn/exams"
    },
    {
      title: "문제관리",
      description: "문제 등록 및 관리 시스템을 통해 체계적으로 학습 자료를 관리하세요.",
      icon: "✍️",
      href: "/manage/questions/list"
    },
    {
      title: "커뮤니티",
      description: "다른 학습자들과 정보를 공유하고 소통할 수 있습니다.",
      icon: "💬",
      href: "/community/forum"
    }
  ];

  return (
    <section className="py-20 px-4 bg-white">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            강력한 학습 기능
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            기술자격시험 준비에 필요한 모든 기능을 제공합니다
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <a key={feature.title} href={feature.href} className="block">
              <div className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors duration-200 h-full">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection; 