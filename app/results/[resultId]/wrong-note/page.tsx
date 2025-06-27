"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, BarChart4, ArrowLeft } from "lucide-react";
import WrongNoteItem from "@/components/wrong-note/WrongNoteItem";
import WrongNoteStats from "@/components/wrong-note/WrongNoteStats";
import WrongNoteFilters from "@/components/wrong-note/WrongNoteFilters";
import { useImageZoom } from "@/hooks/useImageZoom";
import { ImageZoomModal } from "@/components/common/ImageZoomModal";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function WrongNotePage() {
  const params = useParams();
  const resultId = params?.resultId 
    ? (typeof params.resultId === 'string' 
      ? params.resultId 
      : Array.isArray(params.resultId) 
        ? params.resultId[0] 
        : '') 
    : '';
  const { data, isLoading, error, mutate: mutateWrongNote } = useSWR(`/api/wrong-note/${resultId}`, fetcher);
  const imageZoom = useImageZoom();
  const [activeTab, setActiveTab] = useState("problems");
  
  // 필터 상태
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    sortBy: "wrongCount",
    filterType: "all",
    showBookmarked: false,
    showImportant: false
  });
  
  // 추가 데이터 가져오기
  const { data: flagsData, mutate: mutateFlags } = useSWR('/api/wrong-note/flag/all', fetcher);
  const { data: reviewData, mutate: mutateReviewStatus } = useSWR('/api/wrong-note/review-status/all', fetcher);
  
  // 필터와 정렬을 적용한 아이템 업데이트
  useEffect(() => {
    if (!data || !data.wrongNote || !Array.isArray(data.wrongNote)) {
      setFilteredItems([]);
      return;
    }
    
    let items = [...data.wrongNote]; // 원본 데이터 복사
    
    // 북마크 필터 적용
    if (filters.showBookmarked) {
      if (flagsData?.flags) {
        const bookmarkedIds = Object.keys(flagsData.flags).filter(
          id => flagsData.flags[id].isBookmarked
        );
        // 북마크된 ID가 있는 경우에만 필터링, 없으면 모든 문제를 대상으로 다음 필터 진행
        if (bookmarkedIds.length > 0) {
          items = items.filter(item => bookmarkedIds.includes(item.questionId));
        } else {
          // 북마크 필터가 켜져있지만 북마크된 항목이 없으면, 결과는 빈 배열
          items = []; 
        }
      } else {
        // flagsData가 아직 로드되지 않았으면, 일단 북마크 필터는 무시하고 진행 (또는 로딩 처리)
        // 현재 로직에서는 flagsData가 없으면 북마크 필터링을 건너뛰게 되어있음.
        // 만약 flagsData 로딩 중일 때 빈 결과를 보여주고 싶지 않다면, flagsData 로딩 상태를 확인하는 로직 추가 필요.
      }
    }
    
    // 중요 표시 필터 적용 (북마크 필터와 유사하게 수정)
    if (filters.showImportant) {
      if (flagsData?.flags) {
        const importantIds = Object.keys(flagsData.flags).filter(
          id => flagsData.flags[id].isImportant
        );
        if (importantIds.length > 0) {
          items = items.filter(item => importantIds.includes(item.questionId));
        } else {
          // 중요 필터가 켜져있지만 중요 표시된 항목이 없으면, 결과는 빈 배열
          items = [];
        }
      } else {
        // flagsData가 아직 로드되지 않았으면, 중요 표시 필터는 무시하고 진행
      }
    }
    
    // 복습 상태 필터 적용
    if (filters.filterType !== 'all' && reviewData?.statusMap) {
      if (filters.filterType === 'not-reviewed') {
        items = items.filter(item => 
          !reviewData.statusMap[item.questionId] || 
          reviewData.statusMap[item.questionId].reviewStatus === 0
        );
      } else if (filters.filterType === 'reviewing') {
        items = items.filter(item => 
          reviewData.statusMap[item.questionId] && 
          reviewData.statusMap[item.questionId].reviewStatus === 1
        );
      } else if (filters.filterType === 'completed') {
        items = items.filter(item => 
          reviewData.statusMap[item.questionId] && 
          reviewData.statusMap[item.questionId].reviewStatus === 2
        );
      }
    }
    
    // 정렬 적용
    if (filters.sortBy === "wrongCount") {
      items.sort((a, b) => b.wrongCount - a.wrongCount);
    } else if (filters.sortBy === "wrongCountAsc") {
      items.sort((a, b) => a.wrongCount - b.wrongCount);
    } else if (filters.sortBy === "date") {
      items.sort((a, b) => new Date(b.lastWrongDate || 0).getTime() - new Date(a.lastWrongDate || 0).getTime());
    } else if (filters.sortBy === "dateAsc") {
      items.sort((a, b) => new Date(a.lastWrongDate || 0).getTime() - new Date(b.lastWrongDate || 0).getTime());
    }
    
    setFilteredItems(items);
  }, [data, filters, flagsData, reviewData]);
  
  // 필터 변경 핸들러
  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };
  
  const handleFlagChange = () => {
    mutateFlags();
  };
  
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-0 py-8 text-center">
        <div className="animate-pulse">
          <div className="h-10 bg-slate-200 rounded w-1/3 mx-auto mb-4"></div>
          <div className="h-36 bg-slate-200 rounded w-full mb-3"></div>
          <div className="h-36 bg-slate-200 rounded w-full mb-3"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-0 py-8 text-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          오류가 발생했습니다: {error.message}
        </div>
      </div>
    );
  }
  
  if (!data || !data.wrongNote || data.wrongNote.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-0 py-8 text-center">
        <div className="bg-yellow-50 text-yellow-600 p-8 rounded-md">
          <h3 className="text-xl font-bold mb-2">오답이 없습니다!</h3>
          <p className="mb-4">이 시험에서 모든 문제를 맞추셨거나 아직 응시 결과가 없습니다.</p>
          <Button asChild>
            <Link href={`/results/${resultId}`}>결과 페이지로 돌아가기</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-0 py-8">
      {/* 헤더 및 탭 */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">오답노트</h1>
          <Button asChild variant="outline" size="sm">
            <Link href={`/results/${resultId}`} className="flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              <span>결과로 돌아가기</span>
            </Link>
          </Button>
        </div>
        
        <Tabs defaultValue="problems" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="problems" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>문제 목록</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-1">
              <BarChart4 className="h-4 w-4" />
              <span>통계 및 분석</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="problems" className="pt-4">
            {/* 필터 */}
            <WrongNoteFilters onFilterChange={handleFilterChange} />
            
            {/* 문제 목록 */}
            <div className="space-y-6">
              {filteredItems.map((item, index) => (
                <WrongNoteItem 
                  key={item.questionId}
                  item={item}
                  index={index}
                  resultId={resultId}
                  imageZoom={imageZoom}
                />
              ))}
            </div>
            
            {filteredItems.length === 0 && (
              <div className="text-center py-8 bg-gray-50 rounded-md">
                <p className="text-gray-500">표시할 항목이 없습니다.</p>
                <p className="text-sm text-gray-400 mt-1">필터 조건을 변경하세요.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="stats" className="pt-4">
            <WrongNoteStats resultId={resultId} />
          </TabsContent>
        </Tabs>
      </div>
      
      <ImageZoomModal 
        imageUrl={imageZoom.zoomedImage} 
        onClose={imageZoom.closeZoom} 
      />
    </div>
  );
} 