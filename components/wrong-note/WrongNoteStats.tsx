import React from 'react';
import useSWR from 'swr';
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter 
} from '@/components/ui/card';
import {
  AlertTriangle, Award, Calendar, CheckCircle2, Circle, Clock, 
  BarChart3, BarChart4, PieChart, Loader2, RotateCcw
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface WrongNoteStatsProps {
  resultId: string;
}

export default function WrongNoteStats({ resultId }: WrongNoteStatsProps) {
  const { data, error, isLoading } = useSWR(resultId ? `/api/wrong-note/stats?resultId=${resultId}` : null, fetcher);
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-40">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
        <p className="text-gray-500">통계 데이터를 불러오는 중...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 rounded-lg p-4 flex items-center text-red-600">
        <AlertTriangle className="h-5 w-5 mr-2" />
        <span>통계 데이터를 불러오는 데 실패했습니다.</span>
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="bg-yellow-50 rounded-lg p-4 flex items-center text-yellow-600">
        <AlertTriangle className="h-5 w-5 mr-2" />
        <span>표시할 통계 데이터가 없습니다.</span>
      </div>
    );
  }
  
  const { overview, reviewProgress, topWrongTags, examTypeStats, dailyWrongStats } = data;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* 종합 통계 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">오답 종합 통계</CardTitle>
          <CardDescription>전체 오답 현황 및 성향 분석</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-gray-600 mb-1">전체 문제 수</span>
              <span className="text-2xl font-bold text-blue-600">{overview.totalQuestions}</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-red-50 rounded-lg">
              <span className="text-sm text-gray-600 mb-1">총 오답 수</span>
              <span className="text-2xl font-bold text-red-600">{overview.totalWrongAnswers}</span>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">오답률</span>
              <span className="text-sm font-medium">{overview.wrongPercentage}%</span>
            </div>
            <Progress 
              value={overview.wrongPercentage} 
              className="h-2 bg-gray-100" 
              indicatorClassName={cn(
                overview.wrongPercentage < 30 ? "bg-green-500" :
                overview.wrongPercentage < 60 ? "bg-yellow-500" :
                "bg-red-500"
              )}
            />
          </div>
          
          <div className="mt-4">
            <span className="text-sm font-medium">복습 현황</span>
            <div className="mt-2 flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <div className="flex flex-col items-center">
                <Circle className="h-4 w-4 text-gray-400 mb-1" />
                <span className="text-xs text-gray-600">미복습</span>
                <span className="text-lg font-medium">{reviewProgress.notStarted}</span>
              </div>
              <div className="flex flex-col items-center">
                <RotateCcw className="h-4 w-4 text-blue-500 mb-1" />
                <span className="text-xs text-gray-600">복습 중</span>
                <span className="text-lg font-medium">{reviewProgress.inProgress}</span>
              </div>
              <div className="flex flex-col items-center">
                <CheckCircle2 className="h-4 w-4 text-green-500 mb-1" />
                <span className="text-xs text-gray-600">완료</span>
                <span className="text-lg font-medium">{reviewProgress.completed}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 자주 틀리는 태그 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">취약 부분 분석</CardTitle>
          <CardDescription>자주 틀리는 주제/태그 분석</CardDescription>
        </CardHeader>
        <CardContent>
          {topWrongTags.length > 0 ? (
            <div className="space-y-3">
              {topWrongTags.map((tag: any) => (
                <div key={tag.tag} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{tag.tag}</span>
                    <span className="text-xs text-gray-500">
                      {tag.wrongCount}회 / {tag.totalCount}문제
                    </span>
                  </div>
                  <Progress
                    value={tag.percentage}
                    className="h-2 bg-gray-100"
                    indicatorClassName={cn(
                      tag.percentage < 30 ? "bg-green-500" :
                      tag.percentage < 60 ? "bg-yellow-500" :
                      "bg-red-500"
                    )}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <PieChart className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>아직 데이터가 충분하지 않습니다.</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="text-xs text-gray-500 pt-0">
          * 오답 횟수가 많은 상위 5개 태그만 표시됩니다.
        </CardFooter>
      </Card>
      
      {/* 시험별 오답 분석 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">시험별 오답 현황</CardTitle>
          <CardDescription>시험 유형에 따른 오답률</CardDescription>
        </CardHeader>
        <CardContent>
          {examTypeStats.length > 0 ? (
            <div className="space-y-3">
              {examTypeStats.map((exam: any) => (
                <div key={exam.examName} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium truncate max-w-[180px]">{exam.examName}</span>
                    <span className="text-xs text-gray-500">
                      {exam.wrongCount}회 / {exam.totalQuestions}문제
                    </span>
                  </div>
                  <Progress
                    value={exam.percentage}
                    className="h-2 bg-gray-100"
                    indicatorClassName={cn(
                      exam.percentage < 30 ? "bg-green-500" :
                      exam.percentage < 60 ? "bg-yellow-500" :
                      "bg-red-500"
                    )}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>아직 데이터가 충분하지 않습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* 최근 오답 추이 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">최근 오답 추이</CardTitle>
          <CardDescription>최근 30일간 오답 현황</CardDescription>
        </CardHeader>
        <CardContent>
          {dailyWrongStats.length > 0 ? (
            <div className="h-40 flex items-end justify-between gap-0.5">
              {dailyWrongStats.filter((_: any, i: number) => i % 3 === 0).map((day: any, i: number) => {
                const height = day.wrongCount > 0 ? Math.max(10, (day.wrongCount / 10) * 100) : 0;
                return (
                  <div key={i} className="flex flex-col items-center justify-end">
                    <div 
                      className={cn(
                        "w-3 bg-blue-400 rounded-t",
                        day.wrongCount > 5 ? "bg-red-400" : 
                        day.wrongCount > 2 ? "bg-yellow-400" : "bg-blue-400"
                      )}
                      style={{ height: `${Math.min(height, 100)}%` }}
                    ></div>
                    {i % 3 === 0 && (
                      <span className="text-[8px] mt-1">{day.date.slice(-5)}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BarChart4 className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>아직 데이터가 충분하지 않습니다.</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="text-xs text-gray-500 pt-0">
          * 10일 간격으로 오답 수 추이를 표시합니다.
        </CardFooter>
      </Card>
    </div>
  );
} 