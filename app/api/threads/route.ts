import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { threads } from '@/db/schema/threads';
import { desc, count, asc, ilike, eq, and, or } from 'drizzle-orm';

// 자유게시판 목록 조회 (검색, 필터링, 정렬 지원)
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    
    // 검색 및 필터 파라미터
    const search = url.searchParams.get('search') || '';
    const category = url.searchParams.get('category') || '';
    const sortBy = url.searchParams.get('sortBy') || 'latest'; // latest, popular, views, comments
    const tag = url.searchParams.get('tag') || '';

    // 기본 쿼리 조건
    let whereConditions = [];
    
    // 검색 조건 (제목 또는 내용에서 검색)
    if (search) {
      whereConditions.push(
        or(
          ilike(threads.title, `%${search}%`),
          ilike(threads.content, `%${search}%`)
        )
      );
    }
    
    // 카테고리 필터
    if (category) {
      whereConditions.push(eq(threads.category, category));
    }
    
    // 태그 필터 (JSON 배열에서 검색)
    if (tag) {
      whereConditions.push(ilike(threads.tags, `%"${tag}"%`));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // 정렬 조건
    let orderBy;
    switch (sortBy) {
      case 'popular':
        orderBy = [desc(threads.upvotes), desc(threads.createdAt)];
        break;
      case 'views':
        orderBy = [desc(threads.viewCount), desc(threads.createdAt)];
        break;
      case 'comments':
        orderBy = [desc(threads.commentCount), desc(threads.createdAt)];
        break;
      case 'oldest':
        orderBy = [asc(threads.createdAt)];
        break;
      default: // 'latest'
        orderBy = [desc(threads.isPinned), desc(threads.createdAt)];
    }

    // 전체 개수
    const totalResult = await db
      .select({ count: count() })
      .from(threads)
      .where(whereClause);
    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    // 목록 조회
    const query = db
      .select()
      .from(threads)
      .where(whereClause)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset);

    const result = await query;

    // 각 게시글의 투표수 계산 및 태그 파싱
    const threadsWithVotes = result.map(thread => ({
      ...thread,
      voteCount: (thread.upvotes || 0) - (thread.downvotes || 0),
      tags: thread.tags ? JSON.parse(thread.tags) : [],
    }));

    return NextResponse.json({ 
      threads: threadsWithVotes, 
      total, 
      page, 
      totalPages,
      search,
      category,
      sortBy,
      tag
    });
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
  const { title, content, category, tags } = await request.json();
  if (!title || !content || !category) {
    return NextResponse.json({ message: '제목, 카테고리, 내용을 입력하세요.' }, { status: 400 });
  }
  
  // 태그 배열을 JSON 문자열로 변환
  const tagsJson = tags && tags.length > 0 ? JSON.stringify(tags) : null;
  
  const [thread] = await db.insert(threads).values({
    title,
    content,
    category,
    tags: tagsJson,
    authorId: session.user.id,
  }).returning();
  
  return NextResponse.json({ thread });
} 