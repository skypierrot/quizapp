'use client'
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function NicknameGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (
      status === "authenticated" &&
      !session?.user?.nickname &&
      pathname !== "/profile/nickname"
    ) {
      router.replace("/profile/nickname");
    }
  }, [session, status, pathname, router]);

  return <>{children}</>;
} 