import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { images } from '@/db/schema/images';
import { imageHistory } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Next.js 15.3.0에서는 동적 경로 매개변수 사용에 문제가 있으므로 URL에서 직접 ID 추출
export async function PATCH(request: NextRequest) {
  try {
    // URL에서 ID 추출
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const idStr = pathParts[pathParts.length - 1];
    const imageId = parseInt(idStr);

    const { status, reason, userId } = await request.json();

    if (!imageId || isNaN(imageId)) {
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

    const currentStatus = imageRecord[0].status;

    // 중복 요청 방지
    if (currentStatus === status) {
      return NextResponse.json({ 
        success: true, 
        message: '이미지 상태가 이미 요청한 상태입니다.',
        image: imageRecord[0]
      });
    }

    // 이미지 상태 업데이트
    const [updatedImage] = await db.update(images)
      .set({ 
        status, 
        updatedAt: new Date() 
      })
      .where(eq(images.id, imageId))
      .returning();

    // 변경 타입 결정
    let changeType: string;
    if (status === 'pending_deletion') {
      changeType = 'delete_request';
    } else if (status === 'active' && currentStatus === 'pending_deletion') {
      changeType = 'restore';
    } else if (status === 'deleted') {
      changeType = 'delete';
    } else {
      changeType = 'update';
    }

    // 변경 이력 기록
    await db.insert(imageHistory).values({
      imageId,
      changeType,
      changedBy: userId,
      reason: reason || `상태 변경: ${currentStatus} → ${status}`,
    });

    return NextResponse.json({ 
      success: true, 
      message: '이미지 상태가 업데이트되었습니다.',
      image: updatedImage
    });
    
  } catch (error) {
    console.error('이미지 상태 업데이트 중 오류 발생:', error);
    return NextResponse.json({ error: '이미지 상태 업데이트 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 