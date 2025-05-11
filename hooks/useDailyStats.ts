import useSWR from 'swr';

export interface DailyStat {
  date: string;
  solvedCount: number;
  totalStudyTime: number;
  correctCount: number;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useDailyStats(userId?: string) {
  const url = userId
    ? `/api/statistics/daily?userId=${userId}`
    : `/api/statistics/daily`;
  const { data, error, isLoading } = useSWR<DailyStat[]>(url, fetcher);
  return {
    data,
    isLoading,
    isError: !!error,
  };
} 