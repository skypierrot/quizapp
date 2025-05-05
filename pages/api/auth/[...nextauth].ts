import NextAuth from "next-auth";
import IdentityServer4Provider from "next-auth/providers/identity-server4";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";

// 환경변수는 .env 파일 또는 배포 환경에서 반드시 설정되어야 합니다.
// AUTHENTIK_CLIENT_ID, AUTHENTIK_CLIENT_SECRET, AUTHENTIK_ISSUER, NEXTAUTH_SECRET

export default NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    IdentityServer4Provider({ // OIDC Generic Provider, Authentik은 OIDC 호환
      id: "authentik",
      name: "Authentik",
      scope: "openid profile email",
      clientId: process.env.AUTHENTIK_CLIENT_ID,
      clientSecret: process.env.AUTHENTIK_CLIENT_SECRET,
      issuer: process.env.AUTHENTIK_ISSUER,
      httpOptions: { timeout: 15000 }, // 15초로 타임아웃 증가
      // 인증 서버와의 통신 옵션 (필요시)
      // authorizationUrl, tokenUrl, userinfoUrl 등 커스텀 가능
    }),
  ],
  session: {
    strategy: "jwt", // JWT 기반 세션
  },
  callbacks: {
    async session({ session, token }) {
      // 세션에 사용자 ID 추가 (프론트에서 session.user.id 사용 가능)
      if (token?.sub && session?.user) session.user.id = token.sub;
      return session;
    },
  },
  pages: {
    signIn: "/auth/sign-in", // 커스텀 로그인 페이지 경로
  },
  secret: process.env.NEXTAUTH_SECRET,
}); 