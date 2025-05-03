import { db } from '@/db';
import { questions, images, questionImageUsage } from '@/db/schema/index';
import { sql, eq, inArray } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const DEV_USER_ID = 'dev_user_123';

export async function saveQuestions(questionsArr: any[]) {
  const results = await db.transaction(async (tx) => {
    const savedQuestionResults = [];

  for (const q of questionsArr) {
      const questionId = q.id || uuidv4();
      const options = (q.options || []).map((opt: any, index: number) => ({
        number: opt.number ?? index + 1,
        text: opt.text || '',
        images: Array.isArray(opt.images) ? opt.images.filter((img: any) => img && img.url) : [],
      }));
      const imagesField = Array.isArray(q.images) ? q.images.filter((img: any) => img && img.url && img.hash) : [];
      const explanationImagesField = Array.isArray(q.explanationImages) ? q.explanationImages.filter((img: any) => img && img.url && img.hash) : [];

      const insertedQuestions = await tx.insert(questions).values({
        id: questionId,
        content: q.content,
        options: options,
        answer: q.answer,
        explanation: q.explanation || '',
        tags: q.tags || [],
        images: imagesField,
        explanationImages: explanationImagesField,
        userId: DEV_USER_ID,
        examId: q.examId,
      }).onConflictDoUpdate({
        target: questions.id,
        set: {
          content: q.content,
          options: options,
          answer: q.answer,
          explanation: q.explanation || '',
          tags: q.tags || [],
          images: imagesField,
          explanationImages: explanationImagesField,
          updatedAt: new Date(),
        },
      }).returning({ id: questions.id });

      const savedQuestionId = insertedQuestions[0].id;
      savedQuestionResults.push(insertedQuestions[0]);

      if (q.id) {
        await tx.delete(questionImageUsage).where(eq(questionImageUsage.questionId, savedQuestionId));
      }

      const uniqueImageHashes = new Set<string>();
      imagesField.forEach((img: any) => uniqueImageHashes.add(img.hash));
      explanationImagesField.forEach((img: any) => uniqueImageHashes.add(img.hash));
      options.forEach((opt: any) => {
        if (Array.isArray(opt.images)) {
          opt.images.forEach((img: any) => {
            if (img && img.hash) uniqueImageHashes.add(img.hash);
          });
        }
      });

      const hashesToQuery = Array.from(uniqueImageHashes);
      console.log(`[saveQuestions] Question ID: ${savedQuestionId}, Hashes to Query:`, hashesToQuery);

      if (hashesToQuery.length > 0) {
        const imageRecords = await tx.select({ id: images.id, hash: images.hash })
                                       .from(images)
                                       .where(inArray(images.hash, hashesToQuery));
        console.log(`[saveQuestions] Found Image Records for hashes:`, imageRecords);

        const hashToIdMap = new Map(imageRecords.map(record => [record.hash, record.id]));
        console.log(`[saveQuestions] Hash to ID Map:`, hashToIdMap);

        const usageRecords: { questionId: string; imageId: string }[] = [];
        hashesToQuery.forEach(hash => {
          const imageId = hashToIdMap.get(hash);
          console.log(`[saveQuestions] Checking hash: ${hash}, Found imageId: ${imageId}`);
          if (imageId) {
            usageRecords.push({
              questionId: savedQuestionId,
              imageId: imageId,
            });
          }
        });

        console.log(`[saveQuestions] Records to insert into question_image_usage:`, usageRecords);
        if (usageRecords.length > 0) {
          try {
            await tx.insert(questionImageUsage).values(usageRecords).onConflictDoNothing();
            console.log(`[saveQuestions] Successfully inserted/ignored ${usageRecords.length} records into question_image_usage.`);
          } catch (insertError) {
            console.error(`[saveQuestions] Error inserting into question_image_usage:`, insertError);
  }
        }
      }
    }

    return savedQuestionResults;
  });

  return results;
} 