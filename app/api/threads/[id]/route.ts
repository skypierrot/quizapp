import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { threads } from '@/db/schema/threads';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  
  // 게시글 조회
  const result = await db.select().from(threads).where(eq(threads.id, id));
  if (!result[0]) {
    return NextResponse.json({ message: '게시글을 찾을 수 없습니다.' }, { status: 404 });
  }
  
  // 조회수 증가
  await db.update(threads)
    .set({ viewCount: result[0].viewCount + 1 })
    .where(eq(threads.id, id));
  
  // 태그 파싱
  const thread = {
    ...result[0],
    viewCount: result[0].viewCount + 1,
    tags: result[0].tags ? JSON.parse(result[0].tags) : [],
    voteCount: (result[0].upvotes || 0) - (result[0].downvotes || 0),
  };
  
  return NextResponse.json({ thread });
}

// 게시글 수정
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: '로그인 필요' }, { status: 401 });
  }
  
  const { id } = params;
  const { title, content, tags } = await req.json();
  
  // 게시글 존재 확인 및 작성자 검증
  const existing = await db.select().from(threads).where(eq(threads.id, id));
  if (!existing[0]) {
    return NextResponse.json({ message: '게시글을 찾을 수 없습니다.' }, { status: 404 });
  }
  if (existing[0].authorId !== session.user.id) {
    return NextResponse.json({ message: '수정 권한이 없습니다.' }, { status: 403 });
  }
  
  // 태그 배열을 JSON 문자열로 변환
  const tagsJson = tags && tags.length > 0 ? JSON.stringify(tags) : null;
  
  const [updatedThread] = await db.update(threads)
    .set({ 
      title, 
      content, 
      tags: tagsJson,
      updatedAt: new Date() 
    })
    .where(eq(threads.id, id))
    .returning();
    
  return NextResponse.json({ thread: updatedThread });
}

// 게시글 삭제
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: '로그인 필요' }, { status: 401 });
  }
  
  const { id } = params;
  
  // 게시글 존재 확인 및 작성자 검증
  const existing = await db.select().from(threads).where(eq(threads.id, id));
  if (!existing[0]) {
    return NextResponse.json({ message: '게시글을 찾을 수 없습니다.' }, { status: 404 });
  }
  if (existing[0].authorId !== session.user.id) {
    return NextResponse.json({ message: '삭제 권한이 없습니다.' }, { status: 403 });
  }
  
  await db.delete(threads).where(eq(threads.id, id));
  return NextResponse.json({ message: '게시글이 삭제되었습니다.' });
} 