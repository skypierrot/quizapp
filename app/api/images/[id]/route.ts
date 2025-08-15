import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { images } from '@/db/schema/images';
import { eq } from 'drizzle-orm';

// Next.js 15.3.0에서는 동적 경로 매개변수 사용에 문제가 있으므로 URL에서 직접 ID 추출
export async function PATCH(request: NextRequest) {
  try {
    // URL에서 ID 추출
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const imageId = pathParts[pathParts.length - 1] || '';

    const { status, reason, userId } = await request.json();

    if (!imageId) {
      return NextResponse.json({ error: '유효하지 않은 이미지 ID입니다.' }, { status: 400 });
    }

    if (!status || !['active', 'pending_deletion', 'deleted'].includes(status)) {
      return NextResponse.json({ error: '유효하지 않은 상태값입니다.' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: '사용자 ID가 필요합니다.' }, { status: 400 });
    }

    // 이미지 정보 조회
    const imageRecord = await db.select().from(images).where(eq(images.id, imageId)).limit(1);
    
    if (imageRecord.length === 0) {
      return NextResponse.json({ error: '이미지를 찾을 수 없습니다.' }, { status: 404 });
    }

    const imageData = imageRecord[0];
    if (!imageData) {
      return NextResponse.json({ error: '이미지 데이터를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 현재 스키마에는 status 컬럼이 없으므로 단순히 이미지 정보만 반환
    return NextResponse.json({ 
      success: true, 
      message: '이미지 정보를 확인했습니다.',
      image: {
        id: imageData.id,
        hash: imageData.hash,
        path: imageData.path,
        createdAt: imageData.createdAt
      }
    });
    
  } catch (error) {
    console.error('이미지 상태 업데이트 중 오류 발생:', error);
    return NextResponse.json({ error: '이미지 상태 업데이트 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 