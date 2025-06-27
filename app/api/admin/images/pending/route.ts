import { NextResponse } from 'next/server';
import { db } from '@/db';
import { images } from '@/db/schema/images';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    // 삭제 대기 중인 이미지 목록 조회
    const pendingImages = await db.select().from(images).where(eq(images.status, 'pending_deletion'));
    
    return NextResponse.json(pendingImages);
  } catch (error) {
    console.error('삭제 대기 이미지 조회 중 오류 발생:', error);
    return NextResponse.json({ error: '삭제 대기 이미지 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 