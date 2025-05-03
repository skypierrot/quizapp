'use client';

import { useState, useEffect } from 'react';
import { IExamInstance, GroupedExams } from '@/types';
import Breadcrumb from '@/components/common/Breadcrumb';
import { ExamListDisplay } from '@/components/exam-selection/ExamListDisplay';

export default function ExamsPage() {
  const [groupedExams, setGroupedExams] = useState<GroupedExams>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndGroupExams = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/exam-instances', {
          cache: 'no-store',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `API 호출 실패: ${response.statusText}`);
        }

        const data = await response.json();
        const examInstances: IExamInstance[] = data.examInstances || [];

        const grouped: GroupedExams = examInstances.reduce((acc, instance) => {
          if (!acc[instance.examName]) {
            acc[instance.examName] = [];
          }
          acc[instance.examName].push(instance);
          return acc;
        }, {} as GroupedExams);

        setGroupedExams(grouped);
      } catch (err) {
        console.error("모의고사 시험 목록 로딩 실패:", err);
        setError(err instanceof Error ? err.message : "데이터 로딩 중 오류가 발생했습니다.");
        setGroupedExams({});
      } finally {
        setLoading(false);
      }
    };

    fetchAndGroupExams();
  }, []);

  const breadcrumbItems = [
    { label: '홈', href: '/' },
    { label: '모의고사', href: '/exams', isCurrent: true },
  ];

  if (loading) {
    return <div className="container mx-auto py-8 text-center">로딩 중...</div>;
  }

  if (error) {
    return <div className="container mx-auto py-8 text-center text-red-500">데이터 로딩 중 오류 발생: {error}</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Breadcrumb items={breadcrumbItems} />

      <ExamListDisplay
        groupedExams={groupedExams}
        basePath="/exams"
        title="모의고사 선택"
      />
    </div>
  );
} 