import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { notices } from '@/db/schema/notices';
import { eq } from 'drizzle-orm';

// 공지글 상세 조회
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const result = await db.select().from(notices).where(eq(notices.id, id));
  if (!result[0]) {
    return NextResponse.json({ message: '공지글을 찾을 수 없습니다.' }, { status: 404 });
  }
  return NextResponse.json({ notice: result[0] });
}

// 공지글 수정 (로그인 + 관리자만)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: '로그인 필요' }, { status: 401 });
  }
  if (session.user.role !== 'admin') {
    return NextResponse.json({ message: '관리자만 가능합니다.' }, { status: 403 });
  }
  const { id } = params;
  const { title, content, isPinned } = await request.json();
  const result = await db.update(notices)
    .set({ title, content, isPinned: !!isPinned })
    .where(eq(notices.id, id))
    .returning();
  if (!result[0]) {
    return NextResponse.json({ message: '공지글을 찾을 수 없습니다.' }, { status: 404 });
  }
  return NextResponse.json({ notice: result[0] });
}

// 공지글 삭제 (로그인 + 관리자만)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: '로그인 필요' }, { status: 401 });
  }
  if (session.user.role !== 'admin') {
    return NextResponse.json({ message: '관리자만 가능합니다.' }, { status: 403 });
  }
  const { id } = params;
  const result = await db.delete(notices).where(eq(notices.id, id)).returning();
  if (!result[0]) {
    return NextResponse.json({ message: '공지글을 찾을 수 없습니다.' }, { status: 404 });
  }
  return NextResponse.json({ message: '삭제되었습니다.' });
} 