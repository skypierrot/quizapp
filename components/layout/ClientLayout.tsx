'use client'
import { SessionProvider, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

function SessionWatcher() {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/') return; // 홈에서는 리다이렉트 X
    if (status === "unauthenticated") {
      router.replace("/auth/sign-in"); // 세션 만료 시 로그인 페이지로 이동
    }
  }, [status, router, pathname]);

  return null;
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionWatcher />
      {children}
    </SessionProvider>
  );
} 