import NextAuth, { NextAuthOptions } from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users, accounts, sessions, verificationTokens } from "@/db/schema/auth";
import AuthentikProvider from "next-auth/providers/authentik";

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    AuthentikProvider({
      clientId: process.env.AUTHENTIK_CLIENT_ID!,
      clientSecret: process.env.AUTHENTIK_CLIENT_SECRET!,
      issuer: process.env.AUTHENTIK_ISSUER!,
    }),
  ],
  session: {
    strategy: "database",
    maxAge: 60 * 60 * 24 * 7, // 7일
  },
  callbacks: {
    async session({ session, user, token }) {
      console.log("=== 콜백 진입 확인 === [session]");
      try {
        console.log('[NextAuth][session callback] session:', session, 'user:', user, 'token:', token);
        if ((session.user as any)) {
          (session.user as any).id = user?.id || token?.sub || token?.id || null;
          (session.user as any).role = user?.role || null;
          const userId = user?.id || token?.sub || token?.id || null;
          if (userId) {
            const dbUser = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, userId) });
            (session.user as any).nickname = dbUser?.nickname || '';
          } else {
            (session.user as any).nickname = '';
          }
          console.log('[NextAuth][session callback] session.user.id set to:', (session.user as any).id);
        }
        return session;
      } catch (error) {
        console.error('[NextAuth][session callback][error]', error);
        throw error;
      }
    },
    async signIn({ user, account, profile, email, credentials }) {
      console.log("=== 콜백 진입 확인 === [signIn]");
      console.log('[NextAuth][signIn callback] user:', user, 'account:', account, 'profile:', profile);
      return true;
    },
    async profile(profile) {
      console.log("=== 콜백 진입 확인 === [profile]");
      return profile;
    },
  },
};

export default NextAuth(authOptions); 