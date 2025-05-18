import NextAuth, { type DefaultUser } from "next-auth";

// User 인터페이스를 확장하고 export
export interface User extends DefaultUser {
  id: string;
  role?: string | null;
  nickname?: string | null;
  // 기존 DefaultUser에 있는 name, email, image는 DefaultUser를 통해 상속받음
}

declare module "next-auth" {
  interface Session {
    user: User; // 확장된 User 인터페이스 사용
  }
} 