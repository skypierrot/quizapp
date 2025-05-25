import useSWR from 'swr';

// API 응답에 대한 정확한 타입 정의 필요
export interface RecentExamStat {
  examId: string;
  examName: string;
  score: number;
  date: string;     // 기존 필드 (혼동 방지를 위해 보존)
  examDate: string; // 시험 날짜
  createdAt: string; // 사용자가 응시한 날짜 (YYYY-MM-DD hh:mm:ss 형식)
  resultId: string;
}

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(res => {
  if (!res.ok) {
    // API가 아직 없으므로, 개발 중에는 에러를 던지는 대신 목업 데이터를 반환하도록 할 수 있습니다.
    // throw new Error('Network response was not ok while fetching recent exams');
    console.warn(`API not found: ${url}. Returning mock data for recent exams.`);
    return null; // 또는 빈 배열 []
  }
  return res.json();
});

// 목업 데이터 예시
const mockRecentExamsData: RecentExamStat[] = [
  { examId: 'exam123', examName: '2024년 정보처리기사 필기 제1회', score: 85, date: '2024-03-15', examDate: '2024-03-15', createdAt: '2024-03-18 09:30:45', resultId: 'result-abc-123' },
  { examId: 'exam456', examName: '2024년 SQL 개발자(SQLD) 제2회', score: 78, date: '2024-05-20', examDate: '2024-05-20', createdAt: '2024-05-22 14:15:20', resultId: 'result-def-456' },
  { examId: 'exam789', examName: '2023년 리눅스마스터 1급 제1회', score: 92, date: '2023-11-10', examDate: '2023-11-10', createdAt: '2023-11-15 16:45:30', resultId: 'result-ghi-789' },
];

export function useRecentExamsStats(userId?: string) {
  const { data, error, isLoading } = useSWR<RecentExamStat[] | null>(
    userId ? `/api/statistics/recent-exams?userId=${userId}&limit=5` : null,
    fetcher,
    { fallbackData: userId ? mockRecentExamsData : null } // API 호출 실패 또는 userId 없을 시 목업 데이터 사용
  );
  
  const displayData = error ? mockRecentExamsData : data;

  return {
    data: displayData,
    isLoading: isLoading && !error,
    error: error ? null : error,
  };
} 