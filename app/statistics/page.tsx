'use client';

import React from "react";
import { LineChart, Line, Legend, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useDailyStats } from '@/hooks/useDailyStats';
import { useSummaryStats } from '@/hooks/useSummaryStats';
import { useSubjectPerformanceStats } from '@/hooks/useSubjectPerformanceStats';
import { useRecentExamsStats } from '@/hooks/useRecentExamsStats';
import { useSession } from 'next-auth/react';
import Link from "next/link";
import { ArrowRight } from "lucide-react";

function formatStudyTime(seconds: number): string {
  if (seconds < 0 || isNaN(seconds)) return '0초';
  if (seconds < 60) {
    return `${seconds}초`;
  } else if (seconds < 3600) {
    return `${Math.round(seconds / 60)}분`;
  } else {
    return `${(seconds / 3600).toFixed(1)}시간`;
  }
}

export default function StatisticsPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const { data: summary, isLoading: summaryLoading, error: summaryError } = useSummaryStats(userId);
  const { data: daily, isLoading: dailyLoading, error: dailyError } = useDailyStats(userId);
  const { data: subjectStats, isLoading: subjectStatsLoading, error: subjectStatsError } = useSubjectPerformanceStats(userId);
  const { data: recentExams, isLoading: recentExamsLoading, error: recentExamsError } = useRecentExamsStats(userId);

  const dailyChartData = daily?.map(d => ({
    date: d.date.slice(5),
    '푼 문제 수': d.solvedCount || 0,
    '학습 시간(분)': d.totalStudyTime ? Math.round(d.totalStudyTime / 60) : 0,
    '정답률(%)': d.solvedCount && d.correctCount ? Math.round((d.correctCount / d.solvedCount) * 100) : 0,
  })) || [];

  const renderLoading = () => <div className="text-center py-4 text-gray-500">데이터를 불러오는 중...</div>;
  const renderError = (message: string = "데이터를 불러오는데 실패했습니다.") => <div className="text-center py-4 text-red-500">⚠️ {message}</div>;

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">종합 학습 통계</h1>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {summaryLoading ? <div className="col-span-full flex justify-center items-center h-24">{renderLoading()}</div> : summaryError ? <div className="col-span-full">{renderError("요약 정보를 불러올 수 없습니다.")}</div> : summary ? (
          <>
            <SummaryCard title="총 학습 시간" value={formatStudyTime(summary.totalStudyTime)} subText={userId ? `연속 ${summary.streak}일 학습중` : '전체 사용자 평균'} />
            <SummaryCard title="총 푼 문제 수" value={`${summary.totalSolved} 문제`} subText={`정답률 ${Math.round(summary.correctRate * 100)}%`} />
            <SummaryCard title="평균 정답률" value={`${Math.round(summary.correctRate * 100)}%`} subText="전체 학습 기간" />
            <SummaryCard title="연속 학습일" value={userId ? `${summary.streak} 일` : '-'} subText={userId ? "최근 30일 기준" : "개인 기록"} />
          </>
        ) : <div className="col-span-full">{renderError("요약 정보를 불러올 수 없습니다.")}</div>}
      </section>

      <section className="bg-white p-6 rounded-xl shadow-lg mb-10">
        <h2 className="text-xl font-semibold mb-6 text-gray-700">일별 학습 추이 (최근 30일)</h2>
        {dailyLoading ? renderLoading() : dailyError ? renderError() : dailyChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={dailyChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#666' }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#666' }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#666' }} />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', borderColor: '#ddd' }} itemStyle={{ fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: '10px' }} />
              <Line yAxisId="left" type="monotone" dataKey="푼 문제 수" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name="푼 문제" />
              <Line yAxisId="right" type="monotone" dataKey="학습 시간(분)" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name="학습 시간(분)" />
              <Line yAxisId="right" type="monotone" dataKey="정답률(%)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name="정답률(%)" />
            </LineChart>
          </ResponsiveContainer>
        ) : <div className="text-center py-8 text-gray-400">최근 30일간 학습 기록이 없습니다.</div>}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
        <section className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-6 text-gray-700">과목별 학습 성취도</h2>
          {subjectStatsLoading ? renderLoading() : subjectStatsError ? renderError() : subjectStats && subjectStats.length > 0 ? (
            <div className="space-y-4">
              {subjectStats.map(stat => (
                <div key={stat.subject}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-600 truncate pr-2" title={stat.subject}>{stat.subject}</span>
                    <span className="text-xs text-gray-500 whitespace-nowrap">{stat.solvedCount} 문제 / 정답률 {Math.round(stat.correctRate * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div className="bg-sky-500 h-2.5 rounded-full" style={{ width: `${Math.round(stat.correctRate * 100)}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="text-center py-8 text-gray-400">과목별 학습 데이터가 없습니다.</div>}
        </section>

        <section className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-6 text-gray-700">최근 응시 시험</h2>
          {recentExamsLoading ? renderLoading() : recentExamsError ? renderError() : recentExams && recentExams.length > 0 ? (
            <ul className="space-y-3">
              {recentExams.map(exam => (
                <li key={exam.examId} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors dark:bg-gray-800 dark:hover:bg-gray-700">
                  <Link href={`/results/${exam.resultId}/wrong-note`} className="flex justify-between items-center">
          <div>
                      <p className="font-medium text-gray-700 dark:text-gray-200">{exam.examName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">응시일: {exam.date} / 점수: {exam.score}점</p>
                </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : <div className="text-center py-8 text-gray-400">최근 응시한 시험이 없습니다.</div>}
        </section>
                </div>
      
      <div className="mt-10 p-6 bg-slate-50 rounded-xl shadow-inner">
          <h3 className="text-lg font-semibold text-slate-600 mb-3">향후 추가될 기능</h3>
          <ul className="list-disc list-inside text-sm text-slate-500 space-y-1">
            <li>학습 시간 패턴 분석 (요일별, 시간대별)</li>
            <li>목표 설정 및 달성률 추적</li>
            <li>오답 유형 심층 분석 (객관식 오선택 패턴 등)</li>
          </ul>
      </div>
    </div>
  );
} 

const SummaryCard = ({ title, value, subText }: { title: string; value: string | number; subText?: string }) => (
  <div className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</h3>
    <p className="text-3xl font-bold text-gray-800 dark:text-white">{value}</p>
    {subText && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{subText}</p>}
  </div>
); 