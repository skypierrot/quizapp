'use client';

import React, { useMemo } from "react";
import { LineChart, Line, BarChart, Bar, Legend, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, ComposedChart, ReferenceLine } from 'recharts';
import { useDailyStats } from '@/hooks/useDailyStats';
import { useSummaryStats } from '@/hooks/useSummaryStats';
import { useSubjectPerformanceStats } from '@/hooks/useSubjectPerformanceStats';
import { useRecentExamsStats } from '@/hooks/useRecentExamsStats';
import { useSession } from 'next-auth/react';
import Link from "next/link";
import { ArrowRight } from "lucide-react";

// 타입 정의 추가
interface SummaryCardProps {
  title: string;
  value: string | number;
  subText?: string;
  icon?: React.ReactNode;
  bgClass?: string;
  iconClass?: string;
}

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
  const userId = session?.user?.id as string | undefined;

  const { data: summary, isLoading: summaryLoading, error: summaryError } = useSummaryStats(userId);
  const { data: daily, isLoading: dailyLoading, error: dailyError } = useDailyStats(userId);
  const { data: subjectStats, isLoading: subjectStatsLoading, error: subjectStatsError } = useSubjectPerformanceStats(userId);
  const { data: recentExams, isLoading: recentExamsLoading, error: recentExamsError } = useRecentExamsStats(userId);

  // 일별 통계 데이터 가공
  const processedDailyData = useMemo(() => {
    if (!daily || daily.length === 0) return [];
    
    // 날짜 오름차순 정렬
    const sortedData = [...daily].sort((a, b) => a.date.localeCompare(b.date));
    
    // 누적 학습 시간 계산을 위한 변수
    let cumulativeStudyTime = 0;
    
    return sortedData.map(d => {
      // 1. 정답률 계산: 맞은 문제 수 / 전체 문제 수
      const accuracyRate = d.totalQuestions && d.totalQuestions > 0
        ? Math.round((d.correctCount / d.totalQuestions) * 100)
        : 0;
      
      // 2. 일별 학습 시간을 분 단위로 변환
      const dailyStudyMinutes = d.totalStudyTime ? Math.round(d.totalStudyTime / 60) : 0;
      
      // 3. 누적 학습 시간 계산 (초 단위로 합산 후 분으로 변환)
      cumulativeStudyTime += d.totalStudyTime || 0;
      const cumulativeStudyMinutes = Math.round(cumulativeStudyTime / 60);
      
      return {
        date: d.date.slice(5), // MM-DD 형식으로 변환
        formattedDate: d.date.replace(/(\d{4})-(\d{2})-(\d{2})/, '$1년 $2월 $3일'), // 툴팁용 포맷팅
        
        // 푼 문제와 맞춘 문제
        totalQuestions: d.totalQuestions || 0,
        correctCount: d.correctCount || 0,
        wrongCount: (d.totalQuestions || 0) - (d.correctCount || 0), // 틀린 문제 수 추가
        
        // 정답률
        accuracyRate: accuracyRate,
        
        // 학습 시간
        dailyStudyMinutes: dailyStudyMinutes,
        cumulativeStudyMinutes: cumulativeStudyMinutes,
        
        // 전체 통계 관련 정보
        isGlobal: d.isGlobal,
        userCount: d.userCount,
      };
    });
  }, [daily]);

  // 일별 데이터의 전체 정답률 계산 (가중평균 - Summary와 일관성 유지)
  const overallAccuracyFromDaily = useMemo(() => {
    if (!processedDailyData || processedDailyData.length === 0) return 0;
    
    const totalQuestions = processedDailyData.reduce((sum, d) => sum + d.totalQuestions, 0);
    const totalCorrect = processedDailyData.reduce((sum, d) => sum + d.correctCount, 0);
    
    return totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  }, [processedDailyData]);

  // 시험명별로 과목 성취도 그룹핑 (실제 examName 사용)
  const groupedByExam = useMemo(() => {
    if (!subjectStats) return {};
    const result: Record<string, typeof subjectStats> = {};
    subjectStats.forEach(stat => {
      const examName = stat.examName || '기타';
      if (!result[examName]) result[examName] = [];
      result[examName].push(stat);
    });
    return result;
  }, [subjectStats]);

  const renderLoading = () => <div className="text-center py-4 text-gray-500">데이터를 불러오는 중...</div>;
  const renderError = (message: string = "데이터를 불러오는데 실패했습니다.") => <div className="text-center py-4 text-red-500">⚠️ {message}</div>;

    return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">종합 학습 통계</h1>
        <div className="text-sm text-gray-500 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {userId 
            ? "최근 30일간의 개인 학습 데이터를 기반으로 합니다"
            : "전체 사용자의 평균 학습 데이터를 보여줍니다"}
        </div>
      </div>

      {!userId && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200 flex justify-between items-center">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
      </div>
                        <div>
              <p className="text-blue-800 font-medium">지금 보고 계신 통계는 모든 사용자의 평균 데이터입니다.</p>
              <p className="text-blue-600 text-sm mt-1">로그인하시면 개인 맞춤형 통계를 확인하실 수 있습니다.</p>
            </div>
          </div>
          <Link
            href="/login"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors"
          >
            로그인하기
          </Link>
                        </div>
                      )}

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {summaryLoading ? <div className="col-span-full flex justify-center items-center h-24">{renderLoading()}</div> : summaryError ? <div className="col-span-full">{renderError("요약 정보를 불러올 수 없습니다. " + summaryError.message)}</div> : summary ? (
          <>
            <SummaryCard 
              title="총 학습 시간" 
              value={formatStudyTime(summary.totalStudyTime)} 
              subText={userId ? `연속 ${summary.streak}일 학습중` : `${summary.totalUsers || 0}명의 평균`} 
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              bgClass="bg-blue-50"
              iconClass="text-blue-500"
            />
            <SummaryCard 
              title="총 푼 문제 수" 
              value={`${summary.totalSolved} 문제`} 
              subText={`정답률 ${Math.round(summary.correctRate * 100)}%`} 
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
              bgClass="bg-emerald-50"
              iconClass="text-emerald-500"
            />
            <SummaryCard 
              title="평균 정답률" 
              value={`${Math.round(summary.correctRate * 100)}%`} 
              subText={userId ? "전체 학습 기간" : "전체 사용자 평균"} 
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
              bgClass="bg-amber-50"
              iconClass="text-amber-500"
            />
            <SummaryCard 
              title={userId ? "연속 학습일" : "평균 연속 학습일"} 
              value={`${summary.streak} 일`} 
              subText={userId ? "최근 30일 기준" : `${summary.totalUsers || 0}명의 평균`} 
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
              bgClass="bg-purple-50"
              iconClass="text-purple-500"
            />
          </>
        ) : <div className="col-span-full">{renderError("요약 정보를 불러올 수 없습니다.")}</div>}
      </section>

      {/* 푼 문제와 맞춘 문제 비교 (막대 그래프) */}
      <section className="bg-white p-8 rounded-xl shadow-lg mb-10 border border-gray-100">
        <h2 className="text-xl font-semibold mb-6 text-gray-700 flex items-center">
          <span className="bg-blue-50 text-blue-600 p-1.5 rounded-lg mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 15h8"/><path d="M8 9h8"/></svg>
          </span>
          일별 학습량
        </h2>
        {dailyLoading ? renderLoading() : dailyError ? renderError("일별 학습 데이터를 불러올 수 없습니다. " + dailyError.message) : processedDailyData.length > 0 ? (
                        <div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-500">
                일별 푼 문제와 맞춘 문제 수를 확인하세요
              </div>
              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-sm mr-2"></div>
                  <span className="text-sm text-gray-600">총 문제</span>
                </div>
                          <div className="flex items-center">
                  <div className="w-3 h-3 bg-emerald-500 rounded-sm mr-2"></div>
                  <span className="text-sm text-gray-600">맞은 문제</span>
                </div>
                          </div>
                        </div>

            <div className="overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
              <div style={{ minWidth: Math.max(600, processedDailyData.length * 40) + 'px', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={processedDailyData} 
                    margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                    barCategoryGap={12}
                  >
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.6}/>
                      </linearGradient>
                      <linearGradient id="colorCorrect" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#34d399" stopOpacity={0.6}/>
                      </linearGradient>
                      <filter id="shadow" height="200%">
                        <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.1"/>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => value}
                      width={30}
                    />
                    <Tooltip 
                      cursor={{fill: 'rgba(224, 231, 255, 0.2)'}}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        borderRadius: '0.5rem', 
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        padding: '0.75rem'
                      }}
                      formatter={(value, name) => {
                        if (name === 'correctCount') return [`${value}개`, '맞은 문제'];
                        if (name === 'wrongCount') return [`${value}개`, '틀린 문제'];
                        return [value, name];
                      }}
                      labelFormatter={(label) => {
                        const item = processedDailyData.find(d => d.date === label);
                        return item?.formattedDate || label;
                      }}
                    />
                    <Bar 
                      dataKey="correctCount" 
                      name="맞은 문제" 
                      stackId="a" 
                      fill="url(#colorCorrect)" 
                      radius={[0, 0, 0, 0]} 
                      filter="url(#shadow)"
                      animationDuration={1500}
                      animationEasing="ease-out"
                    />
                    <Bar 
                      dataKey="wrongCount" 
                      name="틀린 문제" 
                      stackId="a" 
                      fill="url(#colorTotal)" 
                      radius={[4, 4, 0, 0]} 
                      filter="url(#shadow)"
                      animationDuration={1500}
                      animationEasing="ease-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
                        </div>
                        </div>
                    </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <p className="mt-4 text-gray-500">최근 30일간 학습 기록이 없습니다.</p>
                        </div>
                      )}
      </section>

      {/* 정답률 추이 (꺾은선 그래프) */}
      <section className="bg-white p-8 rounded-xl shadow-lg mb-10 border border-gray-100">
        <h2 className="text-xl font-semibold mb-6 text-gray-700 flex items-center">
          <span className="bg-amber-50 text-amber-600 p-1.5 rounded-lg mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
          </span>
          일별 정답률 추이
        </h2>
        {dailyLoading ? renderLoading() : dailyError ? renderError("일별 학습 데이터를 불러올 수 없습니다. " + dailyError.message) : processedDailyData.length > 0 ? (
                        <div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-500">
                일별 정답률 변화를 확인하세요 (전체 평균: {overallAccuracyFromDaily}% - 종합통계와 동일한 가중평균)
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-amber-500 rounded-sm mr-2"></div>
                  <span className="text-sm text-gray-600">일별 정답률</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
              <div style={{ minWidth: Math.max(600, processedDailyData.length * 40) + 'px', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={processedDailyData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <defs>
                      <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.3}/>
                      </linearGradient>
                      <filter id="shadowLine" height="200%">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1"/>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `${value}%`}
                      width={40}
                      ticks={[0, 25, 50, 75, 100]}
                    />
                    <Tooltip 
                      cursor={{stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '3 3'}}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        borderRadius: '0.5rem', 
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        padding: '0.75rem'
                      }}
                      formatter={(value) => [`${value}%`, '정답률']}
                      labelFormatter={(label) => {
                        const item = processedDailyData.find(d => d.date === label);
                        return item?.formattedDate || label;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="accuracyRate" 
                      name="정답률" 
                      stroke="#f59e0b" 
                      strokeWidth={3}
                      fill="url(#colorAccuracy)"
                      dot={{ 
                        r: 4, 
                        strokeWidth: 2, 
                        fill: 'white',
                        stroke: '#f59e0b'
                      }} 
                      activeDot={{ 
                        r: 6, 
                        strokeWidth: 0,
                        fill: '#f59e0b'
                      }}
                      filter="url(#shadowLine)"
                      animationDuration={2000}
                      animationEasing="ease-in-out"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <p className="mt-4 text-gray-500">최근 30일간 학습 기록이 없습니다.</p>
          </div>
        )}
      </section>

      {/* 학습 시간 (일간 및 누적) */}
      <section className="bg-white p-8 rounded-xl shadow-lg mb-10 border border-gray-100">
        <h2 className="text-xl font-semibold mb-6 text-gray-700 flex items-center">
          <span className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </span>
          학습 시간 추이
        </h2>
        {dailyLoading ? renderLoading() : dailyError ? renderError("일별 학습 데이터를 불러올 수 없습니다. " + dailyError.message) : processedDailyData.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-500">
                일별 학습 시간과 누적 학습 시간을 확인하세요
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-indigo-500 rounded-sm mr-2"></div>
                  <span className="text-sm text-gray-600">일간 학습 시간</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-pink-500 rounded-sm mr-2"></div>
                  <span className="text-sm text-gray-600">누적 학습 시간</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
              <div style={{ minWidth: Math.max(600, processedDailyData.length * 40) + 'px', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={processedDailyData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <defs>
                      <linearGradient id="colorDaily" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.2}/>
                      </linearGradient>
                      <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#be185d" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0.4}/>
                      </linearGradient>
                      <filter id="barShadow" height="200%">
                        <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.1"/>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis 
                      yAxisId="left" 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `${value}분`}
                      width={40}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `${value}분`}
                      width={40}
                    />
                    <Tooltip 
                      cursor={{fill: 'rgba(224, 231, 255, 0.2)'}}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        borderRadius: '0.5rem', 
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        padding: '0.75rem'
                      }}
                      formatter={(value, name) => {
                        if (name === 'dailyStudyMinutes') return [`${value} 분`, '일간 학습 시간'];
                        if (name === 'cumulativeStudyMinutes') return [`${value} 분`, '누적 학습 시간'];
                        return [`${value} 분`, name];
                      }}
                      labelFormatter={(label) => {
                        const item = processedDailyData.find(d => d.date === label);
                        return item?.formattedDate || label;
                      }}
                    />
                    <Bar 
                      yAxisId="left" 
                      dataKey="dailyStudyMinutes" 
                      name="일간 학습 시간" 
                      fill="url(#colorDaily)" 
                      radius={[4, 4, 0, 0]}
                      barSize={20}
                      filter="url(#barShadow)"
                      animationDuration={1500}
                      animationEasing="ease-out"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="cumulativeStudyMinutes" 
                      name="누적 학습 시간" 
                      stroke="#be185d" 
                      strokeWidth={3}
                      dot={{ 
                        r: 4, 
                        strokeWidth: 2, 
                        fill: 'white',
                        stroke: '#be185d'
                      }}
                      activeDot={{ 
                        r: 6, 
                        strokeWidth: 0,
                        fill: '#be185d'
                      }}
                      animationDuration={2000}
                      animationEasing="ease-in-out"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
                    </div>
                  ) : (
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <p className="mt-4 text-gray-500">최근 30일간 학습 기록이 없습니다.</p>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
        <section className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          <h2 className="text-xl font-semibold mb-6 text-gray-700 flex items-center">
            <span className="bg-sky-50 text-sky-600 p-1.5 rounded-lg mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
            </span>
            과목별 학습 성취도
          </h2>
          {!userId ? (
            <div className="py-16 text-center">
              <div className="mb-4 inline-block p-3 bg-sky-50 text-sky-600 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">개인 학습 데이터가 필요합니다</h3>
              <p className="text-gray-500 mb-4">로그인하시면 과목별 성취도를 확인할 수 있습니다.</p>
              <Link href="/login" className="inline-block px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors">
                로그인하기
              </Link>
            </div>
          ) : subjectStatsLoading ? renderLoading() : subjectStatsError ? renderError("과목별 학습 데이터를 불러올 수 없습니다. " + subjectStatsError.message) : subjectStats && subjectStats.length > 0 ? (
            <div className="overflow-y-auto pr-1" style={{ maxHeight: '350px', scrollbarWidth: 'thin' }}>
              <div className="space-y-8">
                {Object.entries(groupedByExam || {}).map(([examName, stats]) => (
                  <div key={examName} className="border border-sky-200 rounded-xl p-4 bg-sky-50">
                    <div className="font-bold text-base text-sky-700 mb-3">{examName}</div>
                    <div className="space-y-4">
                      {stats.map(stat => {
                        const correctRatePercent = Math.round(stat.correctRate * 100);
                        const barColor = correctRatePercent >= 80 ? 'from-emerald-500 to-emerald-400' :
                          correctRatePercent >= 60 ? 'from-sky-500 to-sky-400' :
                          correctRatePercent >= 40 ? 'from-amber-500 to-amber-400' : 'from-red-500 to-red-400';
                        return (
                          <div key={stat.subject} className="bg-white p-4 rounded-lg transition-all hover:shadow-md">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-700 truncate pr-2" title={stat.subject}>
                                {stat.subject}
                              </span>
                              <div className="flex space-x-2">
                                <span className="text-xs font-medium text-gray-500 whitespace-nowrap bg-white px-2 py-1 rounded-full border border-gray-200 group-hover:border-purple-200 transition-colors">
                                  {stat.solvedCount} 문제
                                </span>
                                <span className={`text-xs font-medium text-white whitespace-nowrap px-2 py-1 rounded-full bg-gradient-to-r ${barColor}`}>
                                  {Math.round(stat.correctRate * 100)}%
                                </span>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                              <div 
                                className={`h-2.5 rounded-full bg-gradient-to-r ${barColor} transition-all duration-500 ease-out`} 
                                style={{ width: `${Math.round(stat.correctRate * 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : <div className="text-center py-16 bg-gray-50 rounded-lg">
              <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <p className="mt-4 text-gray-500">과목별 학습 데이터가 없습니다.</p>
            </div>}
        </section>

        <section className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          <h2 className="text-xl font-semibold mb-6 text-gray-700 flex items-center">
            <span className="bg-purple-50 text-purple-600 p-1.5 rounded-lg mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></svg>
            </span>
            최근 응시 시험
          </h2>
          {!userId ? (
            <div className="py-16 text-center">
              <div className="mb-4 inline-block p-3 bg-purple-50 text-purple-600 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                          </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">개인 시험 결과가 필요합니다</h3>
              <p className="text-gray-500 mb-4">로그인하시면 최근 응시한 시험 결과를 확인할 수 있습니다.</p>
              <Link href="/login" className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                로그인하기
              </Link>
                          </div>
          ) : recentExamsLoading ? renderLoading() : recentExamsError ? renderError("최근 시험 데이터를 불러올 수 없습니다. " + recentExamsError.message) : recentExams && recentExams.length > 0 ? (
            <div className="overflow-y-auto pr-1" style={{ maxHeight: '350px', scrollbarWidth: 'thin' }}>
              <ul className="space-y-3">
                {recentExams.map(exam => (
                  <li key={exam.examId} className="group overflow-hidden">
                    <Link 
                      href={`/results/${exam.resultId}/wrong-note`} 
                      className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-purple-50 transition-colors border border-transparent hover:border-purple-200"
                    >
                          <div>
                        <p className="font-medium text-gray-700 group-hover:text-purple-700 transition-colors">{exam.examName}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200 group-hover:border-purple-200 transition-colors">
                            시험: {exam.examDate}
                          </span>
                          <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200 group-hover:border-purple-200 transition-colors">
                            응시: {exam.createdAt}
                          </span>
                          <span className="text-xs text-white px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-purple-400">
                            점수: {exam.score}점
                          </span>
                        </div>
                      </div>
                      <div className="bg-white text-purple-600 p-2 rounded-full shadow-sm group-hover:bg-purple-100 group-hover:shadow-md transition-all">
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    </Link>
                  </li>
                    ))}
              </ul>
            </div>
          ) : <div className="text-center py-16 bg-gray-50 rounded-lg">
              <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <p className="mt-4 text-gray-500">최근 응시한 시험이 없습니다.</p>
            </div>}
        </section>
      </div>
      
      <div className="mt-10 p-8 bg-gray-50 rounded-xl shadow-inner border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700 mb-6 flex items-center">
          <span className="bg-teal-50 text-teal-600 p-1.5 rounded-lg mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          </span>
          향후 추가될 기능
        </h3>
                <div className="space-y-4">
          <div className="flex items-start bg-white p-4 rounded-lg shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md">
            <div className="flex-shrink-0 bg-teal-50 text-teal-500 p-2 rounded-lg mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
                        <div>
              <h4 className="font-medium text-gray-800">학습 시간 패턴 분석</h4>
              <p className="text-sm text-gray-600 mt-1">요일별, 시간대별 학습 패턴을 분석하여 효율적인 학습 시간을 찾아드립니다.</p>
                          </div>
                        </div>
          <div className="flex items-start bg-white p-4 rounded-lg shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md">
            <div className="flex-shrink-0 bg-teal-50 text-teal-500 p-2 rounded-lg mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-gray-800">목표 설정 및 달성률 추적</h4>
              <p className="text-sm text-gray-600 mt-1">개인 학습 목표를 설정하고 달성률을 실시간으로 확인할 수 있습니다.</p>
                            </div>
                          </div>
          <div className="flex items-start bg-white p-4 rounded-lg shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md">
            <div className="flex-shrink-0 bg-teal-50 text-teal-500 p-2 rounded-lg mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-gray-800">오답 유형 심층 분석</h4>
              <p className="text-sm text-gray-600 mt-1">객관식 오선택 패턴 분석 등 오답 유형을 심층적으로 분석하여 취약점을 개선합니다.</p>
                        </div>
                      </div>
                    </div>
        <div className="mt-6 text-center">
          {!userId ? (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-gray-600 mb-4">더 많은 기능과 개인화된 통계를 이용하려면 로그인하세요.</p>
              <Link href="/login" className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                로그인하고 시작하기
              </Link>
                </div>
          ) : (
            <button className="px-5 py-2 bg-teal-50 text-teal-600 rounded-lg font-medium hover:bg-teal-100 transition-colors">
              기능 제안하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const SummaryCard = ({ 
  title, 
  value, 
  subText, 
  icon, 
  bgClass = "bg-blue-50", 
  iconClass = "text-blue-500" 
}: SummaryCardProps) => (
  <div className="bg-white border border-gray-100 p-6 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg">
    <div className="flex items-start justify-between">
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
        {subText && <p className="text-xs text-gray-500 mt-2">{subText}</p>}
      </div>
      {icon && (
        <div className={`p-3 rounded-lg ${bgClass}`}>
          <div className={`${iconClass}`}>
            {icon}
          </div>
        </div>
      )}
    </div>
  </div>
); 