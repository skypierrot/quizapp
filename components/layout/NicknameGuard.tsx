'use client'
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useTransition, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function NicknameGuard({ children }: { children: React.ReactNode }) {
  const { session, authStatus, mounted } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isClient, setIsClient] = useState(false);

  // Hydration 안전성을 위한 클라이언트 상태 확인
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (
      mounted &&
      isClient &&
      authStatus === "authenticated" &&
      !session?.user?.nickname &&
      pathname !== "/profile/nickname"
    ) {
      startTransition(() => {
        router.replace("/profile/nickname");
      });
    }
  }, [session, authStatus, pathname, router, mounted, isClient, startTransition]);

  // Hydration 안전성을 위한 조건부 렌더링
  if (!mounted || !isClient) {
    return <>{children}</>;
  }

  return <>{children}</>;
} 