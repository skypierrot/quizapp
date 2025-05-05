import NextAuth from "next-auth";
import AuthentikProvider from "next-auth/providers/authentik";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";

console.log('AUTHENTIK_ISSUER:', process.env.AUTHENTIK_ISSUER);
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET);

// API 라우트 핸들러는 Node.js 환경에서 실행되므로 전체 설정 사용 가능
const handler = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    AuthentikProvider({
      clientId: process.env.AUTHENTIK_CLIENT_ID!,
      clientSecret: process.env.AUTHENTIK_CLIENT_SECRET!,
      issuer: process.env.AUTHENTIK_ISSUER!,
      httpOptions: {
        timeout: 15000, // 15초로 충분히 늘림
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async session({ session, token }) {
      if (token?.sub && session?.user) session.user.id = token.sub;
      return session;
    },
  },
  pages: { signIn: "/auth/sign-in" },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
export const runtime = "nodejs"; 