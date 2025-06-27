import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { threads } from '@/db/schema/threads';
import { desc, count } from 'drizzle-orm';

// 자유게시판 목록 조회 (페이지네이션)
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // 전체 개수
    const totalResult = await db.select({ count: count() }).from(threads);
    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    // 목록 조회
    const result = await db.select()
      .from(threads)
      .orderBy(desc(threads.createdAt))
      .limit(limit)
      .offset(offset);

    // 각 게시글의 투표수 계산 (upvotes - downvotes)
    const threadsWithVotes = result.map(thread => ({
      ...thread,
      voteCount: (thread.upvotes || 0) - (thread.downvotes || 0),
    }));

    return NextResponse.json({ threads: threadsWithVotes, total, page, totalPages });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// 자유게시판 글 작성 (로그인 필요)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: '로그인 필요' }, { status: 401 });
  }
  const { title, content, category } = await request.json();
  if (!title || !content || !category) {
    return NextResponse.json({ message: '제목, 카테고리, 내용을 입력하세요.' }, { status: 400 });
  }
  const [thread] = await db.insert(threads).values({
    title,
    content,
    category,
    authorId: session.user.id,
  }).returning();
  return NextResponse.json({ thread });
} 