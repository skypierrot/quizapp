// Clerk 인증은 프로젝트 후반부에 구현 예정 -> Clerk 인증 구현
// import { authMiddleware } from '@clerk/nextjs'; // 사용 안 함
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'; // clerkMiddleware 및 createRouteMatcher 임포트
import type { NextRequest } from 'next/server'; // NextRequest 타입 임포트
// import { NextResponse } from 'next/server'; // 사용 안 함

// 아래의 임시 미들웨어 함수 및 관련 코드는 제거합니다.
// export function middleware(request: NextRequest) { ... }
// const isPublicRoute = createRouteMatcher([ ... ]);

// 임시: 모든 요청 허용 미들웨어
// export function middleware(request: NextRequest) {
//   return NextResponse.next();
// }

// 공개 경로 설정
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  // 랜딩 페이지 '/'를 공개 경로로 추가
  '/',
  '/api/health',
]);

// 임시: 모든 요청 허용 미들웨어 제거
// export function middleware(request: NextRequest) {
//   return NextResponse.next();
// }

// clerkMiddleware 기본 사용법으로 변경. protect() 호출 불필요.
export default clerkMiddleware((auth, request: NextRequest) => {
  // isPublicRoute 체크는 clerkMiddleware 내부적으로 처리됨.
  // 필요한 경우 여기에 beforeAuth 또는 afterAuth 로직 추가 가능.
  // 예: if (!isPublicRoute(request)) { /* 추가 로직 */ }
});

// export default authMiddleware({...}); // authMiddleware 사용 부분 제거

/**
 * 미들웨어가 적용될 경로 패턴
 * - 정적 파일, _next 등은 제외
 */
export const config = {
  // matcher 설명:
  // 1. /((?!.*\..*|_next).*) : . (점) 이나 _next 를 포함하지 않는 모든 경로
  // 2. / : 루트 경로
  // 3. /(api|trpc)(.*) : /api/ 또는 /trpc/ 로 시작하는 모든 경로
  matcher: ["/((?!.*\..*|_next).*)", "/", "/(api|trpc)(.*)"],
}; 