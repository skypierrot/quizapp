import { db } from '@/lib/db'; // DB 인스턴스 경로 확인 필요
import { exams } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

// exams 테이블 타입 (id, createdAt, updatedAt 제외)
type NewExamDetails = Omit<typeof exams.$inferSelect, 'id' | 'createdAt' | 'updatedAt'>;

// Zod 스키마 정의 (API의 createExamSchema와 일치)
const createExamSchema = z.object({
  title: z.string().min(1, "Title is required"),
  year: z.coerce.number().int().min(1900, "Invalid year"),
  subject: z.string().min(1, "Subject is required"),
  type: z.string().min(1, "Type is required"),
  session: z.coerce.number().int().min(1, "Session must be a positive integer"),
});

/**
 * FormData에서 시험 정보를 추출하고, 
 * 기존 시험 ID를 반환하거나 새 시험을 생성하고 ID를 반환합니다.
 * 유효하지 않거나 정보가 누락된 경우 에러를 발생시킵니다.
 */
export async function getExamId(formData: FormData): Promise<string> {
  const examIdFromData = formData.get('examId') as string | null;

  if (examIdFromData) {
    // examId 유효성 검증
    const existingExam = await db.select({ id: exams.id })
      .from(exams)
      .where(eq(exams.id, examIdFromData))
      .limit(1);
    if (existingExam.length === 0) {
      throw new Error(`Invalid Exam ID provided: ${examIdFromData}`);
    }
    return examIdFromData; // 유효한 기존 examId 반환
  }

  // 새 시험 정보 추출 및 유효성 검사
  const newExamData = {
    title: formData.get('examTitle') as string | null,
    year: formData.get('examYear') ? Number(formData.get('examYear')) : null,
    subject: formData.get('examSubject') as string | null,
    type: formData.get('examType') as string | null,
    session: formData.get('examSession') ? Number(formData.get('examSession')) : null,
  };

  const validation = createExamSchema.safeParse(newExamData);
  if (!validation.success) {
     console.error("New Exam Details Validation Error:", validation.error.flatten());
     // Zod 에러 메시지를 좀 더 상세하게 반환
     const errorMessages = Object.entries(validation.error.flatten().fieldErrors)
       .map(([field, errors]) => `${field}: ${errors?.join(', ')}`)
       .join('; ');
     throw new Error(`Invalid or missing new exam details: ${errorMessages}`);
  }

  const { title, year, subject, type, session } = validation.data;

  // 기존 시험 정보 조회 (UNIQUE 인덱스를 활용하여 title, year, session 만으로도 가능하나, 모든 필드 비교)
  const existingExam = await db.select({ id: exams.id })
    .from(exams)
    .where(and(
      eq(exams.title, title),
      eq(exams.year, year),
      eq(exams.session, session),
      eq(exams.subject, subject),
      eq(exams.type, type)
    ))
    .limit(1);

  if (existingExam.length > 0) {
    return existingExam[0].id; // 이미 존재하는 시험의 ID 반환
  }

  // 새 시험 정보 생성
  try {
      const newExam = await db.insert(exams).values({
          title,
          year,
          subject,
          type,
          session,
      }).returning({ id: exams.id });

      if (newExam.length === 0 || !newExam[0]?.id) {
          throw new Error('Failed to create new exam entry in DB.');
      }
      console.log("Created new exam with ID:", newExam[0].id);
      return newExam[0].id; // 새로 생성된 시험 ID 반환
  } catch (dbError) {
      console.error("Error inserting new exam:", dbError);
      // UNIQUE 제약 조건 위반 시 (동시성 문제)
      if (dbError instanceof Error && 'code' in dbError && dbError.code === '23505') {
          const raceConditionExam = await db.select({ id: exams.id })
              .from(exams)
              .where(and(eq(exams.title, title), eq(exams.year, year), eq(exams.session, session), eq(exams.subject, subject), eq(exams.type, type)))
              .limit(1);
          if (raceConditionExam.length > 0) {
              return raceConditionExam[0].id;
          }
      }
      throw new Error('Failed to save new exam information.'); 
  }
} 