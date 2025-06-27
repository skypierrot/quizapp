import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { StatsSection } from '@/components/landing/StatsSection';
import { CommunitySection } from '@/components/landing/CommunitySection';
import { CtaSection } from '@/components/landing/CtaSection';

// 서버 컴포넌트 정의
export default function Home() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <CommunitySection />
      <CtaSection />
    </div>
  );
}