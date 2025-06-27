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
import Link from 'next/link';

export function UserNav() {
  const { data: session } = useSession();
  const user = session?.user;

  if (!user) return null;

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
          <Link href="/profile">프로필</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/results">시험 결과</Link>
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