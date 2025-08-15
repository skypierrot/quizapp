import { db } from '@/db';
import { questions, images, questionImageUsage } from '@/db/schema/index';
import { exams } from '@/db/schema/exams';
import { sql, eq, inArray, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const DEV_USER_ID = 'dev_user_123';

// Helper function to find or create an exam and return its ID
async function findOrCreateExamId(tx: any, examName: string, examDate: string, examSubject: string): Promise<string> {
  if (!examName || !examDate || !examSubject) {
    throw new Error('Exam name, date, and subject are required to find or create an exam ID.');
  }

  const existingExam = await tx
    .select({ id: exams.id })
    .from(exams)
    .where(
      and(
        eq(exams.name, examName),
        eq(exams.date, examDate),
        eq(exams.subject, examSubject)
      )
    )
    .limit(1);

  if (existingExam.length > 0 && existingExam[0].id) {
    return existingExam[0].id;
  }

  const newExamId = uuidv4();
  await tx.insert(exams).values({
    id: newExamId,
    name: examName,
    date: examDate,
    subject: examSubject,
    // round 필드는 nullable이거나 기본값이 있어야 함, 현재 스키마에 따라 다름
    // 만약 필수이지만 사용하지 않는다면, 스키마 변경 또는 더미 값 삽입 고려
  });
  return newExamId;
}

export async function saveQuestions(questionsArr: any[]) {
  const results = await db.transaction(async (tx) => {
    const savedQuestionResults = [];

    for (const q of questionsArr) {
      // q.examName, q.examDate, q.examSubject를 사용하여 examId 가져오기
      if (!q.examName || !q.examDate || !q.examSubject) {
        // 이 경우, 오류를 발생시키거나 기본값을 사용하거나, 해당 문제를 건너뛸 수 있습니다.
        // 여기서는 오류를 발생시키겠습니다.
        throw new Error(`Question with content "${q.content.substring(0, 20)}..." is missing examName, examDate, or examSubject.`);
      }
      const currentExamId = await findOrCreateExamId(tx, q.examName, q.examDate, q.examSubject);

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
        examId: currentExamId,
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
          examId: currentExamId,
        },
      }).returning({ id: questions.id });

      if (!insertedQuestions || insertedQuestions.length === 0) {
        throw new Error('Failed to insert question');
      }

      const insertedQuestion = insertedQuestions[0];
      if (!insertedQuestion || !insertedQuestion.id) {
        throw new Error('Failed to get inserted question ID');
      }

      const savedQuestionId = insertedQuestion.id;
      savedQuestionResults.push(insertedQuestion);

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