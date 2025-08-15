'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader } from '@/components/ui/card';
import { Input } from "@/components/ui/input";
import { Search, Star, StarOff } from 'lucide-react';
import { GroupedExams, GroupedExamData } from '@/types';
import { useExamFavorites } from '@/hooks/useExamFavorites';

interface ExamListDisplayProps {
  groupedExams: GroupedExams;
  basePath: string; // 예: "/learn/exams" 또는 "/test/select/exam"
  title: string; // 페이지 제목
}

export function ExamListDisplay({ groupedExams, basePath, title }: ExamListDisplayProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { favorites, toggleFavorite, isFavorite } = useExamFavorites();

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // 즐겨찾기 토글 핸들러
  const handleFavoriteToggle = (e: React.MouseEvent, examName: string) => {
    e.preventDefault(); // Link 클릭 방지
    e.stopPropagation(); // 이벤트 버블링 방지
    toggleFavorite(examName);
  };

  // 검색 필터링
  const filteredEntries = Object.entries(groupedExams).filter(([examName]) =>
    examName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 즐겨찾기 우선 정렬
  const sortedEntries = filteredEntries.sort(([examNameA], [examNameB]) => {
    const isFavoriteA = isFavorite(examNameA);
    const isFavoriteB = isFavorite(examNameB);
    
    if (isFavoriteA && !isFavoriteB) return -1;
    if (!isFavoriteA && isFavoriteB) return 1;
    return examNameA.localeCompare(examNameB); // 즐겨찾기 상태가 같으면 알파벳 순
  });

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

      {/* 즐겨찾기 안내 메시지 */}
      {favorites.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            ⭐ 즐겨찾기된 시험이 상단에 표시됩니다. ({favorites.length}개)
          </p>
        </div>
      )}

      {/* Exam List Grid */}
      {sortedEntries.length === 0 ? (
        <p className="text-gray-500">{searchTerm ? '검색 결과가 없습니다.' : '등록된 시험 종류가 없습니다.'}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {sortedEntries.map(([examName, examData]) => {
            if (!examData) return null;
            
            const encodedExamName = encodeURIComponent(examName);
            const detailUrl = `${basePath}/${encodedExamName}`;
            const displayCount = examData.uniqueDateCount || 0;
            const favorite = isFavorite(examName);

            return (
              <Link href={detailUrl} key={examName}>
                <Card className={`hover:shadow-lg transition-shadow cursor-pointer flex flex-col ${
                  favorite ? 'ring-2 ring-yellow-400 bg-yellow-50' : ''
                }`}>
                  <CardHeader className="py-3 relative">
                    {/* 즐겨찾기 버튼 */}
                    <button
                      onClick={(e) => handleFavoriteToggle(e, examName)}
                      className={`absolute top-2 right-2 p-1 rounded-full transition-colors ${
                        favorite 
                          ? 'text-yellow-500 hover:text-yellow-600 bg-yellow-100 hover:bg-yellow-200' 
                          : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-100'
                      }`}
                      title={favorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                    >
                      {favorite ? <Star className="w-4 h-4" /> : <StarOff className="w-4 h-4" />}
                    </button>

                    <div className="block max-sm:flex max-sm:items-baseline max-sm:justify-between">
                      <div className="text-xl font-bold mb-1 max-sm:mb-0 max-sm:mr-2 pr-8">
                        {examName}
                      </div>
                      <div className="text-sm text-gray-600 max-sm:flex-shrink-0">
                        총 {displayCount}개의 시험 등록됨
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