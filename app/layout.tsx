import './globals.css';
import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { inter } from '@/lib/fonts';
import { Toaster } from "@/components/ui/toaster"
import ClientLayout from '@/components/layout/ClientLayout';

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
  return (
    <html lang="ko">
      <body className={inter.className}>
        <ClientLayout>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </ClientLayout>
      </body>
    </html>
  );
} 