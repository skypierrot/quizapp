'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { IExamResult } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
// date-fns 관련 import 제거

// 커스텀 날짜 포맷팅 함수 구현
function formatDate(date: Date | string, formatStr: string = 'yyyy년 M월 d일 HH:mm'): string {
  const d = new Date(date);
  
  // 한국어 월 이름
  const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  
  // 날짜 포맷팅에 필요한 값들
  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  
  // 간단한 포맷 문자열 변환
  return formatStr
    .replace('yyyy', year.toString())
    .replace('M', (month + 1).toString())
    .replace('MM', (month + 1).toString().padStart(2, '0'))
    .replace('d', day.toString())
    .replace('dd', day.toString().padStart(2, '0'))
    .replace('HH', hours)
    .replace('mm', minutes);
}

export default function ExamResultsPage() {
  const { data: session, status } = useSession();
  const [results, setResults] = useState<IExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      const fetchResults = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch('/api/exam-results', { credentials: 'include' });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `시험 결과를 불러오는 데 실패했습니다 (${response.status})`);
          }
          const data: IExamResult[] = await response.json();
          setResults(data);
        } catch (e: any) {
          setError(e.message || '알 수 없는 오류가 발생했습니다.');
        } finally {
          setLoading(false);
        }
      };
      fetchResults();
    } else if (status === 'unauthenticated') {
      setLoading(false);
      setError('시험 결과를 보려면 로그인이 필요합니다.');
    }
    // status가 'loading'일 때는 아무것도 하지 않음 (로딩 중 표시)
  }, [status]);

  if (loading || status === 'loading') {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 text-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center justify-center">
              <AlertCircle className="mr-2 h-6 w-6" /> 오류 발생
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            {status === 'unauthenticated' && (
              <Button onClick={() => window.location.href = '/api/auth/signin'} className="mt-4">
                로그인 페이지로 이동
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>나의 시험 결과</CardTitle>
          <CardDescription>지금까지 응시한 모든 시험 결과 목록입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-lg font-medium text-gray-700">
                아직 응시한 시험 결과가 없습니다.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                모의고사에 응시하고 결과를 확인해보세요!
              </p>
              <Button asChild className="mt-6">
                <Link href="/learn/exams">문제 은행으로 이동</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[25%]">시험명</TableHead>
                  <TableHead className="w-[20%]">응시일</TableHead>
                  <TableHead className="text-center w-[15%]">점수</TableHead>
                  <TableHead className="text-center w-[20%]">정답/총 문항</TableHead>
                  <TableHead className="text-center w-[10%]">소요 시간</TableHead>
                  <TableHead className="text-right w-[10%]">상세보기</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell className="font-medium">
                      {result.examName}
                      <p className="text-xs text-gray-500 mt-1">
                        {result.examYear}년 / {result.examSubject}
                        {result.examDate && result.examDate !== `${result.examYear}-01-01` ? 
                          ` (${formatDate(new Date(result.examDate), 'MM.dd')})` : ''}
                      </p>
                    </TableCell>
                    <TableCell>
                      {formatDate(new Date(result.createdAt), 'yyyy년 M월 d일 HH:mm')}
                    </TableCell>
                    <TableCell className="text-center font-semibold text-blue-600">{result.score}점</TableCell>
                    <TableCell className="text-center">
                      {result.correctCount} / {result.totalQuestions}
                    </TableCell>
                    <TableCell className="text-center">
                      {Math.floor(result.elapsedTime / 60)}분 {result.elapsedTime % 60}초
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/results/${result.id}`}>
                          <ExternalLink className="mr-1 h-3 w-3" /> 보기
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 