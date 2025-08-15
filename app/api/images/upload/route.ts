import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
import path from 'path';
import { randomUUID, createHash } from 'crypto';
import { db } from '@/db';
import { images } from '@/db/schema';
import { eq } from 'drizzle-orm';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'images', 'uploaded');

export async function POST(request: NextRequest) {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: '파일 없음' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    const hash = createHash('sha256').update(buffer).digest('hex');

    const existingImages = await db.select().from(images).where(eq(images.hash, hash)).limit(1);

    let fileUrl: string = '';

    if (existingImages.length > 0) {
      const existingImage = existingImages[0];
      if (existingImage) {
        fileUrl = existingImage.path;
        console.log(`[Image Upload] Hash found, using existing path: ${fileUrl}`);
      }
    } 
    
    if (!fileUrl) {
  const ext = path.extname(file.name) || `.${file.type.split('/')[1]}`;
  const uniqueFilename = `${randomUUID()}${ext}`;
      const filePath = path.join(UPLOAD_DIR, uniqueFilename);
  await writeFile(filePath, buffer);

      fileUrl = path.join('/images', 'uploaded', uniqueFilename).replace(/\\/g, '/');

      await db.insert(images).values({ hash: hash, path: fileUrl });
      console.log(`[Image Upload] New image saved: ${fileUrl}`);
    }

    return NextResponse.json({ success: true, url: fileUrl, hash: hash });

  } catch (error) {
    console.error('[Image Upload Error]', error);
    return NextResponse.json({ error: '이미지 업로드 실패', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
} 