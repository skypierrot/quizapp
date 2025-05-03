'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader } from '@/components/ui/card';
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';
import { IExamInstance } from '@/types';

interface GroupedExams {
  [examName: string]: IExamInstance[];
}

interface ExamListDisplayProps {
  groupedExams: GroupedExams;
  basePath: string; // 예: "/learn/exams" 또는 "/test/select/exam"
  title: string; // 페이지 제목
}

export function ExamListDisplay({ groupedExams, basePath, title }: ExamListDisplayProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const filteredEntries = Object.entries(groupedExams).filter(([examName]) =>
    examName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Title and Search Area */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold">{title}</h1>
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

      {/* Exam List Grid */}
      {filteredEntries.length === 0 ? (
        <p className="text-gray-500">{searchTerm ? '검색 결과가 없습니다.' : '등록된 시험 종류가 없습니다.'}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredEntries.map(([examName, instances]) => {
            const encodedExamName = encodeURIComponent(examName);
            const detailUrl = `${basePath}/${encodedExamName}`; // basePath 사용
            const instanceCount = instances.length;

            return (
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
    </>
  );
} 