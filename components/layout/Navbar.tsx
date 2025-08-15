'use client';

import Link from 'next/link';
import { Button } from '../ui/button';
import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '../ui/sheet';
import { useSession } from 'next-auth/react';

import { UserNav } from './UserNav';

const Navbar = () => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { data: session, status } = useSession();

  // Hydration 안전성을 위한 클라이언트 상태 확인
  useEffect(() => {
    setMounted(true);
  }, []);

  // 기본 네비게이션 메뉴 구조 (Hydration 안전성을 위해 mounted 상태 확인)
  const renderNavigationMenu = () => {
    if (!mounted) return null;
    
    return (
      <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
        <Link href="/learn" className="transition-colors hover:text-foreground/80 text-foreground/60">
          학습하기
        </Link>
        <Link href="/practice" className="transition-colors hover:text-foreground/80 text-foreground/60">
          연습하기
        </Link>
        <Link href="/wrong-answers" className="transition-colors hover:text-foreground/80 text-foreground/60">
          오답노트
        </Link>
        <Link href="/statistics" className="transition-colors hover:text-foreground/80 text-foreground/60">
          통계
        </Link>
        <Link href="/community" className="transition-colors hover:text-foreground/80 text-foreground/60">
          커뮤니티
        </Link>
      </nav>
    );
  };

  const renderMobileMenu = () => {
    if (!mounted) return null;

    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetTitle>Quiz App</SheetTitle>
          <SheetDescription>
            기술자격시험 학습 플랫폼
          </SheetDescription>
          <div className="flex flex-col space-y-4 mt-6">
            <Link href="/learn" className="text-sm font-medium transition-colors hover:text-foreground/80 text-foreground/60">
              학습하기
            </Link>
            <Link href="/practice" className="text-sm font-medium transition-colors hover:text-foreground/80 text-foreground/60">
              연습하기
            </Link>
            <Link href="/wrong-answers" className="text-sm font-medium transition-colors hover:text-foreground/80 text-foreground/60">
              오답노트
            </Link>
            <Link href="/statistics" className="text-sm font-medium transition-colors hover:text-foreground/80 text-foreground/60">
              통계
            </Link>
            <Link href="/community" className="text-sm font-medium transition-colors hover:text-foreground/80 text-foreground/60">
              커뮤니티
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    );
  };

  // 인증 상태에 따른 UI 렌더링 (Hydration 오류 방지)
  const renderAuthButtons = () => {
    // 서버와 클라이언트 일관성을 위해 mounted 상태 확인
    if (!mounted || status === "loading") {
      return (
        <div className="flex items-center space-x-2">
          <Button variant="outline" disabled className="h-9 w-16">
            <div className="h-4 w-12 bg-gray-300 rounded animate-pulse" />
          </Button>
          <Button disabled className="h-9 w-20">
            <div className="h-4 w-16 bg-gray-300 rounded animate-pulse" />
          </Button>
        </div>
      );
    }

    if (session?.user) {
      return <UserNav />;
    }

    return (
      <div className="flex items-center space-x-2">
        <Button asChild variant="outline">
          <Link href="/auth/sign-in">로그인</Link>
        </Button>
        <Button asChild>
          <Link href="/auth/sign-up">가입하기</Link>
        </Button>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">Quiz App</span>
          </Link>
          {/* PC 메뉴 - Hydration 안전성을 위해 mounted 상태 확인 */}
          {renderNavigationMenu()}
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-2">
          {/* 모바일 햄버거 메뉴 */}
          {renderMobileMenu()}
          
          {/* 인증 상태에 따른 UI 렌더링 */}
          {renderAuthButtons()}
        </div>
      </div>
    </header>
  );
};

export default Navbar; 