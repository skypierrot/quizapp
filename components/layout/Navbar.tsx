'use client';

import Link from 'next/link';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '../ui/navigation-menu';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { forwardRef, useState } from 'react';
import { Menu, X, MenuSquare, XSquare } from 'lucide-react';
import { Sheet, SheetContent } from '../ui/sheet';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className="relative z-40 w-full border-b bg-white">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="text-xl font-bold text-gray-900">
            기술자격시험 학습 플랫폼
          </Link>
        </div>
        
        {/* 모바일 햄버거 메뉴 버튼 */}
        <button 
          className="md:hidden p-3" 
          onClick={toggleMenu}
          aria-label={isMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
        >
          {isMenuOpen ? <XSquare size={24} className="pointer-events-none" /> : <MenuSquare size={24} className="pointer-events-none" />}
        </button>
        
        {/* 데스크탑 메뉴 */}
        <div className="hidden md:flex items-center gap-6">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>시험 준비</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    <ListItem href="/learn/exams" title="문제 은행">
                      시험별 문제를 체계적으로 학습하세요
                    </ListItem>
                    <ListItem href="/exams" title="모의고사">
                      실전과 동일한 환경에서 시험을 연습하세요
                    </ListItem>
                    <ListItem href="/wrong-answers" title="오답 노트">
                      틀린 문제를 효과적으로 복습하세요
                    </ListItem>
                    <ListItem href="/statistics" title="학습 통계">
                      나의 학습 현황을 분석하세요
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuTrigger>문제 관리</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4">
                    <ListItem href="/manage/questions/new" title="문제 등록">
                      새로운 문제를 등록하세요
                    </ListItem>
                    <ListItem href="/manage/questions/list" title="문제 목록">
                      등록된 문제를 관리하세요
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuTrigger>커뮤니티</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4">
                    <ListItem href="/community/notice" title="공지사항">
                      중요 소식과 업데이트를 확인하세요
                    </ListItem>
                    <ListItem href="/community/forum" title="학습 정보 공유">
                      다른 수험생들과 정보를 공유하세요
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link 
                    href="/guide" 
                    className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-gray-100/50 data-[state=open]:bg-gray-100/50"
                  >
                    이용 가이드
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
          
          {/* 인증 UI는 Authentik 적용 후 구현 예정 */}
        </div>
      </div>
      
      {/* 모바일 메뉴 */}
      {isMenuOpen && (
        <div className="md:hidden py-4 px-4 bg-white border-t">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium text-sm">시험 준비</h3>
              <ul className="pl-4 space-y-2">
                <li><Link href="/learn/exams" className="text-gray-600 hover:text-gray-900" onClick={toggleMenu}>문제 은행</Link></li>
                <li><Link href="/exams" className="text-gray-600 hover:text-gray-900" onClick={toggleMenu}>모의고사</Link></li>
                <li><Link href="/wrong-answers" className="text-gray-600 hover:text-gray-900" onClick={toggleMenu}>오답 노트</Link></li>
                <li><Link href="/statistics" className="text-gray-600 hover:text-gray-900" onClick={toggleMenu}>학습 통계</Link></li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-sm">문제 관리</h3>
              <ul className="pl-4 space-y-2">
                <li><Link href="/manage/questions/new" className="text-gray-600 hover:text-gray-900" onClick={toggleMenu}>문제 등록</Link></li>
                <li><Link href="/manage/questions/list" className="text-gray-600 hover:text-gray-900" onClick={toggleMenu}>문제 목록</Link></li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-sm">커뮤니티</h3>
              <ul className="pl-4 space-y-2">
                <li><Link href="/community/notice" className="text-gray-600 hover:text-gray-900" onClick={toggleMenu}>공지사항</Link></li>
                <li><Link href="/community/forum" className="text-gray-600 hover:text-gray-900" onClick={toggleMenu}>학습 정보 공유</Link></li>
              </ul>
            </div>
            
            <div>
              <Link href="/guide" className="text-gray-600 hover:text-gray-900" onClick={toggleMenu}>이용 가이드</Link>
            </div>

            {/* 인증 UI는 Authentik 적용 후 구현 예정 */}
          </div>
        </div>
      )}
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

export default Navbar; 