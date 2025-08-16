import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import StatsSection from '@/components/landing/StatsSection';
import ClientWrapper from '@/components/layout/ClientWrapper';
import { Toaster } from '@/components/ui/toaster';

// 서버 컴포넌트 - React 19 최적화
export default function Home() {
  return (
    <ClientWrapper>
      <div className="flex flex-col">
        <HeroSection />
        <FeaturesSection />
        <StatsSection />
      </div>
      <Toaster />
    </ClientWrapper>
  );
}