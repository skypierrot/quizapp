'use client';

import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useDailyStats } from '@/hooks/useDailyStats';
import { useSummaryStats } from '@/hooks/useSummaryStats';
import { useSession } from 'next-auth/react';

function formatStudyTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}초`;
  } else if (seconds < 3600) {
    return `${Math.round(seconds / 60)}분`;
  } else if (seconds < 86400) {
    return `${(seconds / 3600).toFixed(1)}시간`;
  } else if (seconds < 2592000) {
    return `${(seconds / 86400).toFixed(1)}일`;
  } else {
    return `${(seconds / 2592000).toFixed(1)}개월`;
  }
}

export default function StatisticsPage() {
  // next-auth로 로그인 세션 확인
  const { data: session } = useSession();
  const userId = session?.user?.id; // 로그인 시만 userId, 비로그인 시 undefined

  // SWR로 데이터 패칭
  const { data: summary, isLoading: summaryLoading } = useSummaryStats(userId);
  const { data: daily, isLoading: dailyLoading } = useDailyStats(userId);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">학습 통계</h1>
      {/* 상단 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">총 학습 시간</h3>
            <span className="text-gray-500 text-sm">최근 30일</span>
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {summaryLoading || !summary ? '...' : formatStudyTime(summary.totalStudyTime)}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            {summaryLoading || !summary ? '' : (userId ? `연속 ${summary.streak}일 학습` : '전체 통계')}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">푼 문제</h3>
            <span className="text-gray-500 text-sm">총계</span>
          </div>
          <p className="text-3xl font-bold text-green-600">
            {summaryLoading || !summary ? '...' : `${summary.totalSolved} 문항`}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            {summaryLoading || !summary ? '' : `정답률 ${Math.round(summary.correctRate*100)}%`}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">평균 정답률</h3>
            <span className="text-gray-500 text-sm">전체</span>
          </div>
          <p className="text-3xl font-bold text-purple-600">
            {summaryLoading || !summary ? '...' : `${Math.round(summary.correctRate*100)}%`}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            {summaryLoading || !summary ? '' : (userId ? `연속 ${summary.streak}일` : '전체 통계')}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">연속 학습일</h3>
            <span className="text-gray-500 text-sm">스트릭</span>
          </div>
          <p className="text-3xl font-bold text-orange-600">
            {summaryLoading || !summary
              ? '...'
              : userId
                ? `${summary.streak}일`
                : summary.streak > 0
                  ? `${summary.streak}일`
                  : '-'}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            {userId ? '최근 30일 기준' : '전체 통계'}
          </p>
        </div>
      </div>
      {/* 일별 풀이수 BarChart */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">일별 풀이수</h2>
        {dailyLoading || !daily ? (
          <div>로딩 중...</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={daily.map(d => ({
              date: d.date,
              solved: d.solvedCount,
              studyTime: d.totalStudyTime,
            }))}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="solved" fill="#3182ce" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      
      {/* 과목별 통계 */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">과목별 학습 통계</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">과목</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">학습 문항</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">정답률</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">오답 문항</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">평균 소요시간</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap font-medium">정보처리기사</td>
                <td className="px-6 py-4 whitespace-nowrap">205문항</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="mr-2">82.4%</span>
                    <div className="w-24 bg-gray-200 rounded-full h-2.5">
                      <div className="bg-green-600 h-2.5 rounded-full" style={{ width: "82.4%" }}></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">36문항</td>
                <td className="px-6 py-4 whitespace-nowrap">45초/문항</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap font-medium">정보보안기사</td>
                <td className="px-6 py-4 whitespace-nowrap">147문항</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="mr-2">74.8%</span>
                    <div className="w-24 bg-gray-200 rounded-full h-2.5">
                      <div className="bg-green-600 h-2.5 rounded-full" style={{ width: "74.8%" }}></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">37문항</td>
                <td className="px-6 py-4 whitespace-nowrap">52초/문항</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* 취약 분야 */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">취약 분야 분석</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-3">정보처리기사 취약 분야</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">데이터베이스</span>
                  <span className="text-sm font-medium text-red-600">65.2%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-red-600 h-2.5 rounded-full" style={{ width: "65.2%" }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">소프트웨어 공학</span>
                  <span className="text-sm font-medium text-yellow-600">72.1%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-yellow-600 h-2.5 rounded-full" style={{ width: "72.1%" }}></div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-3">정보보안기사 취약 분야</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">암호학</span>
                  <span className="text-sm font-medium text-red-600">63.8%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-red-600 h-2.5 rounded-full" style={{ width: "63.8%" }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">네트워크 보안</span>
                  <span className="text-sm font-medium text-yellow-600">70.5%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-yellow-600 h-2.5 rounded-full" style={{ width: "70.5%" }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 