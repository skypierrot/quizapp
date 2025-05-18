'use client';

import Link from 'next/link';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '../ui/navigation-menu';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { forwardRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '../ui/sheet';
import { useSession, signIn, signOut } from "next-auth/react";
import { UserNav } from './UserNav';

const Navbar = () => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">Quiz App</span>
          </Link>
          {/* PC 메뉴 */}
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
                  {/* <Link href="/exams" className="block px-4 py-2 hover:bg-gray-100 active:bg-gray-200 focus:bg-gray-200 transition-colors">모의고사</Link> */}
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
            {session && (
              <Link href="/profile" className="transition-colors hover:text-foreground/80">
                프로필
              </Link>
            )}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          {/* 모바일 햄버거 메뉴 */}
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
                    {/* <Link href="/exams" className="hover:text-blue-600">모의고사</Link> */}
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
                {session && (
                  <Link href="/profile" className="hover:text-blue-600">
                    프로필
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
          {session ? (
            <UserNav />
          ) : (
            <Button asChild variant="outline">
              <Link href="/api/auth/signin">로그인</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

const ListItem = forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & { title: string }
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-gray-500">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});

ListItem.displayName = "ListItem";

// 인증 네비게이션 버튼 컴포넌트 정의
function AuthNavButton({ session, status, mobile = false }: { session: any, status: string, mobile?: boolean }) {
  // authentik 로그인 URL 생성
  const getAuthUrl = () => {
    // 실제 배포 환경에서는 process.env.NEXT_PUBLIC_SITE_URL 등으로 origin을 지정할 수도 있음
    const callbackUrl = encodeURIComponent(window.location.origin);
    return `/api/auth/signin/authentik?callbackUrl=${callbackUrl}`;
  };

  const handleLogin = () => {
    const authUrl = getAuthUrl();
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 768) {
        // PC: 팝업
        window.open(authUrl, 'authentik-login', 'width=500,height=700');
      } else {
        // 모바일: 전체 페이지 이동
        window.location.href = authUrl;
      }
    }
  };

  if (status === "loading") return <span>로딩중...</span>;
  if (!session) {
    return (
      <button
        onClick={handleLogin}
        className={
          mobile
            ? "w-full px-4 py-2 rounded border border-gray-300 bg-white text-gray-900 hover:bg-gray-100 transition"
            : "px-4 py-2 rounded border border-gray-300 bg-white text-gray-900 hover:bg-gray-100 transition"
        }
      >
        로그인
      </button>
    );
  }
  return (
    <div className={mobile ? "w-full flex flex-col items-center gap-2" : "flex items-center gap-2"}>
      <span className="text-sm">{session.user?.nickname || session.user?.email}</span>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className={
          mobile
            ? "w-full px-4 py-2 rounded border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 transition"
            : "px-3 py-1 rounded border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 transition"
        }
      >
        로그아웃
      </button>
    </div>
  );
}

export default Navbar; 