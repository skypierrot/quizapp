import useSWR from 'swr';
import type { NewSummaryStat } from '@/app/api/new-summary/route'; // 방금 만든 API의 인터페이스 임포트

// 기본 fetcher 함수 (기존 프로젝트의 것을 재사용하거나, 간단히 정의)
const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    // 에러 객체에 추가 정보를 붙일 수 있습니다.
    // error.info = await res.json();
    // error.status = res.status;
    console.error(`[useNewSummaryStats fetcher] API Error: ${res.status} for ${url}`);
    throw error;
  }
  return res.json();
});

// sessionStatus 타입을 명시적으로 정의 (next-auth에서 가져올 수도 있음)
type SessionStatus = "loading" | "authenticated" | "unauthenticated";

export function useNewSummaryStats(userId?: string, sessionStatus?: SessionStatus) {
  // API URL 결정 (userId 유무와 sessionStatus에 따라)
  let url: string | null = null;

  if (sessionStatus === 'loading') {
    url = null; // 세션 로딩 중에는 API 호출 안 함
  } else if (sessionStatus === 'authenticated' && userId) {
    url = `/api/new-summary?userId=${userId}`;
  } else if (sessionStatus === 'unauthenticated') {
    url = '/api/new-summary'; // 비로그인 시 전역 통계
  } else {
    // sessionStatus가 undefined (초기 상태 등)이거나, 
    // authenticated인데 userId가 없는 경우 (이론상으로는 발생하면 안됨) 등 예외 케이스.
    // 기본적으로 전역 통계를 보여주거나, null로 처리하여 호출을 막을 수 있습니다.
    // 여기서는 전역 통계 API를 호출하도록 설정합니다. (또는 null로 설정하여 호출 방지)
    url = '/api/new-summary'; 
  }
  
  console.log(`[useNewSummaryStats] Session status: ${sessionStatus}, User ID: ${userId}, Determined URL: ${url}`);

  const { data, error, isLoading } = useSWR<NewSummaryStat | null>(
    url, // url이 null이면 SWR은 요청을 보내지 않음 
    fetcher, 
    {
      fallbackData: url === null ? undefined : null, // url이 null이면 fallbackData도 undefined로 설정하여 초기 상태를 명확히 합니다.
      revalidateOnFocus: false, // 포커스 시 자동 재검증 비활성화 (테스트 단순화를 위해)
      // errorRetryCount: 2 // 필요시 에러 재시도 횟수 설정
    }
  );

  console.log(`[useNewSummaryStats] SWR hook status: isLoading: ${isLoading}, error: ${error ? error.message : 'null'}, data: ${JSON.stringify(data)}`);

  return {
    summaryData: data, // 반환되는 데이터 객체의 속성 이름을 명확히 함
    // 세션 로딩 중이거나 SWR이 로딩 중일 때, 그리고 아직 데이터가 없을 때 로딩 상태로 간주합니다.
    isSummaryLoading: (sessionStatus === 'loading' && !data) || isLoading, 
    summaryError: error,
  };
} 