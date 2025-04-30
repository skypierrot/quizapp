'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { IExamInstance } from '@/types';
import Breadcrumb from '@/components/common/Breadcrumb';
import { ExamSessionListDisplay } from '@/components/exam-selection/ExamSessionListDisplay';

interface IExamInstancesResponse {
  examInstances: IExamInstance[];
}

export default function TestSelectExamSessionPage() {
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
           // Fetching 로직은 LearnExamDetailPage와 동일
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
            console.error("모의고사 회차 목록 로딩 실패:", err);
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
    { label: '모의고사', href: '/test/select' },
    { label: '시험 선택', href: '/test/select/exam' },
    { label: decodedExamName, href: `/test/select/exam/${params.examName}`, isCurrent: true },
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
      {/* 공통 컴포넌트 사용, basePath 변경 */}
      <ExamSessionListDisplay
        examInstances={examInstances}
        basePath="/test/select/exam" // 모의고사 경로 전달
        title={decodedExamName ? `${decodedExamName} - 회차 선택` : "회차 선택"}
      />
      {/* TODO: 여기에 '모의고사 시작' 버튼 또는 커스텀 설정 링크 추가 */}
    </div>
  );
} 