import React from 'react';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// API 응답 및 데이터 타입을 위한 인터페이스 정의
interface IExamInstance {
  examName: string;
  year: string;
  session: string;
  questionCount: number;
}

interface IExamInstancesResponse {
  examInstances: IExamInstance[];
}

/**
 * 문제 은행 페이지 (시험 선택 페이지)
 * 등록된 문제들을 시험명/년도/회차 기준으로 그룹화하여 보여줍니다.
 */
export default async function BankPage() {

  let examInstances: IExamInstance[] = [];
  let fetchError: string | null = null;

  try {
    const apiUrl = process.env.APP_URL || 'http://quizapp-dev:3000';
    const response = await fetch(`${apiUrl}/api/exam-instances`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.statusText}`);
    }

    const data: IExamInstancesResponse = await response.json();
    examInstances = data.examInstances || [];

  } catch (error) {
    console.error("문제 은행 데이터 로딩 실패:", error);
    fetchError = error instanceof Error ? error.message : "알 수 없는 오류 발생";
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">문제 은행</h1>

      {fetchError && (
        <p className="text-red-500">데이터 로딩 중 오류 발생: {fetchError}</p>
      )}

      {!fetchError && examInstances.length === 0 ? (
        <p className="text-gray-500">등록된 시험 문제 그룹이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {examInstances.map((instance) => {
            const examPath = [
              instance.examName,
              instance.year,
              instance.session
            ].map(encodeURIComponent).join('/');
            const detailUrl = `/study/${examPath}`;
            const cardKey = `${instance.examName}-${instance.year}-${instance.session}`;

            return (
              <Link href={detailUrl} key={cardKey}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-xl mb-2">{instance.examName}</CardTitle>
                    <CardDescription>
                      <Badge variant="outline" className="mr-2 text-sm">{instance.year}</Badge>
                      <Badge variant="secondary" className="text-sm">{instance.session}</Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow flex items-end">
                    <p className="text-sm text-gray-600">문항 수: {instance.questionCount}개</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}