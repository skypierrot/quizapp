import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { exams, questions } from '@/db/schema'; // questions 임포트 추가 및 경로 수정
import { sql, and, eq, count, SQL } from 'drizzle-orm'; // eq, count 임포트 추가

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tagsParam = searchParams.get('tags');

  try {
    const filterConditions: SQL[] = [];
    let examNameFilter: string | null = null;
    let yearFilter: number | null = null;
    let subjectFilter: string | null = null;

    if (tagsParam) {
      const tags = tagsParam.split(',').map(tag => tag.trim());
      tags.forEach(tag => {
        if (tag.startsWith('시험명:')) {
          examNameFilter = tag.replace('시험명:', '');
        } else if (tag.startsWith('년도:')) {
          const yearVal = parseInt(tag.replace('년도:', ''), 10);
          if (!isNaN(yearVal)) yearFilter = yearVal;
        } else if (tag.startsWith('과목:')) {
          subjectFilter = tag.replace('과목:', '');
        }
        // TODO: 기타 태그(questions.tags)에 대한 필터링이 필요하면 추가 구현
      });
    }

    if (examNameFilter) {
      filterConditions.push(eq(exams.name, examNameFilter));
    }
    if (yearFilter) {
      filterConditions.push(eq(exams.year, yearFilter));
    }
    if (subjectFilter) {
      filterConditions.push(eq(exams.subject, subjectFilter));
    }

    const finalFilter = filterConditions.length > 0 ? and(...filterConditions) : undefined;

    const examInstancesData = await db
      .select({
        examName: exams.name,
        year: exams.year,
        subject: exams.subject,
        questionCount: count(questions.id) // questions.id를 count
      })
      .from(exams)
      .leftJoin(questions, eq(exams.id, questions.examId)) // exams와 questions를 leftJoin
      .where(finalFilter)
      .groupBy(exams.id, exams.name, exams.year, exams.subject) // exams.id도 그룹핑에 추가
      .orderBy(exams.year, exams.name, exams.subject)
      .execute();

    // Drizzle이 year를 number로 반환하므로, IExamInstance에 맞게 string으로 변환
    const examInstances = examInstancesData.map(item => ({
      ...item,
      year: String(item.year), // year를 string으로 변환
    }));

    console.log(`[API] /api/exam-instances called with tags: ${tagsParam}, Found: ${examInstances.length}`);
    return NextResponse.json({ examInstances });

  } catch (error) {
    console.error("[API Error] /api/exam-instances:", error);
    return NextResponse.json({ error: "시험 인스턴스 목록을 가져오는 중 오류 발생" }, { status: 500 });
  }
} 