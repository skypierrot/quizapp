import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db'; // 수정: 직접 db 사용
import { questions } from '@/db/schema';
import { sql, desc } from 'drizzle-orm'; // 수정: 필요한 함수만 import

// 임시 사용자 ID (개발용)
const DEV_USER_ID = "dev_user_123";

// DB 연결 상태 확인 헬퍼 함수 (간소화된 버전)
const ensureDBConnection = async () => {
  try {
    await db.select({ count: sql`COUNT(*)` }).from(questions).limit(1);
    return true;
  } catch (error) {
    console.error("DB 연결 확인 오류:", error);
    return false;
  }
};


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url); // searchParams 선언을 try 블록 밖으로 이동
  const type = searchParams.get('type'); // type도 같이 이동

  try {
    // DB 연결 확인
    const isDBConnected = await ensureDBConnection();
    if (!isDBConnected) {
      console.error("데이터베이스 연결 실패 (GET /api/tags/suggestions)");
      return NextResponse.json(
        { error: "서버 연결 오류. 잠시 후 다시 시도해주세요." },
        { status: 503 }
      );
    }

    // Clerk 인증 관련 주석 완전 삭제
    // const { userId } = auth();
    // if (!userId) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }
    const userId = DEV_USER_ID; // 임시 사용자 ID 사용

    // const { searchParams } = new URL(request.url); // 이동됨
    // const type = searchParams.get('type'); // 이동됨

    if (!type || !['examName', 'year', 'round'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid or missing type parameter. Use one of: examName, year, round.' },
        { status: 400 }
      );
    }

    let tagIndex: number;
    switch (type) {
      case 'examName':
        tagIndex = 0;
        break;
      case 'year':
        tagIndex = 1;
        break;
      case 'round':
        tagIndex = 2;
        break;
      default:
        // 위에서 이미 확인했으므로 이 경우는 발생하지 않음
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    // Drizzle을 사용하여 tags 배열의 특정 인덱스에서 고유한 값 가져오기
    // 참고: questions.tags 컬럼이 jsonb 또는 text[] 타입이어야 함
    //       jsonb_array_elements_text 또는 unnest 함수 활용
    const distinctTagsResult = await db.selectDistinct({
        tagValue: sql<string>`(tags ->> ${tagIndex})` // PostgreSQL JSONB ->> operator 사용
        // 또는 text[] 타입일 경우: sql<string>`(tags[${tagIndex + 1}])` // PostgreSQL 배열 인덱스는 1부터 시작
      })
      .from(questions)
      // .where(eq(questions.userId, userId)) // 사용자별 필터링 필요 시 활성화
      .orderBy(desc(sql<string>`(tags ->> ${tagIndex})`)) // 정렬 추가
      .execute(); // execute() 호출

    // 결과 처리: null, 빈 문자열 제거 및 배열로 변환
    const suggestions = distinctTagsResult
      .map((row: { tagValue: string | null }) => row.tagValue) // row 타입 명시
      .filter((value: string | null): value is string => value !== null && value !== ''); // value 타입 명시, null 및 빈 문자열 제거

    return NextResponse.json({ suggestions });

  } catch (error) {
    console.error(`Error fetching ${type} suggestions:`, error); // type 변수 사용
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 });
  }
} 