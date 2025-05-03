import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { eq, inArray } from 'drizzle-orm';
import { questions } from '@/db/schema';

// Helper: 문제를 직렬화하여 중복 판단용 키 생성
function serializeQuestion(q: any) {
  return JSON.stringify({
    content: q.content,
    options: q.options,
    answer: q.answer,
    explanation: q.explanation,
    images: q.images,
    explanationImages: q.explanationImages,
    tags: q.tags,
  });
}

// GET: 중복 문제 그룹 반환
export async function GET() {
  const all = await db.select().from(questions);
  const map = new Map<string, any[]>();
  for (const q of all) {
    const key = serializeQuestion(q);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(q);
  }
  // 2개 이상인 그룹만 반환
  const duplicates = Array.from(map.values()).filter(arr => arr.length > 1);
  return NextResponse.json({ duplicates });
}

// POST: 중복 문제 정리(한 개만 남기고 삭제)
export async function POST() {
  const all = await db.select().from(questions);
  const map = new Map<string, any[]>();
  for (const q of all) {
    const key = serializeQuestion(q);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(q);
  }
  const toDelete: string[] = [];
  for (const arr of map.values()) {
    if (arr.length > 1) {
      // 첫 번째만 남기고 나머지 삭제
      for (let i = 1; i < arr.length; ++i) {
        toDelete.push(arr[i].id);
      }
    }
  }
  if (toDelete.length > 0) {
    await db.delete(questions).where(
      inArray(questions.id, toDelete)
    );
  }
  return NextResponse.json({ deleted: toDelete.length });
}
