'use client'
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useTransition, useState } from "react";
import { useSession } from "next-auth/react";

export default function NicknameGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
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
      isClient &&
      status === "authenticated" &&
      session?.user &&
      !session.user.nickname &&
      pathname !== "/profile/nickname"
    ) {
      startTransition(() => {
        router.replace("/profile/nickname");
      });
    }
  }, [session, status, pathname, router, isClient, startTransition]);

  // Hydration 안전성을 위한 조건부 렌더링 - 개선된 버전
  // 서버와 클라이언트 간의 일관성을 보장하기 위해 더 엄격한 조건 적용
  if (!isClient || status === "loading" || status === "unauthenticated") {
    return <>{children}</>;
  }

  // 인증된 사용자이지만 닉네임이 없는 경우에도 children을 렌더링
  // 리다이렉트는 useEffect에서 처리
  return <>{children}</>;
} 