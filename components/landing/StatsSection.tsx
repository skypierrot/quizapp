'use client';

import { useState, useEffect } from 'react';

interface Stats {
  correctRate: number;
  streak: number;
  totalSolved: number;
  totalStudyTime: number;
}

export function StatsSection() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [mounted, setMounted] = useState(false);

  // Hydration 오류 방지를 위한 마운트 상태 관리
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchStats = async () => {
      try {
        // 비로그인 사용자를 위한 전역 통계 API 호출
        const response = await fetch('/api/statistics/summary');
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched stats:', data);
          setStats(data);
        } else {
          console.error('Failed to fetch stats:', response.status);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [mounted]);

  // 마운트 전까지는 기본 UI 렌더링 (서버-클라이언트 일관성 보장)
  if (!mounted) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">전체사용자 종합학습통계</h2>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                <div>
                  <div className="text-3xl font-bold text-blue-600 mb-2">18%</div>
                  <div className="text-gray-600 dark:text-gray-400">평균 정답률</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600 mb-2">2일</div>
                  <div className="text-gray-600 dark:text-gray-400">평균 연속학습일</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600 mb-2">135</div>
                  <div className="text-gray-600 dark:text-gray-400">평균 문제 수</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-orange-600 mb-2">16분</div>
                  <div className="text-gray-600 dark:text-gray-400">평균 학습시간</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const formatAccuracy = (rate: number) => {
    if (isNaN(rate) || rate === null || rate === undefined) return '18%';
    return `${Math.round(rate * 100)}%`;
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === null || seconds === undefined) return '16분';
    return `${Math.round(seconds / 60)}분`;
  };

  const formatNumber = (num: number) => {
    if (isNaN(num) || num === null || num === undefined) return '135';
    return num.toString();
  };

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">전체사용자 종합학습통계</h2>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8">
            {loading ? (
              <div className="text-center">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mx-auto mb-2"></div>
                  <div className="text-gray-500">데이터 로딩 중...</div>
                </div>
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                <div>
                  <div className="text-3xl font-bold text-blue-600 mb-2">{formatAccuracy(stats.correctRate)}</div>
                  <div className="text-gray-600 dark:text-gray-400">평균 정답률</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600 mb-2">{formatNumber(stats.streak)}일</div>
                  <div className="text-gray-600 dark:text-gray-400">평균 연속학습일</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600 mb-2">{formatNumber(stats.totalSolved)}</div>
                  <div className="text-gray-600 dark:text-gray-400">평균 문제 수</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-orange-600 mb-2">{formatTime(stats.totalStudyTime)}</div>
                  <div className="text-gray-600 dark:text-gray-400">평균 학습시간</div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                <div>
                  <div className="text-3xl font-bold text-blue-600 mb-2">18%</div>
                  <div className="text-gray-600 dark:text-gray-400">평균 정답률</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600 mb-2">2일</div>
                  <div className="text-gray-600 dark:text-gray-400">평균 연속학습일</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600 mb-2">135</div>
                  <div className="text-gray-600 dark:text-gray-400">평균 문제 수</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-orange-600 mb-2">16분</div>
                  <div className="text-gray-600 dark:text-gray-400">평균 학습시간</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
} 