'use client'
import { SessionProvider } from "next-auth/react";
import NicknameGuard from "./NicknameGuard";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      // 프로덕션 환경 최적화
      refetchInterval={5 * 60} // 5분마다 세션 갱신
      refetchOnWindowFocus={false} // 윈도우 포커스 시 자동 갱신 비활성화
      refetchWhenOffline={false} // 오프라인 시 갱신 비활성화
    >
      <NicknameGuard>
        {children}
      </NicknameGuard>
    </SessionProvider>
  );
} 