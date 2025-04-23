import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const TMP_DIR = path.join(process.cwd(), 'public', 'images', 'tmp');

export async function POST(request: NextRequest) {
  await mkdir(TMP_DIR, { recursive: true });
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: '파일 없음' }, { status: 400 });

  const ext = path.extname(file.name) || `.${file.type.split('/')[1]}`;
  const uniqueFilename = `${randomUUID()}${ext}`;
  const filePath = path.join(TMP_DIR, uniqueFilename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const fileUrl = path.join('/images', 'tmp', uniqueFilename).replace(/\\/g, '/');
  return NextResponse.json({ success: true, url: fileUrl });
} 