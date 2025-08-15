import useSWR from 'swr';

export interface DailyStat {
  date: string;
  solvedCount: number;
  totalStudyTime: number;
  correctCount: number;
  totalQuestions?: number;
  isGlobal?: boolean;
  userCount?: number;
}

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(res => {
  if (!res.ok) {
    console.error(`API error: ${url}. Status: ${res.status}`);
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
});

export function useDailyStats(userId?: string) {
  const url = userId
    ? `/api/statistics/daily?userId=${userId}`
    : `/api/statistics/daily`;
  
  const { data, error, isLoading } = useSWR<DailyStat[] | null>(url, fetcher);

  return {
    data,
    isLoading,
    error,
  };
} 