import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
// import { db } from '@/db'; // DB 관련 import 제거
// import { images } from '@/db/schema/images'; // DB 관련 import 제거
// import { imageHistory } from '@/db/schema'; // DB 관련 import 제거

// 유효한 이미지 타입 (유효성 검사에 계속 사용)
// const validTypes = ['question', 'option', 'explanation']; // type 필드는 더 이상 사용하지 않으므로 주석 처리하거나 제거 가능
const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// 임시 저장 디렉토리 경로 정의
const TMP_DIR = path.join(process.cwd(), 'public', 'images', 'tmp');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    // const type = formData.get('type') as string; // type 필드는 더 이상 사용하지 않음
    // const relatedId = formData.get('relatedId') as string; // relatedId 필드는 더 이상 사용하지 않음
    // const userId = formData.get('userId') as string; // userId 필드는 더 이상 사용하지 않음

    // 유효성 검사
    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
    }

    // type 유효성 검사 제거
    // if (!validTypes.includes(type)) {
    //   return NextResponse.json({ error: '유효하지 않은 이미지 타입입니다.' }, { status: 400 });
    // }

    if (!validMimeTypes.includes(file.type)) {
      return NextResponse.json({ error: '유효하지 않은 파일 형식입니다. (JPG, PNG, GIF, WEBP만 허용)' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: '파일 크기가 너무 큽니다. 최대 10MB까지 허용됩니다.' }, { status: 400 });
    }

    // 파일 저장 경로 설정 (tmp 폴더 기준)
    const timestamp = Date.now();
    const uuid = uuidv4();
    const filename = `${timestamp}-${uuid}${path.extname(file.name)}`;
    // const uploadDir = path.join(process.cwd(), 'public', 'uploads', `${type}s`); // 이전 경로
    const uploadDir = TMP_DIR; // 새 임시 경로
    const filePath = path.join(uploadDir, filename);
    // const relativePath = `/uploads/${type}s/${filename}`; // 이전 경로
    const relativePath = `/images/tmp/${filename}`; // 새 임시 URL 경로

    // 임시 디렉토리가 없는 경우 생성
    await mkdir(uploadDir, { recursive: true });

    // 파일 저장
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // DB 저장 로직 제거
    // const [imageRecord] = await db.insert(images).values({ ... }).returning();
    // if (userId) { ... }

    // 성공 응답: 임시 파일 URL 반환
    return NextResponse.json({
      success: true,
      // image 객체 대신 URL만 반환하거나, 필요하다면 filename 정도만 포함
      url: relativePath,
      // filename: filename // 필요한 경우 filename도 포함
    });

  } catch (error) {
    console.error('임시 이미지 업로드 중 오류 발생:', error);
    return NextResponse.json({ error: '임시 이미지 업로드 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 