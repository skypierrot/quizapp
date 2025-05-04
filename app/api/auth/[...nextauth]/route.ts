import NextAuth, { type NextAuthConfig } from "next-auth";
import AuthentikProvider from "next-auth/providers/authentik";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";

// API 라우트 핸들러는 Node.js 환경에서 실행되므로 전체 설정 사용 가능
export const authOptions: NextAuthConfig = {
  adapter: DrizzleAdapter(db),
  providers: [
    AuthentikProvider({
      clientId: process.env.AUTHENTIK_CLIENT_ID!,
      clientSecret: process.env.AUTHENTIK_CLIENT_SECRET!,
      issuer: process.env.AUTHENTIK_ISSUER!,
    }),
  ],
  session: { strategy: "jwt" as const },
  callbacks: {
    async session({ session, token }: { session: any; token: any }) {
      if (token?.sub && session?.user) session.user.id = token.sub;
      return session;
    },
  },
  pages: { signIn: "/auth/signin" },
  secret: process.env.AUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handlers as GET, handlers as POST } from "@/auth";
export const runtime = "nodejs"; 