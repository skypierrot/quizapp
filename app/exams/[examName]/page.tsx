'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { IExamInstance } from '@/types';
import Breadcrumb from '@/components/common/Breadcrumb';
import { ExamSessionListDisplay } from '@/components/exam-selection/ExamSessionListDisplay';

// API 응답 타입 (필요시 types/index.ts로 이동 가능)
interface IExamInstancesResponse {
  examInstances: IExamInstance[];
}

export default function ExamDetailPage() {
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
            // 태그를 사용하여 해당 시험명의 인스턴스만 가져옵니다.
            const response = await fetch(`${apiUrl}?tags=${encodedTag}`, { cache: 'no-store' });
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.error || `API 호출 실패: ${response.statusText}`);
            }
            const data: IExamInstancesResponse = await response.json();
            // 년도 내림차순, 회차 오름차순 정렬
            const sortedInstances = (data.examInstances || []).sort((a, b) => {
              if (a.year !== b.year) return b.year.localeCompare(a.year);
              return a.session.localeCompare(b.session);
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
        console.error("시험명 디코딩 오류:", e);
        setError("잘못된 시험명 형식입니다.");
        setLoading(false);
      }
    } else {
      setError("URL에서 시험명을 찾을 수 없습니다.");
      setLoading(false);
    }
  }, [params.examName]);

  if (loading) {
    return <div className="container mx-auto py-8 text-center">로딩 중...</div>;
  }
  if (error) {
    return <div className="container mx-auto py-8 text-center text-red-500">오류: {error}</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Breadcrumb items={decodedExamName ? [
        { label: '홈', href: '/' },
        { label: '모의고사', href: '/exams' },
        { label: decodedExamName, href: `/exams/${params.examName}`, isCurrent: true },
      ] : []} />
      {/* ExamSessionListDisplay 사용하여 회차 목록 표시 (basePath, title 수정) */}
      <ExamSessionListDisplay
        examInstances={examInstances}
        basePath="/exams" // 모의고사 기본 경로
        title={decodedExamName ? `${decodedExamName} - 모의고사 회차 선택` : "모의고사 회차 선택"}
      />
    </div>
  );
} 