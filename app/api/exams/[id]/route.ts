import { NextResponse } from 'next/server';
import { db } from '@/db';
import { exams, questions } from '@/db/schema';
import { eq, count } from 'drizzle-orm';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 인증 확인 (NextAuth 기반)
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. 관리자 역할 확인 (role이 없으면 false)
    const isAdmin = (session?.user as any)?.role === 'admin';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // 3. 경로 파라미터에서 ID 추출 및 유효성 검사
    const examId = params.id;
    if (!examId) {
      return NextResponse.json({ error: 'Exam ID is required' }, { status: 400 });
    }
    // UUID 형식이면 추가적인 유효성 검사 가능

    console.log(`Attempting to delete exam with ID: ${examId} by admin user: ${userId}`);

    // 4. (권장) 참조 무결성 검사: 해당 시험을 참조하는 문제가 있는지 확인
    const relatedQuestionsCountResult = await db
      .select({ value: count() })
      .from(questions)
      .where(eq(questions.examId, examId)) // questions 스키마에 examId 필드가 있다고 가정
      .limit(1);
      
    const relatedQuestionsCount = relatedQuestionsCountResult[0]?.value ?? 0;

    if (relatedQuestionsCount > 0) {
      console.warn(`Deletion prevented: Exam ID ${examId} is referenced by ${relatedQuestionsCount} questions.`);
      return NextResponse.json(
        { error: `Cannot delete exam: It is referenced by ${relatedQuestionsCount} questions.` },
        { status: 400 }
      );
    }

    // 5. 데이터베이스에서 시험 정보 삭제
    const deleteResult = await db
      .delete(exams)
      .where(eq(exams.id, examId))
      .returning({ deletedId: exams.id }); // 삭제된 ID 반환 (선택 사항)

    // 삭제된 레코드가 있는지 확인
    if (deleteResult.length === 0) {
      console.log(`Exam with ID ${examId} not found for deletion.`);
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    console.log(`Successfully deleted exam with ID: ${deleteResult[0].deletedId}`);
    return NextResponse.json({ message: 'Exam deleted successfully', deletedId: deleteResult[0].deletedId });

  } catch (error: any) {
    console.error('Error deleting exam:', error);
    // 데이터베이스 관련 오류 등 내부 서버 오류 처리
    if (error.code === '23503') { // PostgreSQL 외래 키 제약 조건 위반 코드 (참고용)
         return NextResponse.json(
            { error: 'Cannot delete exam due to existing references.', details: error.message },
            { status: 400 }
         );
    }
    return NextResponse.json(
      { error: 'Failed to delete exam', details: error.message },
      { status: 500 }
    );
  }
} 