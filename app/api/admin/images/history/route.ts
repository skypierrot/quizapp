import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { imageHistory } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const imageIdParam = searchParams.get('imageId');
    
    if (imageIdParam) {
      // 특정 이미지의 이력만 조회
      const records = await db
        .select()
        .from(imageHistory)
        .where(eq(imageHistory.imageId, imageIdParam))
        .orderBy(desc(imageHistory.createdAt));
      
      return NextResponse.json(records);
    } else {
      // 모든 이력 조회
      const records = await db
        .select()
        .from(imageHistory)
        .orderBy(desc(imageHistory.createdAt));
      
      return NextResponse.json(records);
    }
  } catch (error) {
    console.error('이미지 변경 이력 조회 중 오류 발생:', error);
    return NextResponse.json({ error: '이미지 변경 이력 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 