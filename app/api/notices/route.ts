import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { notices } from '@/db/schema/notices';
import { eq, desc } from 'drizzle-orm';

// 공지글 목록 조회
export async function GET() {
  const result = await db.select().from(notices).orderBy(desc(notices.isPinned), desc(notices.createdAt));
  return NextResponse.json({ notices: result });
}

// 공지글 작성 (로그인 필요)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: '로그인 필요' }, { status: 401 });
  }
  const { title, content, isPinned } = await request.json();
  if (!title || !content) {
    return NextResponse.json({ message: '제목과 내용을 입력하세요.' }, { status: 400 });
  }
  const [notice] = await db.insert(notices).values({
    title,
    content,
    authorId: session.user.id,
    isPinned: !!isPinned,
  }).returning();
  return NextResponse.json({ notice });
} 