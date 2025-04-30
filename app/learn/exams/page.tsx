'use client'; // Convert to Client Component

import React, { useState, useEffect } from 'react'; // Import hooks
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription
} from '@/components/ui/card';
import { Input } from "@/components/ui/input"; // Import Input for search
import { Search } from 'lucide-react'; // Import Search icon
import { IExamInstance } from '@/types'; // Import from common types
import Breadcrumb from '@/components/common/Breadcrumb'; // Import Breadcrumb
import { ExamListDisplay } from '@/components/exam-selection/ExamListDisplay'; // 공통 컴포넌트 import

// Remove local duplicate interface definitions if they exist
// interface IExamInstance { ... }
// interface IExamInstancesResponse { ... }

// Keep GroupedExams if only used here, or move to types/index.ts
interface GroupedExams {
  [examName: string]: IExamInstance[];
}

/**
 * 문제 은행 페이지 (시험 선택 페이지)
 * 등록된 문제들을 시험명/년도/회차 기준으로 그룹화하여 보여줍니다.
 */
export default function LearnExamsPage() {
  // State variables for data, loading, error, and search term
  const [groupedExams, setGroupedExams] = useState<GroupedExams>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch data on component mount
  useEffect(() => {
    const fetchAndGroupExams = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use relative path for API calls from client components
        const response = await fetch('/api/exam-instances', { 
          cache: 'no-store',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `API 호출 실패: ${response.statusText}`);
        }

        const data = await response.json(); 
        const examInstances: IExamInstance[] = data.examInstances || [];

        // Group instances by examName (same logic as before)
        const grouped: GroupedExams = examInstances.reduce((acc, instance) => {
          if (!acc[instance.examName]) {
            acc[instance.examName] = [];
          }
          acc[instance.examName].push(instance);
          return acc;
        }, {} as GroupedExams);

        setGroupedExams(grouped);
      } catch (err) {
        console.error("문제 은행 데이터 로딩 실패:", err);
        setError(err instanceof Error ? err.message : "데이터 로딩 중 오류가 발생했습니다.");
        setGroupedExams({}); // Clear data on error
      } finally {
        setLoading(false);
      }
    };

    fetchAndGroupExams();
  }, []); // Empty dependency array means run once on mount

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Filter grouped exams based on search term
  const filteredEntries = Object.entries(groupedExams).filter(([examName]) =>
    examName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Define breadcrumb items for the main bank page
  const breadcrumbItems = [
    { label: '홈', href: '/' },
    { label: '문제 은행', href: '/learn/exams', isCurrent: true },
  ];

  // Render loading state
  if (loading) {
    return <div className="container mx-auto py-8 text-center">로딩 중...</div>;
  }

  // Render error state
  if (error) {
    return <div className="container mx-auto py-8 text-center text-red-500">데이터 로딩 중 오류 발생: {error}</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Breadcrumb items={breadcrumbItems} />

      {/* 공통 컴포넌트 사용 */}
      <ExamListDisplay
        groupedExams={groupedExams}
        basePath="/learn/exams" // 학습 경로 전달
        title="문제 은행"
      />
    </div>
  );
}