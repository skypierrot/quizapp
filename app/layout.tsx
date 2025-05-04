import './globals.css';
import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs'; // ClerkProvider 주석 해제
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { inter } from '@/lib/fonts';
import { Toaster } from "@/components/ui/toaster"

// 개발 모드 스크립트 추가 (WebSocket 문제 해결)
import './dev-mode';

// const inter = Inter({ subsets: ['latin'] }); // 중복 제거

export const metadata: Metadata = {
  title: '기술자격시험 학습 플랫폼',
  description: '대한민국 기술 자격시험 대비를 위한 최적의 학습 환경을 제공합니다.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Provider에 전달하기 직전 환경 변수 값 확인
  const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  console.log('[Layout] Checking NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:', clerkPubKey);

  if (!clerkPubKey) {
    console.error('[Layout] ERROR: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not defined!');
    // 키가 없으면 ClerkProvider 없이 렌더링하거나 에러 처리 (여기서는 일단 로그만)
  }

  return (
    <ClerkProvider // ClerkProvider 주석 해제
      // publishableKey={clerkPubKey} // 명시적 전달 제거
    >
      <html lang="ko">
        <body className={inter.className}>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </body>
      </html>
    </ClerkProvider> // ClerkProvider 주석 해제
  );
} 