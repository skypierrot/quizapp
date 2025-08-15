import useSWR from 'swr';

// API 응답에 대한 정확한 타입 정의 필요
export interface SubjectPerformanceStat {
  subject: string;
  solvedCount: number;
  correctCount: number;
  correctRate: number;
  examName: string;
  examSubject: string;
}

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(res => {
  if (!res.ok) {
    // API가 아직 없으므로, 개발 중에는 에러를 던지는 대신 목업 데이터를 반환하도록 할 수 있습니다.
    // throw new Error('Network response was not ok while fetching subject performance');
    console.warn(`API not found: ${url}. Returning mock data for subject performance.`);
    return null; // 또는 빈 배열 []
  }
  return res.json();
});

// 목업 데이터 예시 (새로운 구조에 맞게 수정)
const mockSubjectPerformanceData: SubjectPerformanceStat[] = [
  { subject: '기업진단지도', solvedCount: 120, correctCount: 90, correctRate: 0.75, examName: '산업안전지도사', examSubject: '기업진단지도' },
  { subject: '산업안전일반', solvedCount: 95, correctCount: 70, correctRate: 0.73, examName: '산업안전지도사', examSubject: '산업안전일반' },
  { subject: '데이터베이스', solvedCount: 110, correctCount: 80, correctRate: 0.72, examName: '정보처리기사', examSubject: '데이터베이스' },
  { subject: '소프트웨어 공학', solvedCount: 150, correctCount: 125, correctRate: 0.83, examName: '정보처리기사', examSubject: '소프트웨어 공학' },
  { subject: '알고리즘', solvedCount: 80, correctCount: 50, correctRate: 0.62, examName: '정보처리기사', examSubject: '알고리즘' },
];

export function useSubjectPerformanceStats(userId?: string) {
  const { data, error, isLoading } = useSWR<SubjectPerformanceStat[] | null>(
    userId ? `/api/statistics/subject-performance?userId=${userId}` : null,
    fetcher,
    { fallbackData: userId ? mockSubjectPerformanceData : null } // API 호출 실패 또는 userId 없을 시 목업 데이터 사용
  );
  
  // API가 실제로 404를 반환하면 error 객체가 채워지므로, 목업을 보여주기 위해 error가 없을 때만 data를 사용
  // 또는 fetcher에서 에러 대신 null/빈배열을 반환하고, 여기서 data가 null이면 목업을 제공하는 방식도 가능
  const displayData = error ? mockSubjectPerformanceData : data;

  return {
    data: displayData,
    isLoading: isLoading && !error, // 에러 발생 시 로딩 상태 해제
    error: error ? null : error, // 목업 사용 시 에러는 null로 처리 (또는 실제 에러를 유지하고 UI에서 분기)
  };
} 