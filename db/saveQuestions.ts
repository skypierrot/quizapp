import { db } from '@/lib/db';
import { questions } from '@/db/schema/questions';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DEV_USER_ID = 'dev_user_123';
const TMP_DIR = path.join(process.cwd(), 'public', 'images', 'tmp');
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'images', 'uploaded');

function ensureUploadDirExists(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

async function ensureDBConnection() {
  try {
    await db.select({ count: sql`COUNT(*)` }).from(questions).limit(1);
    return true;
  } catch {
    return false;
  }
}

function moveTmpToUploaded(tmpUrl: string): string {
  const normalizedUrl = tmpUrl.replace(/\\/g, '/').replace(/\/{2,}/g, '/');
  if (normalizedUrl.startsWith('/images/uploaded/')) {
    const filename = path.basename(normalizedUrl);
    return `/images/uploaded/${filename}`;
  }
  if (!normalizedUrl.startsWith('/images/tmp/')) return normalizedUrl;
  const filename = path.basename(normalizedUrl);
  const tmpPath = path.join(TMP_DIR, filename);
  const uploadedPath = path.join(UPLOAD_DIR, filename);
  if (!fs.existsSync(tmpPath)) return normalizedUrl;
  try {
    fs.renameSync(tmpPath, uploadedPath);
  } catch {
    return normalizedUrl;
  }
  if (!fs.existsSync(uploadedPath)) return normalizedUrl;
  return `/images/uploaded/${filename}`;
}

export async function saveQuestions(questionsArr: any[]) {
  const isDBConnected = await ensureDBConnection();
  if (!isDBConnected) throw new Error('DB 연결 실패');
  const results = [];
  for (const q of questionsArr) {
    // 옵션 이미지 이동
    const options = (q.options || []).map((opt: any) => ({
      ...opt,
      images: (opt.images || []).map((img: any) => {
        if (typeof img === 'string') return moveTmpToUploaded(img);
        if (img.url && (img.url.startsWith('/images/tmp/') || img.url.startsWith('/images/uploaded/')))
          return { ...img, url: moveTmpToUploaded(img.url) };
        return img;
      })
    }));
    // 문제/해설 이미지 이동
    let imageObjects = (q.images || []).map((img: any) => {
      if (img.url && img.url.startsWith('/images/tmp/')) {
        return { ...img, url: moveTmpToUploaded(img.url) };
      }
      return img;
    });
    let explanationImageObjects = (q.explanationImages || []).map((img: any) => {
      if (img.url && img.url.startsWith('/images/tmp/')) {
        return { ...img, url: moveTmpToUploaded(img.url) };
      }
      return img;
    });
    // 문제 ID
    const questionId = q.id || uuidv4();
    const questionImageDir = path.join(UPLOAD_DIR, questionId);
    ensureUploadDirExists(questionImageDir);
    // DB 저장
    const result = await db.insert(questions).values({
      id: questionId,
      content: q.content,
      options,
      answer: q.answer,
      explanation: q.explanation || '',
      tags: q.tags || [],
      images: imageObjects,
      explanationImages: explanationImageObjects,
      userId: DEV_USER_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning({ id: questions.id, tags: questions.tags });
    results.push(result[0]);
  }
  return results;
} 