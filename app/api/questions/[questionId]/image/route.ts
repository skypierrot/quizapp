import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { questions } from '@/db/schema';
import { images } from '@/db/schema/images';
import { eq } from 'drizzle-orm';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// 유효한 이미지 타입
const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const { questionId } = params;
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'question'; // 기본값은 'question'
    const userId = formData.get('userId') as string;
    
    // 유효성 검사
    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
    }
    
    if (!validMimeTypes.includes(file.type)) {
      return NextResponse.json({ error: '유효하지 않은 파일 형식입니다. (JPG, PNG, GIF, WEBP만 허용)' }, { status: 400 });
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: '파일 크기가 너무 큽니다. 최대 10MB까지 허용됩니다.' }, { status: 400 });
    }
    
    // 문제 존재 확인
    const questionExists = await db.select()
      .from(questions)
      .where(eq(questions.id, questionId))
      .limit(1);
    
    if (questionExists.length === 0) {
      return NextResponse.json({ error: '존재하지 않는 문제입니다.' }, { status: 404 });
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
    
    // DB에 이미지 메타데이터 저장
    const [imageRecord] = await db.insert(images).values({
      filename,
      originalName: file.name,
      path: relativePath,
      type,
      size: file.size,
      mimeType: file.type,
      questionId: parseInt(questionId),
      status: 'active'
    }).returning();
    
    return NextResponse.json({ 
      success: true, 
      image: {
        id: imageRecord.id,
        path: relativePath,
        filename,
        type,
        status: 'active'
      }
    });
    
  } catch (error) {
    console.error('이미지 업로드 중 오류 발생:', error);
    return NextResponse.json({ error: '이미지 업로드 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 