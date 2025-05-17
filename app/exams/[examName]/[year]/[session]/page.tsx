'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Breadcrumb from '@/components/common/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface DecodedParams {
  examName: string;
  year: string;
  subject: string;
}

export default function ExamStartConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const [decodedParams, setDecodedParams] = useState<DecodedParams | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const examNameRaw = params?.examName ?? null;
      const yearRaw = params?.year ?? null;
      const subjectRaw = params?.subject ?? null;

      if (
        typeof examNameRaw !== 'string' ||
        typeof yearRaw !== 'string' ||
        typeof subjectRaw !== 'string'
      ) {
        throw new Error('URL 파라미터가 유효하지 않습니다.');
      }

      const decodedExamName = decodeURIComponent(examNameRaw);
      const decodedYear = decodeURIComponent(yearRaw);
      const decodedSubject = decodeURIComponent(subjectRaw);

      setDecodedParams({
        examName: decodedExamName,
        year: decodedYear,
        subject: decodedSubject,
      });
      setError(null);
    } catch (e: any) {
      console.error('파라미터 디코딩 오류:', e);
      setError(e.message || '파라미터 처리 중 오류가 발생했습니다.');
      setDecodedParams(null);
    }
  }, [params]);

  const handleStartExam = () => {
    if (decodedParams) {
      // 실제 시험 응시 페이지로 이동 (경로는 추후 확정)
      // 예시: /exams/start?name=...&year=...&session=...
      const queryParams = new URLSearchParams({
        name: decodedParams.examName,
        year: decodedParams.year,
        subject: decodedParams.subject,
      }).toString();
      router.push(`/exams/start?${queryParams}`);
      console.log(`시험 시작: ${decodedParams.examName} ${decodedParams.year} ${decodedParams.subject}`);
    } else {
      console.error("시험 정보를 찾을 수 없어 시작할 수 없습니다.");
      // 사용자에게 오류 알림 (예: Toast 메시지)
    }
  };

  // Breadcrumb 아이템 정의
  const breadcrumbItems = decodedParams && params ? [
    { label: '홈', href: '/' },
    { label: '모의고사', href: '/exams' },
    { label: decodedParams.examName, href: `/exams/${params.examName}` },
    { label: `${decodedParams.year} / ${decodedParams.subject}`, href: `/exams/${params.examName}/${params.year}/${params.subject}`, isCurrent: true },
  ] : [
    { label: '홈', href: '/' },
    { label: '모의고사', href: '/exams' },
  ]; // 디코딩 실패 시 기본 경로

  if (error) {
    return (
      <div className="container mx-auto py-8 text-center text-red-500">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
        <h2 className="mt-4 text-xl font-semibold">오류 발생</h2>
        <p className="mt-2 text-sm text-gray-600">{error}</p>
        <Button variant="outline" className="mt-6" onClick={() => router.push('/exams')}>
          모의고사 선택으로 돌아가기
        </Button>
      </div>
    );
  }

  if (!decodedParams) {
    // 파라미터 로딩 중 또는 오류 발생 전 상태
    return <div className="container mx-auto py-8 text-center">정보 로딩 중...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Breadcrumb items={breadcrumbItems} />

      <Card className="mt-6 max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>모의고사 시작 확인</CardTitle>
          <CardDescription>
            아래 정보로 모의고사를 시작하시겠습니까?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-500">시험명</p>
            <p className="text-lg font-semibold">{decodedParams.examName}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">년도</p>
            <p className="text-lg font-semibold">{decodedParams.year}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">과목</p>
            <p className="text-lg font-semibold">{decodedParams.subject}</p>
          </div>
          <Button className="w-full mt-4" onClick={handleStartExam}>
            시험 시작하기
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 