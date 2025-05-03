import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db'; // Correct path
import { questions } from '@/db/schema/questions'; // Correct path for questions schema
import { sql, and, SQL } from 'drizzle-orm'; // Import SQL type

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tagsParam = searchParams.get('tags'); // 추가 태그 필터 (예: "필기,핵심개념")

  try {
    let filterConditions: SQL[] = []; // Array to hold SQL filter conditions

    // --- 1. 추가 태그 필터링 조건 생성 (EXISTS 사용) ---
    if (tagsParam) {
      const additionalTags = tagsParam
        .split(',')
        .map((tag: string) => tag.trim())
        .filter((tag: string) => tag);

      if (additionalTags.length > 0) {
        // 각 태그에 대해 EXISTS 조건을 생성
        const tagConditions = additionalTags.map(tag =>
          sql`EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(
              CASE
                WHEN jsonb_typeof(questions.tags) = 'array' THEN questions.tags
                ELSE '[]'::jsonb
              END
            ) elem
            WHERE elem = ${tag}
          )`
        );
        // 모든 태그 조건을 AND로 결합하여 추가
        filterConditions.push(and(...tagConditions)!); // Use non-null assertion if and() can return undefined
      }
    }

    // Combine all filter conditions using AND (if base condition exists, add it too)
    // Example base condition (if needed): const baseCondition = sql`questions.is_active = true`;
    // if (baseCondition) filterConditions.unshift(baseCondition);
    const finalFilterCondition = filterConditions.length > 0 ? and(...filterConditions) : undefined;

    // --- 2. DB 쿼리: 시험 정보 추출 (Subquery) ---
    const examInstanceSubquery = db
      .select({
        examName: sql<string>`COALESCE((SELECT split_part(t, ':', 2) FROM jsonb_array_elements_text(CASE WHEN jsonb_typeof(tags) = 'array' THEN tags ELSE '[]'::jsonb END) as t WHERE t LIKE '시험명:%' LIMIT 1), '_N/A_')`.as('examName'),
        year: sql<string>`COALESCE((SELECT split_part(t, ':', 2) FROM jsonb_array_elements_text(CASE WHEN jsonb_typeof(tags) = 'array' THEN tags ELSE '[]'::jsonb END) as t WHERE t LIKE '년도:%' LIMIT 1), '_N/A_')`.as('year'),
        session: sql<string>`COALESCE((SELECT split_part(t, ':', 2) FROM jsonb_array_elements_text(CASE WHEN jsonb_typeof(tags) = 'array' THEN tags ELSE '[]'::jsonb END) as t WHERE t LIKE '회차:%' LIMIT 1), '_N/A_')`.as('session'),
        questionId: questions.id
      })
      .from(questions)
      .where(finalFilterCondition) // Apply combined filter conditions here
      .as("extracted_exams");

    // --- 3. 그룹화 및 집계 ---
    const examInstances = await db.select({
        examName: examInstanceSubquery.examName,
        year: examInstanceSubquery.year,
        session: examInstanceSubquery.session,
        questionCount: sql<number>`count(${examInstanceSubquery.questionId})`.mapWith(Number).as('question_count')
      })
      .from(examInstanceSubquery)
      .where(sql`${examInstanceSubquery.examName} != '_N/A_' AND ${examInstanceSubquery.year} != '_N/A_' AND ${examInstanceSubquery.session} != '_N/A_'`)
      .groupBy(examInstanceSubquery.examName, examInstanceSubquery.year, examInstanceSubquery.session)
      .orderBy(examInstanceSubquery.year, examInstanceSubquery.examName, examInstanceSubquery.session);

    console.log(`[API] /api/exam-instances called with tags: ${tagsParam}, Found: ${examInstances.length}`);

    return NextResponse.json({ examInstances });

  } catch (error) {
    console.error("[API Error] /api/exam-instances:", error);
    return NextResponse.json({ error: "시험 인스턴스 목록을 가져오는 중 오류 발생" }, { status: 500 });
  }
} 