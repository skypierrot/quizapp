'use client'
import { SessionProvider } from "next-auth/react";
import NicknameGuard from "./NicknameGuard";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      // React 19 최적화된 설정
      refetchInterval={0}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
      session={null}
    >
      <NicknameGuard>
        {children}
      </NicknameGuard>
    </SessionProvider>
  );
} 