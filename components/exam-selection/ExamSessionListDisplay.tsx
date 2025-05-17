'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader } from '@/components/ui/card';
import { IExamInstance } from '@/types';

interface ExamSessionListDisplayProps {
  examInstances: IExamInstance[];
  basePath: string; // 예: "/learn/exams" 또는 "/test/select/exam"
  title: string; // 페이지 제목 (시험명)
}

export function ExamSessionListDisplay({ examInstances, basePath, title }: ExamSessionListDisplayProps) {
  return (
    <>
      {/* Title */}
      <h1 className="text-3xl font-bold mb-6">{title}</h1>

      {/* Session List Grid */}
      {examInstances.length === 0 ? (
        <p className="text-gray-500">해당 시험으로 등록된 과목이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4">
          {examInstances.map((instance) => {
            const encodedExamNameParam = encodeURIComponent(instance.examName);
            const encodedYearParam = encodeURIComponent(instance.year);
            const encodedSubjectParam = encodeURIComponent(instance.subject);
            // Construct the URL based on basePath
            const detailUrl = `${basePath}/${encodedExamNameParam}/${encodedYearParam}/${encodedSubjectParam}`;
            const cardKey = `${instance.year}-${instance.subject}`;

            return (
              <Link href={detailUrl} key={cardKey}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col">
                  <CardHeader className="py-3">
                    <div className="block max-sm:flex max-sm:flex-row max-sm:items-baseline max-sm:justify-between">
                      <div className="text-xl font-bold mb-1 max-sm:mb-0 max-sm:mr-2">
                        {instance.year}년 {instance.subject}
                      </div>
                      <div className="text-sm text-gray-600 max-sm:flex-shrink-0">
                        문항 수: {instance.questionCount}개
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