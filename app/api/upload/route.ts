import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/db';
import { images } from '@/db/schema/images';
import { imageHistory } from '@/db/schema';

// 유효한 이미지 타입
const validTypes = ['question', 'option', 'explanation'];
const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    const relatedId = formData.get('relatedId') as string;
    const userId = formData.get('userId') as string; // 사용자 ID
    
    // 유효성 검사
    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
    }
    
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: '유효하지 않은 이미지 타입입니다.' }, { status: 400 });
    }
    
    if (!validMimeTypes.includes(file.type)) {
      return NextResponse.json({ error: '유효하지 않은 파일 형식입니다. (JPG, PNG, GIF, WEBP만 허용)' }, { status: 400 });
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: '파일 크기가 너무 큽니다. 최대 10MB까지 허용됩니다.' }, { status: 400 });
    }
    
    // 파일 저장 경로 설정
    const timestamp = Date.now();
    const uuid = uuidv4();
    const filename = `${timestamp}-${uuid}${path.extname(file.name)}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', `${type}s`);
    const filePath = path.join(uploadDir, filename);
    const relativePath = `/uploads/${type}s/${filename}`;
    
    // 디렉토리가 없는 경우 생성
    await mkdir(uploadDir, { recursive: true });
    
    // 파일 저장
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);
    
    // DB에 메타데이터 저장 (status를 active로 설정)
    const [imageRecord] = await db.insert(images).values({
      filename,
      originalName: file.name,
      path: relativePath,
      type,
      size: file.size,
      mimeType: file.type,
      questionId: type === 'question' ? parseInt(relatedId || '0') : null,
      optionId: type === 'option' ? parseInt(relatedId || '0') : null,
      status: 'active'
    }).returning();
    
    // 이미지 이력 기록
    if (userId) {
      await db.insert(imageHistory).values({
        imageId: imageRecord.id,
        changeType: 'create',
        changedBy: userId,
        reason: '이미지 업로드',
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      image: {
        id: imageRecord.id,
        path: relativePath,
        filename,
        status: 'active'
      }
    });
    
  } catch (error) {
    console.error('이미지 업로드 중 오류 발생:', error);
    return NextResponse.json({ error: '이미지 업로드 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 