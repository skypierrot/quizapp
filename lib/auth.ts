import NextAuth, { NextAuthOptions } from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users, accounts, sessions, verificationTokens } from "@/db/schema/auth";
import AuthentikProvider from "next-auth/providers/authentik";

// 환경변수 검증
const requiredEnvVars = {
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  AUTHENTIK_CLIENT_ID: process.env.AUTHENTIK_CLIENT_ID,
  AUTHENTIK_CLIENT_SECRET: process.env.AUTHENTIK_CLIENT_SECRET,
  AUTHENTIK_ISSUER: process.env.AUTHENTIK_ISSUER,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
};

// 필수 환경변수 확인
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

// 디버깅을 위한 환경변수 로깅 (프로덕션에서는 제한적으로)
if (process.env.NODE_ENV === 'development') {
  console.log('=== NextAuth 환경변수 확인 ===');
  console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
  console.log('AUTHENTIK_HOST:', process.env.AUTHENTIK_HOST);
  console.log('AUTHENTIK_CLIENT_ID:', process.env.AUTHENTIK_CLIENT_ID);
  console.log('AUTHENTIK_ISSUER:', process.env.AUTHENTIK_ISSUER);
  console.log('================================');
}

// AuthentikProvider 설정
const authentikProviderConfig = {
  clientId: process.env.AUTHENTIK_CLIENT_ID!,
  clientSecret: process.env.AUTHENTIK_CLIENT_SECRET!,
  issuer: process.env.AUTHENTIK_ISSUER!,
};

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  
  providers: [
    AuthentikProvider(authentikProviderConfig),
  ],
  
  session: {
    strategy: "database",
    maxAge: 60 * 60 * 24 * 7, // 7일
  },
  
  callbacks: {
    async session({ session, user, token }) {
      try {
        if ((session.user as any)) {
          (session.user as any).id = user?.id || token?.sub || token?.id || null;
          (session.user as any).role = (user as any)?.role || null;
          
          const userId = user?.id || token?.sub || token?.id || null;
          if (userId) {
            const dbUser = await db.query.users.findFirst({ 
              where: (u, { eq }) => eq(u.id, userId as string) 
            });
            (session.user as any).nickname = dbUser?.nickname || '';
          } else {
            (session.user as any).nickname = '';
          }
        }
        return session;
      } catch (error) {
        console.error('[NextAuth][session callback][error]', error);
        throw error;
      }
    },
    
    async signIn({ user, account, profile, email, credentials }) {
      return true;
    },
  },
  
  // 프로덕션 환경에서는 디버그 모드 비활성화
  debug: process.env.NODE_ENV === 'development',
  
  // 보안 설정 강화
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
};

export default NextAuth(authOptions); 