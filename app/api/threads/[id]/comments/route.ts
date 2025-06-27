import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { threadComments } from '@/db/schema/threads';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const result = await db.select().from(threadComments).where(eq(threadComments.threadId, id));
  return NextResponse.json({ comments: result });
}

// 댓글 작성 (parentId 지원)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: '로그인 필요' }, { status: 401 });
  }
  const { content, parentId } = await req.json();
  if (!content) {
    return NextResponse.json({ message: '내용을 입력하세요.' }, { status: 400 });
  }
  const [comment] = await db.insert(threadComments).values({
    threadId: params.id,
    authorId: session.user.id,
    content,
    parentId: parentId || null,
  }).returning();
  return NextResponse.json({ comment });
} 