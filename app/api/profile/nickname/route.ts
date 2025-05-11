import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { users } from '@/db/schema/auth';
import { eq } from 'drizzle-orm';

const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9_.-]{2,16}$/;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ message: '로그인 필요' }, { status: 401 });

  const user = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, session.user.id) });
  return NextResponse.json({ nickname: user?.nickname || '' });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ message: '로그인 필요' }, { status: 401 });

  const { nickname } = await req.json();
  if (!nickname || typeof nickname !== 'string' || !NICKNAME_REGEX.test(nickname)) {
    return NextResponse.json({ message: '닉네임은 2~16자, 한글/영문/숫자/._-만 사용 가능합니다.' }, { status: 400 });
  }

  // 닉네임 중복 체크
  const exist = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.nickname, nickname) });
  if (exist && exist.id !== session.user.id) {
    return NextResponse.json({ message: '이미 사용 중인 닉네임입니다.' }, { status: 409 });
  }

  await db.update(users)
    .set({ nickname })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ ok: true, nickname });
} 