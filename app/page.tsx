import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { StatsSection } from '@/components/landing/StatsSection';

// 서버 컴포넌트 정의
export default function Home() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
    </div>
  );
}