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

  // 기본 네비게이션 메뉴 구조 - 올바른 메뉴로 복원
  const renderNavigationMenu = () => {
    if (!mounted) return null; // Hydration 안전성 강화

    return (
      <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
        {/* 시험준비 */}
        <div
          className="relative"
          onMouseEnter={() => setOpenMenu('exam')}
          onMouseLeave={() => setOpenMenu(null)}
        >
          <button
            type="button"
            className="px-3 py-2 font-semibold hover:text-blue-600 transition-colors"
          >
            시험준비
          </button>
          {openMenu === 'exam' && (
            <div className="absolute left-0 top-full min-w-[160px] rounded bg-white shadow-lg flex flex-col transition-all duration-200 ease-in-out z-10 border">
              <Link href="/learn/exams" className="block px-4 py-2 hover:bg-gray-100 active:bg-gray-200 focus:bg-gray-200 transition-colors text-left">문제은행</Link>
              <Link href="/results" className="block px-4 py-2 hover:bg-gray-100 active:bg-gray-200 focus:bg-gray-200 transition-colors text-left">나의 시험 결과</Link>
              <Link href="/learn/review-quiz" className="block px-4 py-2 hover:bg-gray-100 active:bg-gray-200 focus:bg-gray-200 transition-colors text-left">오답노트</Link>
              <Link href="/statistics" className="block px-4 py-2 hover:bg-gray-100 active:bg-gray-200 focus:bg-gray-200 transition-colors text-left">통계</Link>
            </div>
          )}
        </div>
        
        {/* 문제관리 */}
        <div
          className="relative"
          onMouseEnter={() => setOpenMenu('manage')}
          onMouseLeave={() => setOpenMenu(null)}
        >
          <button 
            type="button"
            className="px-3 py-2 font-semibold hover:text-blue-600 transition-colors"
          >
            문제관리
          </button>
          {openMenu === 'manage' && (
            <div className="absolute left-0 top-full min-w-[160px] rounded bg-white shadow-lg flex flex-col transition-all duration-200 ease-in-out z-10 border">
              <Link href="/manage/questions/new" className="block px-4 py-2 hover:bg-gray-100 active:bg-gray-200 focus:bg-gray-200 transition-colors text-left">문제등록</Link>
              <Link href="/manage/questions/list" className="block px-4 py-2 hover:bg-gray-100 active:bg-gray-200 focus:bg-gray-200 transition-colors text-left">문제목록</Link>
            </div>
          )}
        </div>
        
        {/* 커뮤니티 */}
        <div
          className="relative"
          onMouseEnter={() => setOpenMenu('community')}
          onMouseLeave={() => setOpenMenu(null)}
        >
          <button 
            type="button"
            className="px-3 py-2 font-semibold hover:text-blue-600 transition-colors"
          >
            커뮤니티
          </button>
          {openMenu === 'community' && (
            <div className="absolute left-0 top-full min-w-[160px] rounded bg-white shadow-lg flex flex-col transition-all duration-200 ease-in-out z-10 border">
              <Link href="/community/notice" className="block px-4 py-2 hover:bg-gray-100 active:bg-gray-200 focus:bg-gray-200 transition-colors text-left">공지사항</Link>
              <Link href="/community/forum" className="block px-4 py-2 hover:bg-gray-100 active:bg-gray-200 focus:bg-gray-200 transition-colors text-left">자유게시판</Link>
            </div>
          )}
        </div>
        
        {/* 프로필 링크 */}
        <Link href="/profile" className="transition-colors hover:text-foreground/80">
          프로필
        </Link>
      </nav>
    );
  };

  const renderMobileMenu = () => {
    if (!mounted) return null;

    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button className="md:hidden bg-gray-100 hover:bg-gray-200 text-gray-700 h-9 w-9 p-0 border border-gray-300">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetTitle>Quiz App</SheetTitle>
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
            <Link href="/profile" className="hover:text-blue-600 font-semibold">프로필</Link>
          </nav>
        </SheetContent>
      </Sheet>
    );
  };

  // 인증 상태에 따른 UI 렌더링 - Hydration 안전성 강화
  const renderAuthButtons = () => {
    // 서버와 클라이언트 일관성을 위한 조건부 렌더링
    if (!mounted || status === "loading") {
      return (
        <div className="flex items-center space-x-2">
          <Button disabled className="h-9 w-16 bg-gray-200 text-gray-500 border border-gray-300">
            <div className="h-4 w-12 bg-gray-400 rounded animate-pulse" />
          </Button>
          <Button disabled className="h-9 w-20 bg-gray-200 text-gray-500 border border-gray-300">
            <div className="h-4 w-16 bg-gray-400 rounded animate-pulse" />
          </Button>
        </div>
      );
    }

    if (session?.user) {
      return <UserNav />;
    }

    return (
      <div className="flex items-center space-x-2">
        <Button asChild className="border border-gray-300 bg-gray-100 text-gray-800 hover:bg-gray-200 font-medium">
          <Link href="/auth/sign-in">로그인</Link>
        </Button>
        <Button asChild className="bg-blue-600 text-white hover:bg-blue-700 font-medium shadow-sm">
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
          {/* PC 메뉴 */}
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