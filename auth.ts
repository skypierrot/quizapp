import NextAuth from "next-auth";
import AuthentikProvider from "next-auth/providers/authentik";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";

export const { handlers, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    AuthentikProvider({
      clientId: process.env.AUTHENTIK_CLIENT_ID!,
      clientSecret: process.env.AUTHENTIK_CLIENT_SECRET!,
      issuer: process.env.AUTHENTIK_ISSUER!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async session({ session, token }: { session: any; token: any }) {
      if (token?.sub && session?.user) session.user.id = token.sub;
      return session;
    },
  },
  pages: { signIn: "/auth/signin" },
  secret: process.env.AUTH_SECRET,
}); 