import React, { useState, useEffect } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  AlertTriangle, BookmarkPlus, Filter, SortAsc, Star
} from 'lucide-react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface WrongNoteFiltersProps {
  onFilterChange: (filters: {
    sortBy: string;
    filterType: string;
    showBookmarked: boolean;
    showImportant: boolean;
  }) => void;
}

export default function WrongNoteFilters({ onFilterChange }: WrongNoteFiltersProps) {
  // 필터 상태
  const [sortBy, setSortBy] = useState('wrongCount'); // wrongCount, date
  const [filterType, setFilterType] = useState('all'); // all, not-reviewed, reviewing, completed
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [showImportant, setShowImportant] = useState(false);
  
  // 시험 목록 가져오기
  const { data: examsData } = useSWR('/api/exams/names', fetcher);
  
  // 필터 변경 시 상위 컴포넌트에 알림
  useEffect(() => {
    onFilterChange({
      sortBy,
      filterType,
      showBookmarked,
      showImportant
    });
  }, [sortBy, filterType, showBookmarked, showImportant]);
  
  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center">
          <SortAsc className="h-4 w-4 text-gray-500 mr-2" />
          <span className="text-sm font-medium mr-2">정렬:</span>
          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="정렬 기준" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="wrongCount">오답 횟수 (많은순)</SelectItem>
              <SelectItem value="wrongCountAsc">오답 횟수 (적은순)</SelectItem>
              <SelectItem value="date">날짜 (최신순)</SelectItem>
              <SelectItem value="dateAsc">날짜 (오래된순)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center">
          <Filter className="h-4 w-4 text-gray-500 mr-2" />
          <span className="text-sm font-medium mr-2">복습상태:</span>
          <Select
            value={filterType}
            onValueChange={(value) => setFilterType(value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="복습 상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 보기</SelectItem>
              <SelectItem value="not-reviewed">미복습</SelectItem>
              <SelectItem value="reviewing">복습 중</SelectItem>
              <SelectItem value="completed">복습 완료</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 items-center">
        <Button
          variant={showBookmarked ? "default" : "outline"}
          size="sm"
          onClick={() => setShowBookmarked(!showBookmarked)}
          className="flex items-center gap-1 h-8"
        >
          <BookmarkPlus className="h-4 w-4" />
          <span>북마크만</span>
        </Button>
        
        <Button
          variant={showImportant ? "default" : "outline"}
          size="sm"
          onClick={() => setShowImportant(!showImportant)}
          className="flex items-center gap-1 h-8"
        >
          <Star className="h-4 w-4" />
          <span>중요 문제만</span>
        </Button>
      </div>
      
      {(showBookmarked || showImportant || filterType !== 'all') && (
        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded">
          <AlertTriangle className="h-4 w-4" />
          <span>
            {showBookmarked && showImportant
              ? '북마크와 중요 표시된 문제만 표시 중'
              : showBookmarked
              ? '북마크 표시된 문제만 표시 중'
              : showImportant
              ? '중요 표시된 문제만 표시 중'
              : filterType === 'not-reviewed'
              ? '미복습 문제만 표시 중'
              : filterType === 'reviewing'
              ? '복습 중인 문제만 표시 중'
              : filterType === 'completed'
              ? '복습 완료된 문제만 표시 중'
              : ''}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowBookmarked(false);
              setShowImportant(false);
              setFilterType('all');
            }}
            className="h-6 px-2 ml-auto text-xs"
          >
            필터 초기화
          </Button>
        </div>
      )}
    </div>
  );
} 