'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
// import Link from 'next/link'; // Link는 공통 컴포넌트 내부에서 사용됨
// import { Card, CardHeader } from '@/components/ui/card'; // Card 관련 import 제거
import { IExamInstance } from '@/types';
import Breadcrumb from '@/components/common/Breadcrumb';
import { ExamSessionListDisplay } from '@/components/exam-selection/ExamSessionListDisplay'; // 공통 컴포넌트 import

interface IExamInstancesResponse { // 이 인터페이스는 API 응답 형식이므로 유지하거나 types로 이동
  examInstances: IExamInstance[];
}

export default function LearnExamDetailPage() { // 페이지 컴포넌트 이름 변경
  const params = useParams();
  const [decodedExamName, setDecodedExamName] = useState<string | null>(null);
  const [examInstances, setExamInstances] = useState<IExamInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const examNameParam = params.examName;
    if (typeof examNameParam === 'string') {
      try {
        const decodedName = decodeURIComponent(examNameParam);
        setDecodedExamName(decodedName);

        const fetchExamInstances = async () => {
          setLoading(true);
          setError(null);
          try {
            const apiUrl = '/api/exam-instances';
            const encodedTag = encodeURIComponent(`시험명:${decodedName}`);
            const response = await fetch(`${apiUrl}?tags=${encodedTag}`, { cache: 'no-store' });
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.error || `API 호출 실패: ${response.statusText}`);
            }
            const data: IExamInstancesResponse = await response.json();
            const sortedInstances = (data.examInstances || []).sort((a, b) => {
              if (a.year !== b.year) return b.year.localeCompare(a.year);
              return b.session.localeCompare(a.session);
            });
            setExamInstances(sortedInstances);
          } catch (err) {
            console.error("Exam instances loading failed:", err);
            setError(err instanceof Error ? err.message : "데이터를 불러오는 중 오류가 발생했습니다.");
            setExamInstances([]);
          } finally {
            setLoading(false);
          }
        };
        fetchExamInstances();
      } catch (e) {
        console.error("Error decoding exam name:", e);
        setError("잘못된 시험명 형식입니다.");
        setLoading(false);
      }
    } else {
      setError("시험명을 URL에서 찾을 수 없습니다.");
      setLoading(false);
    }
  }, [params.examName]);

  const breadcrumbItems = decodedExamName ? [
    { label: '홈', href: '/' },
    { label: '문제 은행', href: '/learn/exams' },
    { label: decodedExamName, href: `/learn/exams/${params.examName}`, isCurrent: true }, // 수정: isCurrent=true
  ] : [];

  if (loading) {
    return <div className="container mx-auto py-8 text-center">로딩 중...</div>;
  }
  if (error) {
    return <div className="container mx-auto py-8 text-center text-red-500">오류: {error}</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Breadcrumb items={breadcrumbItems} />
      {/* 공통 컴포넌트 사용 */}
      <ExamSessionListDisplay
        examInstances={examInstances}
        basePath="/learn/exams" // 학습 경로 전달
        title={decodedExamName || "시험 회차 목록"} // 제목 전달
      />
    </div>
  );
} 