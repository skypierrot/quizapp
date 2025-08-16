import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/layout/Footer";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/toaster";
import ClientLayout from "@/components/layout/ClientLayout";
import { Suspense } from "react";
import SimpleErrorBoundary from "@/components/layout/SimpleErrorBoundary";

// 개발 모드 스크립트 임시 비활성화 (디버깅을 위해)

export const metadata: Metadata = {
  title: "기술자격시험 학습 플랫폼",
  description: "대한민국 기술 자격시험 대비를 위한 최적의 학습 환경을 제공합니다.",
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
      <body className="font-sans antialiased">
        <SimpleErrorBoundary>
          <ClientLayout>
            <Suspense fallback={<div>Loading...</div>}>
              <main className="flex-grow">
                {children}
              </main>
              <Separator className="my-6" />
              <Footer />
            </Suspense>
          </ClientLayout>
          <Toaster />
        </SimpleErrorBoundary>
      </body>
    </html>
  );
} 