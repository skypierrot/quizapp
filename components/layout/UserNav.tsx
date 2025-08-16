'use client';

import { useSession, signOut } from 'next-auth/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useState, useEffect } from 'react';

export function UserNav() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const user = session?.user;

  // Hydration 안전성을 위한 클라이언트 상태 확인
  useEffect(() => {
    setMounted(true);
  }, []);

  // 서버와 클라이언트 일관성을 위한 조건부 렌더링 - 강화된 버전
  if (!mounted || status === 'loading') {
    return (
      <Button variant="ghost" className="relative h-8 rounded-full flex items-center space-x-2 px-2" disabled>
        <div className="h-8 w-8 bg-gray-300 rounded-full animate-pulse" />
        <div className="h-4 w-20 bg-gray-300 rounded animate-pulse" />
      </Button>
    );
  }

  // 세션이 없거나 사용자 정보가 없는 경우 안전하게 처리
  if (!user) {
    return (
      <Button variant="ghost" className="relative h-8 rounded-full flex items-center space-x-2 px-2" disabled>
        <div className="h-8 w-8 bg-gray-300 rounded-full animate-pulse" />
        <div className="h-4 w-20 bg-gray-300 rounded animate-pulse" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 rounded-full flex items-center space-x-2 px-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {user.nickname?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <span
            className="hidden md:inline-block text-sm font-medium max-w-[180px] truncate"
            title={user.nickname || '사용자'}
          >
            {user.nickname || '사용자'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="font-normal w-full">
          <div className="flex flex-col space-y-1 w-full">
            <p
              className="text-sm font-medium leading-none max-w-full min-w-[120px] break-words whitespace-normal px-3 py-1 w-full"
              title={user.nickname || '사용자'}
            >
              {user.nickname || '사용자'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/profile">프로필</a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="/results">시험 결과</a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600"
          onClick={() => signOut()}
        >
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 