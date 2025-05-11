import useSWR from 'swr';

export interface SummaryStat {
  totalStudyTime: number;
  totalSolved: number;
  correctRate: number;
  streak: number;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useSummaryStats(userId?: string) {
  const url = userId
    ? `/api/statistics/summary?userId=${userId}`
    : `/api/statistics/summary`;
  const { data, error, isLoading } = useSWR<SummaryStat>(url, fetcher);
  return {
    data,
    isLoading,
    isError: !!error,
  };
} 