import { authOptions } from "@/lib/auth";
import NextAuth from "next-auth";

// 환경변수는 .env 파일 또는 배포 환경에서 반드시 설정되어야 합니다.
// AUTHENTIK_CLIENT_ID, AUTHENTIK_CLIENT_SECRET, AUTHENTIK_ISSUER, NEXTAUTH_SECRET

export default NextAuth(authOptions); 