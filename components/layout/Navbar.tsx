'use client';

import Link from 'next/link';
import { Button } from '../ui/button';
import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '../ui/sheet';

import { UserNav } from './UserNav';

const Navbar = () => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  // 서버와 클라이언트 일관성을 위해 초기값을 'unauthenticated'로 설정
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('unauthenticated');
  const [session, setSession] = useState<any>(null);

  // 안전한 세션 상태 관리 (단일 useEffect로 통합)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setSession(data);
            setAuthStatus('authenticated');
          } else {
            setAuthStatus('unauthenticated');
          }
        } else {
          setAuthStatus('unauthenticated');
        }
      } catch (error) {
        setAuthStatus('unauthenticated');
      } finally {
        setMounted(true);
      }
    };

    checkAuth();
  }, []);

  // 기본 네비게이션 메뉴 구조 (Hydration 안전성을 위해 mounted 상태 확인)
  const renderNavigationMenu = () => {
    // 서버와 클라이언트 일관성을 위해 mounted 상태 확인
    if (!mounted) {
      return (
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {/* 로딩 중 스켈레톤 UI */}
          <div className="h-6 w-16 bg-gray-300 rounded animate-pulse" />
          <div className="h-6 w-20 bg-gray-300 rounded animate-pulse" />
          <div className="h-6 w-16 bg-gray-300 rounded animate-pulse" />
          <div className="h-6 w-16 bg-gray-300 rounded animate-pulse" />
        </nav>
      );
    }

    return (
      <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
        {/* 시험준비 */}
        <div
          className="relative"
          onMouseEnter={() => setOpenMenu('exam')}
          onMouseLeave={() => setOpenMenu(null)}
        >
          <button className="px-3 py-2 font-semibold hover:text-blue-600">시험준비</button>
          {openMenu === 'exam' && (
            <div className="absolute left-0 top-full min-w-[160px] rounded bg-white shadow-lg flex flex-col transition-all duration-200 ease-in-out z-10">
              <Link href="/learn/exams" className="block px-4 py-2 hover:bg-gray-100 active:bg-gray-200 focus:bg-gray-200 transition-colors">문제은행</Link>
              <Link href="/results" className="block px-4 py-2 hover:bg-gray-100 active:bg-gray-200 focus:bg-gray-200 transition-colors">나의 시험 결과</Link>
              <Link href="/learn/review-quiz" className="block px-4 py-2 hover:bg-gray-100 active:bg-gray-200 focus:bg-gray-200 transition-colors">오답노트</Link>
              <Link href="/statistics" className="block px-4 py-2 hover:bg-gray-100 active:bg-gray-200 focus:bg-gray-200 transition-colors">통계</Link>
            </div>
          )}
        </div>
        
        {/* 문제관리 */}
        <div
          className="relative"
          onMouseEnter={() => setOpenMenu('manage')}
          onMouseLeave={() => setOpenMenu(null)}
        >
          <button className="px-3 py-2 font-semibold hover:text-blue-600">문제관리</button>
          {openMenu === 'manage' && (
            <div className="absolute left-0 top-full min-w-[160px] rounded bg-white shadow-lg flex flex-col transition-all duration-200 ease-in-out z-10">
              <Link href="/manage/questions/new" className="block px-4 py-2 hover:bg-gray-100 active:bg-gray-200 focus:bg-gray-200 transition-colors">문제등록</Link>
              <Link href="/manage/questions/list" className="block px-4 py-2 hover:bg-gray-100 active:bg-gray-200 focus:bg-gray-200 transition-colors">문제목록</Link>
            </div>
          )}
        </div>
        
        {/* 커뮤니티 */}
        <div
          className="relative"
          onMouseEnter={() => setOpenMenu('community')}
          onMouseLeave={() => setOpenMenu(null)}
        >
          <button className="px-3 py-2 font-semibold hover:text-blue-600">커뮤니티</button>
          {openMenu === 'community' && (
            <div className="absolute left-0 top-full min-w-[160px] rounded bg-white shadow-lg flex flex-col transition-all duration-200 ease-in-out z-10">
              <Link href="/community/notice" className="block px-4 py-2 hover:bg-gray-100 active:bg-gray-200 focus:bg-gray-200 transition-colors">공지사항</Link>
              <Link href="/community/forum" className="block px-4 py-2 hover:bg-gray-100 active:bg-gray-200 focus:bg-gray-200 transition-colors">자유게시판</Link>
            </div>
          )}
        </div>
        
        {/* 프로필 링크 - hydration 안전성을 위해 조건부 렌더링 제거 */}
        <Link href="/profile" className="transition-colors hover:text-foreground/80">
          프로필
        </Link>
      </nav>
    );
  };

  // 모바일 메뉴 구조 (Hydration 안전성을 위해 mounted 상태 확인)
  const renderMobileMenu = () => {
    if (!mounted) {
      return (
        <Button variant="ghost" size="icon" className="md:hidden" disabled>
          <div className="h-5 w-5 bg-gray-300 rounded animate-pulse" />
        </Button>
      );
    }

    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px] sm:w-[400px]">
          <SheetTitle>메뉴</SheetTitle>
          <SheetDescription>
            주요 메뉴를 선택하세요. 시험준비, 문제관리, 커뮤니티 등 다양한 기능을 제공합니다.
          </SheetDescription>
          <nav className="flex flex-col space-y-4 mt-8">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">시험준비</h3>
              <div className="flex flex-col space-y-2 pl-4">
                <Link href="/learn/exams" className="hover:text-blue-600">문제은행</Link>
                <Link href="/results" className="hover:text-blue-600">나의 시험 결과</Link>
                <Link href="/learn/review-quiz" className="hover:text-blue-600">오답노트</Link>
                <Link href="/statistics" className="hover:text-blue-600">통계</Link>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">문제관리</h3>
              <div className="flex flex-col space-y-2 pl-4">
                <Link href="/manage/questions/new" className="hover:text-blue-600">문제등록</Link>
                <Link href="/manage/questions/list" className="hover:text-blue-600">문제목록</Link>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">커뮤니티</h3>
              <div className="flex flex-col space-y-2 pl-4">
                <Link href="/community/notice" className="hover:text-blue-600">공지사항</Link>
                <Link href="/community/forum" className="hover:text-blue-600">자유게시판</Link>
              </div>
            </div>
            <Link href="/profile" className="hover:text-blue-600">프로필</Link>
          </nav>
        </SheetContent>
      </Sheet>
    );
  };

  // 인증 상태에 따른 UI 렌더링 (Hydration 오류 방지)
  const renderAuthButtons = () => {
    // 서버와 클라이언트 일관성을 위해 mounted 상태 확인
    if (!mounted || authStatus === "loading") {
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

    if (session) {
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