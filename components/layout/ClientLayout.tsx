'use client'
import { SessionProvider } from "next-auth/react";
import NicknameGuard from "./NicknameGuard";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      // React 19 최적화된 설정
      refetchInterval={5 * 60} // 5분마다 세션 갱신
      refetchOnWindowFocus={true} // 윈도우 포커스 시 세션 갱신
      refetchWhenOffline={false}
    >
      <NicknameGuard>
        {children}
      </NicknameGuard>
    </SessionProvider>
  );
} 