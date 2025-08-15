import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { userExamFavorites } from '@/db/schema/userExamFavorites';
import { and, eq } from 'drizzle-orm';

// 사용자의 시험 즐겨찾기 목록 가져오기
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ message: '로그인 필요' }, { status: 401 });
  }

  try {
    const favorites = await db.query.userExamFavorites.findMany({
      where: (f, { eq, and }) => 
        and(eq(f.userId, session.user.id), eq(f.isFavorite, true)),
      orderBy: (f, { desc }) => [desc(f.updatedAt)]
    });

    const favoriteExamNames = favorites.map(fav => fav.examName);
    
    return NextResponse.json({ 
      favorites: favoriteExamNames,
      count: favoriteExamNames.length
    });
  } catch (error) {
    console.error('시험 즐겨찾기 조회 실패:', error);
    return NextResponse.json({ message: '서버 오류' }, { status: 500 });
  }
}

// 시험 즐겨찾기 추가/제거
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ message: '로그인 필요' }, { status: 401 });
  }

  const { examName, isFavorite } = await req.json();

  if (!examName) {
    return NextResponse.json({ message: 'examName 필요' }, { status: 400 });
  }

  try {
    // 이미 존재하는지 확인
    const existing = await db.query.userExamFavorites.findFirst({
      where: (f, { eq, and }) => 
        and(eq(f.userId, session.user.id), eq(f.examName, examName)),
    });

    if (existing) {
      // 업데이트
      await db.update(userExamFavorites)
        .set({ 
          isFavorite: isFavorite !== undefined ? isFavorite : true,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(userExamFavorites.userId, session.user.id),
            eq(userExamFavorites.examName, examName)
          )
        );
    } else {
      // 새로 생성
      await db.insert(userExamFavorites).values({
        userId: session.user.id,
        examName,
        isFavorite: isFavorite !== undefined ? isFavorite : true,
        updatedAt: new Date()
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: isFavorite ? '즐겨찾기에 추가되었습니다.' : '즐겨찾기에서 제거되었습니다.' 
    });
  } catch (error) {
    console.error('시험 즐겨찾기 설정 실패:', error);
    return NextResponse.json({ message: '서버 오류' }, { status: 500 });
  }
}

// 시험 즐겨찾기 삭제
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ message: '로그인 필요' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const examName = searchParams.get('examName');

  if (!examName) {
    return NextResponse.json({ message: 'examName 필요' }, { status: 400 });
  }

  try {
    await db.delete(userExamFavorites)
      .where(
        and(
          eq(userExamFavorites.userId, session.user.id),
          eq(userExamFavorites.examName, examName)
        )
      );

    return NextResponse.json({ 
      success: true, 
      message: '즐겨찾기에서 제거되었습니다.' 
    });
  } catch (error) {
    console.error('시험 즐겨찾기 삭제 실패:', error);
    return NextResponse.json({ message: '서버 오류' }, { status: 500 });
  }
} 