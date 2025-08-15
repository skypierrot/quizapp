import { db } from '@/db';
import { tags, questionTags } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// 태그 upsert (type+value로 중복 방지)
export async function upsertTag(type: string, value: string) {
  const found = await db.select().from(tags).where(and(eq(tags.type, type), eq(tags.value, value)));
  if (found.length > 0 && found[0]) return found[0].id;
  const inserted = await db.insert(tags).values({ type, value }).returning({ id: tags.id });
  if (inserted && inserted.length > 0 && inserted[0]) {
    return inserted[0].id;
  }
  return null;
}

// 문제와 태그 연결 (여러 태그)
export async function linkQuestionTags(questionId: string, tagIds: string[]) {
  if (!questionId || !tagIds?.length) return;
  const values = tagIds.map(tagId => ({ questionId, tagId }));
  await db.insert(questionTags).values(values).onConflictDoNothing();
} 