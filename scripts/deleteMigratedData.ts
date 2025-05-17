import { db } from '@/db';
import { exams, questions } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

async function deleteDataForExamDate(examName: string, examDate: string) {
  console.log(`Attempting to delete data for exam: "${examName}", date: "${examDate}"`);

  try {
    // 1. 해당 시험명과 날짜로 exams 레코드 ID 조회
    const examRecordsToDelete = await db
      .select({ id: exams.id, subject: exams.subject })
      .from(exams)
      .where(and(eq(exams.name, examName), eq(exams.date, examDate)));

    if (examRecordsToDelete.length === 0) {
      console.log(`No exam records found for "${examName}" on "${examDate}". Nothing to delete.`);
      return;
    }

    const examIdsToDelete = examRecordsToDelete.map(e => e.id);
    console.log(`Found ${examRecordsToDelete.length} exam record(s) to delete (IDs: ${examIdsToDelete.join(', ')}):`);
    examRecordsToDelete.forEach(e => console.log(`  - Subject: ${e.subject}, ID: ${e.id}`));

    // 2. 조회된 examId를 사용하여 questions 삭제
    if (examIdsToDelete.length > 0) {
      const deletedQuestionsResult = await db
        .delete(questions)
        .where(inArray(questions.examId, examIdsToDelete))
        .returning({ id: questions.id });
      console.log(`Deleted ${deletedQuestionsResult.length} question(s) associated with the above exam IDs.`);
    } else {
      console.log("No exam IDs found, so no questions to delete.");
    }
    
    // 3. exams 레코드 삭제
    const deletedExamsResult = await db
      .delete(exams)
      .where(inArray(exams.id, examIdsToDelete))
      .returning({ name: exams.name, date: exams.date, subject: exams.subject });
    
    console.log(`Deleted ${deletedExamsResult.length} exam record(s):`);
    deletedExamsResult.forEach(e => console.log(`  - Name: ${e.name}, Date: ${e.date}, Subject: ${e.subject}`));

    console.log(`Successfully deleted data for "${examName}" on "${examDate}".`);

  } catch (error) {
    console.error(`Error deleting data for "${examName}" on "${examDate}":`, error);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Usage: tsx scripts/deleteMigratedData.ts <examName> <examDate>");
    console.error("Example: tsx scripts/deleteMigratedData.ts \"건설안전기사\" \"2003-03-16\"");
    process.exit(1);
  }

  const examName = args[0];
  const examDate = args[1]; // YYYY-MM-DD format

  // DB 연결이 초기화될 시간을 약간 줍니다.
  // 실제 프로덕션 코드에서는 db/index.ts의 getDB()를 호출하는 것이 더 견고합니다.
  // 하지만 이 스크립트는 일회성이므로 간단히 처리합니다.
  await new Promise(resolve => setTimeout(resolve, 1000)); 

  await deleteDataForExamDate(examName, examDate);
  
  // DB 작업 후 명시적 종료
  process.exit(0);
}

main().catch(error => {
  console.error("Script failed:", error);
  process.exit(1);
}); 