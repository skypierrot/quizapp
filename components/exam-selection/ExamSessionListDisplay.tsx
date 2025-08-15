'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader } from '@/components/ui/card';
// import { IExamInstance } from '@/types'; // 기존 타입 제거

// 새로운 데이터 아이템 인터페이스
export interface IDisplayItem {
  key: string;
  displayLabel: string; // 예: "2026-06-07" 또는 "2026-06-07 (일반화학)"
  countLabel: string;  // 예: "문항 수: 10개"
  linkUrl: string;
  // 필요시 추가적인 스타일링이나 정보를 위한 필드 추가 가능
  date?: string; // 정렬이나 추가 정보 표시에 사용될 수 있는 원본 날짜
  subject?: string; // 마찬가지
  questionCount?: number; // 원본 문제 수
}

interface ExamSessionListDisplayProps {
  // examInstances: IExamInstance[]; // 기존 prop 제거
  items: IDisplayItem[]; // 새로운 prop
  title: string; // 페이지 제목
  // basePath는 이제 linkUrl에 포함되므로 제거 가능, 또는 유지하고 linkUrl 생성에 활용
}

export function ExamSessionListDisplay({ items, title }: ExamSessionListDisplayProps) {
  return (
    <>
      <h1 className="text-3xl font-bold mb-6">{title}</h1>

      {items.length === 0 ? (
        <p className="text-gray-500">표시할 항목이 없습니다.</p> // 메시지 일반화
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4">
          {items.map((item) => {
            return (
              <Link href={item.linkUrl} key={item.key}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col">
                  <CardHeader className="py-3">
                    <div className="block max-sm:flex max-sm:flex-row max-sm:items-baseline max-sm:justify-between">
                      <div className="text-xl font-bold mb-1 max-sm:mb-0 max-sm:mr-2">
                        {item.displayLabel}
                      </div>
                      <div className="text-sm text-gray-600 max-sm:flex-shrink-0">
                        {item.countLabel}
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