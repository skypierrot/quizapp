import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { exams, questions } from '@/db/schema'; // questions 임포트 추가 및 경로 수정
import { sql, and, eq, count, SQL, asc, desc } from 'drizzle-orm'; // eq, count, substr 제거, asc, desc 임포트 추가

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tagsParam = searchParams.get('tags');

  try {
    const filterConditions: SQL[] = [];
    let examNameFilter: string | null = null;
    let dateFilter: string | null = null; // 'yearFilter'에서 'dateFilter'로 변경, YYYY-MM-DD 형식
    let subjectFilter: string | null = null;

    if (tagsParam) {
      const tags = tagsParam.split(',').map(tag => tag.trim());
      tags.forEach(tag => {
        if (tag.startsWith('시험명:')) {
          examNameFilter = tag.replace('시험명:', '');
        } else if (tag.startsWith('날짜:')) { // '연도:'에서 '날짜:'로 변경
          dateFilter = tag.replace('날짜:', ''); // YYYY-MM-DD 형식으로 저장
        } else if (tag.startsWith('과목:')) {
          subjectFilter = tag.replace('과목:', '');
        }
        // TODO: 기타 태그(questions.tags)에 대한 필터링이 필요하면 추가 구현
      });
    }

    if (examNameFilter) {
      filterConditions.push(eq(exams.name, examNameFilter));
    }
    if (dateFilter) {
      filterConditions.push(eq(exams.date, dateFilter));
    }
    if (subjectFilter) {
      filterConditions.push(eq(exams.subject, subjectFilter));
    }

    const finalFilter = filterConditions.length > 0 ? and(...filterConditions) : undefined;

    const examInstancesData = await db
      .select({
        examName: exams.name,
        year: sql<string>`to_char(${exams.date}::date, 'YYYY')`.as('exam_year'), // 연도 정보는 계속 추출
        date: exams.date,
        subject: exams.subject,
        questionCount: count(questions.id)
      })
      .from(exams)
      .leftJoin(questions, eq(exams.id, questions.examId))
      .where(finalFilter)
      // exams.id (PK)를 포함하여 exams 테이블의 각 레코드를 고유하게 식별하고,
      // 해당 레코드(시험명, 날짜, 과목 조합)에 연결된 문제 수를 계산합니다.
      .groupBy(exams.id, exams.name, exams.date, exams.subject)
      .orderBy(
        // exams.date를 date 타입으로 캐스팅 후 to_char 적용
        desc(sql<string>`to_char(${exams.date}::date, 'YYYY')`), 
        asc(exams.name), 
        asc(exams.subject)
      )
      .execute();

    const examInstances = examInstancesData.map(item => ({
      examName: item.examName,
      year: item.year, 
      date: item.date,
      subject: item.subject,
      questionCount: item.questionCount,
    }));

    console.log(`[API] /api/exam-instances called with tags: ${tagsParam}, Found: ${examInstances.length}`);
    return NextResponse.json({ examInstances });

  } catch (error: any) { // error 타입을 any로 명시하여 상세 정보 접근
    console.error("[API Error] /api/exam-instances:", {
      message: error.message,
      stack: error.stack,
      details: error.cause, // Drizzle 등에서 cause에 추가 정보를 담는 경우가 있음
      tagsParam,
    });
    return NextResponse.json(
      { 
        error: "시험 인스턴스 목록을 가져오는 중 오류 발생",
        // 개발 환경에서는 상세 오류 메시지를 포함할 수 있으나, 프로덕션에서는 일반 메시지만 전달
        // errorMessage: process.env.NODE_ENV === 'development' ? error.message : undefined,
      }, 
      { status: 500 }
    );
  }
} 