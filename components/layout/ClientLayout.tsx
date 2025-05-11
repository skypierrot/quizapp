'use client'
import { SessionProvider } from "next-auth/react";
import NicknameGuard from "./NicknameGuard";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NicknameGuard>
        {children}
      </NicknameGuard>
    </SessionProvider>
  );
} 