export const runtime = "nodejs";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const session = await auth();
  if (!session) {
    redirect("/auth/signin");
  }
  return session;
} 