// Clerk 인증은 프로젝트 후반부에 구현 예정
// import { authMiddleware } from '@clerk/nextjs';
// import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * 임시 미들웨어 - 모든 요청 허용
 * Clerk 인증은 프로젝트 후반부에 구현할 예정입니다.
 */
export function middleware(request: NextRequest) {
  // 요청 경로 로깅 (디버깅용)
  console.log('경로 접근:', request.nextUrl.pathname);
  
  // 모든 요청 허용
  return NextResponse.next();
}

/**
 * 미들웨어가 적용될 경로 패턴
 * - 정적 파일, _next 등은 제외
 */
export const config = {
  matcher: [
    '/((?!.*\\..*|_next).*)', 
    '/',
    '/(api|trpc)(.*)',
  ],
}; 