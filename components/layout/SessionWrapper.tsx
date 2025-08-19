'use client'

import { SessionProvider } from "next-auth/react";

export default function SessionWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      // React 19 최적화된 설정 및 hydration 안전성 향상
      refetchInterval={5 * 60} // 5분마다 세션 갱신
      refetchOnWindowFocus={false} // 윈도우 포커스 시 세션 갱신 비활성화 (hydration 안정성 향상)
      refetchWhenOffline={false}
      // hydration 안전성을 위한 추가 설정
    >
      {children}
    </SessionProvider>
  );
}

