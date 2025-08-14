import { NextResponse } from 'next/server';
import { db } from '@/db';
import { images } from '@/db/schema/images';

export async function GET() {
  try {
    // 모든 이미지 목록 조회 (status 컬럼이 없으므로)
    const allImages = await db.select().from(images);
    
    return NextResponse.json(allImages);
  } catch (error) {
    console.error('이미지 조회 중 오류 발생:', error);
    return NextResponse.json({ error: '이미지 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 