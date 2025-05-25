import useSWR from 'swr';

export interface SummaryStat {
  totalStudyTime: number;
  totalSolved: number;
  correctRate: number;
  streak: number;
  isGlobal?: boolean;
  totalUsers?: number;
}

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(res => {
  if (!res.ok) {
    console.error(`API error: ${url}. Status: ${res.status}`);
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
});

export function useSummaryStats(userId?: string) {
  const url = userId
    ? `/api/statistics/summary?userId=${userId}`
    : `/api/statistics/summary`;
  
  const { data, error, isLoading } = useSWR<SummaryStat | null>(url, fetcher);

  return {
    data,
    isLoading,
    error,
  };
} 