import { db } from '@/db';
import { exams, questions } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

async function deleteExamData(examName: string, examDate: string) {
  if (examDate && examDate.trim() !== '') {
    console.log(`Attempting to delete data for exam: "${examName}", specific date: "${examDate}"`);
  } else {
    console.log(`Attempting to delete ALL data for exam: "${examName}"`);
  }

  try {
    let queryConditions = [eq(exams.name, examName)];
    if (examDate && examDate.trim() !== '') {
      queryConditions.push(eq(exams.date, examDate));
    }

    // 1. 해당 조건으로 exams 레코드 ID 조회
    const examRecordsToDelete = await db
      .select({ id: exams.id, date: exams.date, subject: exams.subject })
      .from(exams)
      .where(and(...queryConditions));

    if (examRecordsToDelete.length === 0) {
      if (examDate) {
        console.log(`No exam records found for "${examName}" on "${examDate}". Nothing to delete.`);
      } else {
        console.log(`No exam records found for "${examName}". Nothing to delete.`);
      }
      return;
    }

    const examIdsToDelete = examRecordsToDelete.map(e => e.id);
    console.log(`Found ${examRecordsToDelete.length} exam record(s) to delete (IDs: ${examIdsToDelete.join(', ')}):`);
    examRecordsToDelete.forEach(e => console.log(`  - Subject: ${e.subject}, Date: ${e.date}, ID: ${e.id}`));

    // 2. 조회된 examId를 사용하여 questions 삭제
    if (examIdsToDelete.length > 0) {
      const deletedQuestionsResult = await db
        .delete(questions)
        .where(inArray(questions.examId, examIdsToDelete))
        .returning({ id: questions.id });
      console.log(`Deleted ${deletedQuestionsResult.length} question(s) associated with the above exam IDs.`);
    } else {
      // 이 경우는 examRecordsToDelete.length === 0 에서 이미 처리됨
    }
    
    // 3. exams 레코드 삭제
    const deletedExamsResult = await db
      .delete(exams)
      .where(inArray(exams.id, examIdsToDelete))
      .returning({ name: exams.name, date: exams.date, subject: exams.subject });
    
    console.log(`Deleted ${deletedExamsResult.length} exam record(s):`);
    deletedExamsResult.forEach(e => console.log(`  - Name: ${e.name}, Date: ${e.date}, Subject: ${e.subject}`));

    if (examDate) {
      console.log(`Successfully deleted data for "${examName}" on "${examDate}".`);
    } else {
      console.log(`Successfully deleted ALL data for "${examName}".`);
    }

  } catch (error) {
    console.error(`Error deleting data for "${examName}"${examDate ? ` on "${examDate}"` : ' (all dates)'}:`, error);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1 || args.length > 2) {
    console.error("Usage: tsx scripts/deleteMigratedData.ts <examName> [examDate]");
    console.error("  <examName>: The name of the exam to delete data for (e.g., \"건설안전기사\").");
    console.error("  [examDate]: Optional. The specific date (YYYY-MM-DD) to delete data for.");
    console.error("              If not provided, ALL data for the given examName will be deleted.");
    console.error("\nExamples:");
    console.error("  tsx scripts/deleteMigratedData.ts \"건설안전기사\" \"2003-03-16\"  (Deletes specific date)");
    console.error("  tsx scripts/deleteMigratedData.ts \"건설안전기사\"              (Deletes ALL dates for this exam)");
    process.exit(1);
  }

  const examName = args[0];
  const examDate = args[1]; // Optional, will be undefined if not provided

  // DB 연결이 초기화될 시간을 약간 줍니다.
  await new Promise(resolve => setTimeout(resolve, 1000)); 

  console.warn("-------------------------------------------------------------------------");
  console.warn("WARNING: This script will permanently delete data from the database!");
  if (examDate) {
    console.warn(`Target: Exam "${examName}", Date "${examDate}"`);
  } else {
    console.warn(`Target: ALL data for Exam "${examName}"`);
  }
  console.warn("Review the target above carefully.");
  console.warn("-------------------------------------------------------------------------");
  
  // 사용자 확인 절차 (실제 실행 전 확인) - 실제 운영에서는 readline 등을 사용할 수 있으나 여기서는 간단히 처리
  // 이 부분은 실제 실행 시에는 주석 처리하거나, 더 안전한 사용자 확인 메커니즘으로 대체해야 할 수 있습니다.
  // 여기서는 터미널 프롬프트를 통해 사용자에게 직접 Y/N 입력을 유도하는 대신, 
  // 명시적으로 "--confirm" 플래그를 추가해야 실행되도록 변경하는 것이 더 안전할 수 있습니다.
  // 지금은 자동 실행됩니다.
  
  // 예: 5초 대기 후 실행 또는 특정 플래그 요구
  // if (!args.includes('--force-delete-i-know-what-i-am-doing')) {
  //   console.log("To proceed with deletion, re-run the script with the '--force-delete-i-know-what-i-am-doing' flag.");
  //   process.exit(0);
  // }

  await deleteExamData(examName, examDate || '');
  
  process.exit(0);
}

main().catch(error => {
  console.error("Script failed globally:", error);
  process.exit(1);
}); 