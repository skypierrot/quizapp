import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { threadComments, threads } from '@/db/schema/threads';
import { eq, count } from 'drizzle-orm';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// 댓글 목록 조회
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: threadId } = await params;
  const comments = await db.select().from(threadComments)
    .where(eq(threadComments.threadId, threadId))
    .orderBy(threadComments.createdAt);
  return NextResponse.json({ comments });
}

// 댓글 작성 (parentId 지원)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: '로그인 필요' }, { status: 401 });
  }
  const { id: threadId } = await params;
  const { content, parentId } = await req.json();
  if (!content) {
    return NextResponse.json({ message: '내용을 입력하세요.' }, { status: 400 });
  }
  
  // 댓글 추가
  const [comment] = await db.insert(threadComments).values({
    threadId: threadId,
    authorId: session.user.id,
    content,
    parentId: parentId || null,
  }).returning();
  
  // 게시글의 댓글 수 업데이트
  const commentCountResult = await db
    .select({ count: count() })
    .from(threadComments)
    .where(eq(threadComments.threadId, threadId));
  
  const commentCount = commentCountResult[0]?.count || 0;
  
  await db.update(threads)
    .set({ commentCount })
    .where(eq(threads.id, threadId));
  
  return NextResponse.json({ comment });
}

// 댓글 수정
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: '로그인 필요' }, { status: 401 });
  }
  
  const url = new URL(req.url);
  const commentId = url.searchParams.get('commentId');
  if (!commentId) {
    return NextResponse.json({ message: '댓글 ID가 필요합니다.' }, { status: 400 });
  }
  
  const { content } = await req.json();
  if (!content) {
    return NextResponse.json({ message: '내용을 입력하세요.' }, { status: 400 });
  }
  
  // 댓글 존재 확인 및 작성자 검증
  const existing = await db.select().from(threadComments).where(eq(threadComments.id, commentId));
  if (!existing[0]) {
    return NextResponse.json({ message: '댓글을 찾을 수 없습니다.' }, { status: 404 });
  }
  if (existing[0].authorId !== session.user.id) {
    return NextResponse.json({ message: '수정 권한이 없습니다.' }, { status: 403 });
  }
  
  const [updatedComment] = await db.update(threadComments)
    .set({ 
      content, 
      updatedAt: new Date() 
    })
    .where(eq(threadComments.id, commentId))
    .returning();
    
  return NextResponse.json({ comment: updatedComment });
}

// 댓글 삭제
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: '로그인 필요' }, { status: 401 });
  }
  
  const { id: threadId } = await params;
  const url = new URL(req.url);
  const commentId = url.searchParams.get('commentId');
  if (!commentId) {
    return NextResponse.json({ message: '댓글 ID가 필요합니다.' }, { status: 400 });
  }
  
  // 댓글 존재 확인 및 작성자 검증
  const existing = await db.select().from(threadComments).where(eq(threadComments.id, commentId));
  if (!existing[0]) {
    return NextResponse.json({ message: '댓글을 찾을 수 없습니다.' }, { status: 404 });
  }
  if (existing[0].authorId !== session.user.id) {
    return NextResponse.json({ message: '삭제 권한이 없습니다.' }, { status: 403 });
  }
  
  await db.delete(threadComments).where(eq(threadComments.id, commentId));
  
  // 게시글의 댓글 수 업데이트
  const commentCountResult = await db
    .select({ count: count() })
    .from(threadComments)
    .where(eq(threadComments.threadId, threadId));
  
  const commentCount = commentCountResult[0]?.count || 0;
  
  await db.update(threads)
    .set({ commentCount })
    .where(eq(threads.id, threadId));
  
  return NextResponse.json({ message: '댓글이 삭제되었습니다.' });
} 