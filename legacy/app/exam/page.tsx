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

// Keep GroupedExams if only used here, or move to types/index.ts
interface GroupedExams {
  [examName: string]: IExamInstance[];
}

/**
 * 모의고사 선택 페이지
 * 응시할 시험을 선택합니다. (시험명/년도/회차 기준)
 */
export default function ExamSelectionPage() { // Rename component
  // State variables for data, loading, error, and search term
  const [groupedExams, setGroupedExams] = useState<GroupedExams>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch data on component mount (same API endpoint)
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
        console.error("시험 선택 데이터 로딩 실패:", err);
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

  // Define breadcrumb items for the exam selection page
  const breadcrumbItems = [
    { label: '홈', href: '/' },
    { label: '모의고사 시험 선택', href: '/exam', isCurrent: true }, // Update breadcrumb
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
      {/* Add Breadcrumb component */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Title and Search Area Wrapper */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        {/* Title - Update title */}
        <h1 className="text-3xl font-bold">모의고사 시험 선택</h1>
        
        {/* Search Input Area */}
        <div className="relative mt-4 md:mt-0"> 
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="시험명 검색..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10 w-full md:w-auto lg:w-80" 
          />
        </div>
      </div>

      {/* Conditional rendering based on search results */}
      {filteredEntries.length === 0 ? (
        <p className="text-gray-500">{searchTerm ? '검색 결과가 없습니다.' : '등록된 시험 종류가 없습니다.'}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredEntries.map(([examName, instances]) => {
            const encodedExamName = encodeURIComponent(examName);
            // Update detailUrl to point to /practice/...
            const detailUrl = `/practice/${encodedExamName}`; 
            const instanceCount = instances.length;

            return (
              // Link to the specific exam detail page
              <Link href={detailUrl} key={examName}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col">
                  <CardHeader className="py-3">
                    <div className="block max-sm:flex max-sm:items-baseline max-sm:justify-between">
                      <div className="text-xl font-bold mb-1 max-sm:mb-0 max-sm:mr-2">
                        {examName}
                      </div>
                      <div className="text-sm text-gray-600 max-sm:flex-shrink-0">
                        총 {instanceCount}개의 시험 등록됨
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
} 