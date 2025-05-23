// 전역 타입 선언 추가
declare global {
  interface Window {
    APP_IMAGE_CACHE?: Map<string, string>;
  }
}

"use client";
import useSWR from "swr";
import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CommonImage } from "@/components/common/CommonImage";
import { useImageZoom } from "@/hooks/useImageZoom";
import { ImageZoomModal } from "@/components/common/ImageZoomModal";
import { getImageUrl } from "@/utils/image";
import { useSWRConfig } from 'swr';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, BarChart4, BookmarkPlus, BookmarkMinus, Star, StarOff, CheckCircle2, Circle, RotateCcw, ChevronUp, MessageSquarePlus } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import React from "react";
import { useOptionMemo } from '@/hooks/useOptionMemo';
import { OptionMemoUI } from '@/components/common/OptionMemoUI';

// 내부 개발 서버 기준 BASE_URL
const BASE_URL = "https://quizapp-dev";

const fetcher = (url: string) => fetch(url).then(res => res.json());

const periodList = [
  { value: "", label: "전체" },
  { value: "1m", label: "최근 1개월" },
  { value: "3m", label: "최근 3개월" },
  { value: "6m", label: "최근 6개월" },
];
const sortList = [
  { value: "wrongCount", label: "누적 오답순" },
  { value: "recent", label: "최신 오답순" },
];
const limitList = [
  { value: 10, label: "10개" },
  { value: 20, label: "20개" },
  { value: 50, label: "50개" },
];

function getSinceDate(period: string) {
  if (!period) return "";
  const now = new Date();
  if (period === "1m") now.setMonth(now.getMonth() - 1);
  if (period === "3m") now.setMonth(now.getMonth() - 3);
  if (period === "6m") now.setMonth(now.getMonth() - 6);
  return now.toISOString().slice(0, 10);
}

// 반응형 훅: useMediaQuery (간단 구현)
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) setMatches(media.matches);
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);
  return matches;
}

// 문제별 retry 상태 관리
function getInitialRetryState(questions: any[]) {
  const state: Record<string, { isRetry: boolean; retryAnswer: number|null; showResult: boolean }> = {};
  questions.forEach(q => {
    state[q.questionId] = { isRetry: false, retryAnswer: null, showResult: false };
  });
  return state;
}

function safeNumberDisplay(value: any, fallback: string = '-') {
  return typeof value === 'number' && !isNaN(value) ? value + 1 : fallback;
}

const SWR_CONFIG_NO_AUTO_REVALIDATE = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

export default function WrongNoteReviewQuizPage() {
  const { mutate } = useSWRConfig();
  const { toast } = useToast();
  const [examType, setExamType] = useState("");
  const [tag, setTag] = useState("");
  const [activeTab, setActiveTab] = useState<'problems'|'stats'>("problems");
  const [sortByTab, setSortByTab] = useState<'wrongCount'|'recent'>("wrongCount");
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [isFiltering, setIsFiltering] = useState(false);

  // 필터 상태
  const [filters, setFilters] = useState({
    sortBy: "wrongCount",
    filterType: "all",
    showBookmarked: false,
    showImportant: false
  });

  // API 데이터 가져오기
  const { data: wrongCountData, isLoading: loading1, error: error1 } = useSWR(
    `/api/wrong-note/review?sort=wrongCount&examType=${examType}&tag=${tag}`,
    fetcher,
    SWR_CONFIG_NO_AUTO_REVALIDATE
  );
  const { data: recentData, isLoading: loading2, error: error2 } = useSWR(
    `/api/wrong-note/review?sort=recent&examType=${examType}&tag=${tag}`,
    fetcher,
    SWR_CONFIG_NO_AUTO_REVALIDATE
  );
  const { data: flagsData, mutate: mutateFlags } = useSWR('/api/wrong-note/flag/all', fetcher);
  const { data: reviewData, mutate: mutateReviewStatus } = useSWR(
    '/api/wrong-note/review-status/all',
    fetcher,
    SWR_CONFIG_NO_AUTO_REVALIDATE
  );
  const { data: statsData } = useSWR(
    '/api/wrong-note/stats',
    fetcher,
    SWR_CONFIG_NO_AUTO_REVALIDATE
  );

  const imageZoom = useImageZoom();

  // 문제별 retry 상태
  const [retryState, setRetryState] = useState<Record<string, { isRetry: boolean; retryAnswer: number|null; showResult: boolean }>>({});
  // 문제별 정답보기 상태
  const [singleView, setSingleView] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);

  // 필터링된 문제 목록
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  
  // 이미지 URL 캐싱 - 컴포넌트가 다시 마운트되어도 캐시가 유지되도록 App 수준 캐시 도입
  const imageUrlCache = useMemo(() => {
    // 모듈 스코프 또는 앱 전역 캐시 활용 (브라우저 세션 동안 유지)
    if (typeof window !== 'undefined') {
      if (!window.APP_IMAGE_CACHE) {
        window.APP_IMAGE_CACHE = new Map<string, string>();
      }
      return window.APP_IMAGE_CACHE;
    }
    return new Map<string, string>();
  }, []);
  
  // 이미지 URL을 안전하게 가져오는 함수 (캐싱 적용)
  const getSafeImageUrl = useCallback((imgPath: string | null | undefined) => {
    if (!imgPath) return '';
    
    // 캐시에 있으면 캐시된 URL 반환
    if (imageUrlCache.has(imgPath)) {
      return imageUrlCache.get(imgPath) || '';
    }
    
    // 캐시에 없으면 URL 생성하고 캐싱
    const url = getImageUrl(imgPath);
    imageUrlCache.set(imgPath, url);
    return url;
  }, [imageUrlCache]);

  // 토스트 헬퍼 함수
  const showToast = (title: string, description: string, isError = false) => {
    toast({
      title,
      description,
      duration: isError ? 3000 : 1500, // 에러는 더 오래, 성공 알림은 더 짧게
    });
  };

  // 문제 데이터가 바뀔 때 retryState 초기화
  useEffect(() => {
    const questions = (sortByTab === 'wrongCount' ? wrongCountData?.review : recentData?.review) || [];
    setRetryState(getInitialRetryState(questions));
  }, [wrongCountData, recentData, sortByTab]);

  // 필터를 적용하여 문제 목록 필터링
  useEffect(() => {
    if (!wrongCountData?.review && !recentData?.review) {
      setFilteredItems([]);
      return;
    }
    let items = [...(sortByTab === 'wrongCount' ? wrongCountData?.review || [] : recentData?.review || [])];

    if (filters.showBookmarked) {
      items = items.filter((item: any) => item.isBookmarked);
    }
    if (filters.showImportant) {
      items = items.filter((item: any) => item.isImportant);
    }
    if (filters.filterType !== 'all') {
      if (filters.filterType === 'not-reviewed') {
        items = items.filter((item: any) => !item.reviewStatus || item.reviewStatus === 0);
      } else if (filters.filterType === 'reviewing') {
        items = items.filter((item: any) => item.reviewStatus === 1);
      } else if (filters.filterType === 'completed') {
        items = items.filter((item: any) => item.reviewStatus === 2);
      }
    }
    setFilteredItems(items);
  }, [wrongCountData, recentData, sortByTab, filters]);

  // 동적 필터 옵션 집계
  const [examTypeList, setExamTypeList] = useState<{ value: string, label: string }[]>([{ value: '', label: '전체' }]);
  const [tagList, setTagList] = useState<{ value: string, label: string }[]>([{ value: '', label: '전체 태그' }]);
  useEffect(() => {
    // 모든 문제 데이터에서 시험명/태그 집계
    const allQuestions = [
      ...(wrongCountData?.review || []),
      ...(recentData?.review || [])
    ];
    const examNames = Array.from(new Set(allQuestions.map(q => q.examName).filter(Boolean)));
    setExamTypeList([{ value: '', label: '전체' }, ...examNames.map(n => ({ value: n, label: n }))]);
    // 태그 집계(문제별 tags 배열이 있다고 가정, 없으면 무시)
    const tagSet = new Set<string>();
    allQuestions.forEach(q => {
      if (Array.isArray(q.tags)) q.tags.forEach((t: string) => tagSet.add(t));
    });
    setTagList([{ value: '', label: '전체 태그' }, ...Array.from(tagSet).map(t => ({ value: t, label: t }))]);
  }, [wrongCountData, recentData]);

  // 메모이제이션된 이미지 컴포넌트
  const MemoImage = React.memo(({ src, alt, className, onClick }: { 
    src: string; 
    alt: string; 
    className: string; 
    onClick?: () => void;
  }) => {
    // useEffect 프리로딩 로직 제거
    return (
      <CommonImage 
        src={src} 
        alt={alt} 
        className={className} 
        onClick={onClick} 
        loading="lazy"
      />
    );
  }, (prevProps, nextProps) => {
    return prevProps.src === nextProps.src;
  });

  // 문제 카드 컴포넌트
  function WrongNoteCard({ q, idx, imageZoom }: { q: any; idx: number; imageZoom: any }) {
    // 카드별 로컬 상태
    const [isBookmarked, setIsBookmarked] = useState(q.isBookmarked ?? false);
    const [isImportant, setIsImportant] = useState(q.isImportant ?? false);
    const [memo, setMemo] = useState(q.memo ?? '');
    const [editMode, setEditMode] = useState(false);
    const [localEditMemo, setLocalEditMemo] = useState(q.memo ?? '');
    // 오답노트 주요 기능 상태
    const [retryMode, setRetryMode] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showRetryResult, setShowRetryResult] = useState(false);

    // 선택지별 메모 훅 사용
    const optionMemo = useOptionMemo(q.questionId);

    // 북마크 토글
    const handleBookmark = async () => {
      setIsBookmarked((v: boolean) => !v);
      await fetch('/api/wrong-note/flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: q.questionId, isBookmarked: !isBookmarked }),
      });
    };

    // 중요 토글
    const handleImportant = async () => {
      setIsImportant((v: boolean) => !v);
      await fetch('/api/wrong-note/flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: q.questionId, isImportant: !isImportant }),
      });
    };

    // 메모 저장
    const handleSaveMemo = async () => {
      setMemo(localEditMemo);
      setEditMode(false);
      await fetch('/api/wrong-note/memo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: q.questionId, memo: localEditMemo }),
      });
    };

    // 다시풀기(재시도) 모드 토글
    const toggleRetryMode = () => {
      setRetryMode((v) => !v);
      setSelectedAnswer(null);
      setShowRetryResult(false);
    };

    // 재시도 옵션 선택
    const handleSelectOption = (optionIndex: number) => {
      if (!showRetryResult) {
        setSelectedAnswer(optionIndex);
      }
    };

    // 재시도 결과 확인
    const checkRetryAnswer = async () => {
      if (selectedAnswer === null) return;
      setShowRetryResult(true);
      // 서버에 결과 저장 필요시 fetch 호출 가능
    };

    // 이미지 렌더링
    const questionImages = useMemo(() => (q.images || []).map(getSafeImageUrl), [q.images]);
    const explanationImages = useMemo(() => (q.explanationImages || []).map(getSafeImageUrl), [q.explanationImages]);

    // 정답 번호 표시
    const getCorrectAnswerNumber = () => {
      if (q?.correctAnswer === undefined || q.correctAnswer === null || isNaN(q.correctAnswer)) return '-';
      return (q.correctAnswer + 1) + '번';
    };

    return (
      <div className="p-4 border rounded bg-white mb-4">
        <div className="flex justify-between items-start mb-2">
          <div className="font-bold">Q{idx+1}. <span dangerouslySetInnerHTML={{__html: q.question}} /></div>
          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
            <button onClick={handleBookmark} className={isBookmarked ? 'text-blue-600' : 'text-gray-400'} title={isBookmarked ? '북마크 해제' : '북마크'}>
              {isBookmarked ? <BookmarkMinus className="w-5 h-5" /> : <BookmarkPlus className="w-5 h-5" />}
            </button>
            <button onClick={handleImportant} className={isImportant ? 'text-yellow-500' : 'text-gray-400'} title={isImportant ? '중요 해제' : '중요'}>
              {isImportant ? <Star className="w-5 h-5" /> : <StarOff className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {questionImages.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {questionImages.map((imgUrl: string, i: number) => (
              <MemoImage key={imgUrl} src={imgUrl} alt={`문제이미지${i+1}`} className="rounded border max-w-[120px] max-h-[120px]" onClick={() => imageZoom.showZoom(imgUrl)} />
            ))}
          </div>
        )}
        {/* 선택지/정답/오답/내 답 표시 */}
        <div className="space-y-2 mb-2">
          {q.options && Array.isArray(q.options) && q.options.map((opt: any, i: number) => {
            const isUser = q.userAnswer !== null && q.userAnswer !== undefined && q.userAnswer !== -1 && i === q.userAnswer;
            const isCorrect = i === q.correctAnswer;
            const isSelected = i === selectedAnswer;
            const isAnswered = q.userAnswer !== null && q.userAnswer !== undefined && q.userAnswer !== -1;
            // 디버깅용 로그
            console.log('[선택지]', {
              i,
              isUser,
              isCorrect,
              qUserAnswer: q.userAnswer,
              qCorrectAnswer: q.correctAnswer,
              opt,
              retryMode,
              showRetryResult,
              selectedAnswer
            });
            // 스타일 결정
            let optionClass = "flex flex-col gap-1 p-3 rounded border cursor-pointer transition-colors";
            if (!retryMode) {
              if (isUser && !isCorrect) optionClass += " bg-red-50 border-red-300"; // 오답(내 답)
              if (isCorrect) optionClass += " bg-green-50 border-green-300"; // 정답
              if (!isUser && !isCorrect) optionClass += " border-gray-200 hover:bg-gray-50";
            }
            if (retryMode) {
              if (showRetryResult && isSelected && isCorrect) optionClass += " bg-green-50 border-green-300";
              if (showRetryResult && isSelected && !isCorrect) optionClass += " bg-red-50 border-red-300";
              if (showRetryResult && !isSelected && isCorrect) optionClass += " bg-green-50 border-green-300";
              if (!showRetryResult && isSelected) optionClass += " bg-blue-50 border-blue-300";
              if (!showRetryResult && !isSelected) optionClass += " border-gray-200 hover:bg-gray-50";
            }
            return (
              <div
                key={i}
                className={`${optionClass} relative`}
                onClick={() => retryMode && handleSelectOption(i)}
              >
                <div className="flex items-start">
                  <span className="font-medium text-gray-700 mr-2">{i+1}.</span>
                  <span className="flex-1">{typeof opt === 'string' ? opt : opt?.text || ''}</span>
                  <OptionMemoUI optionIndex={i} {...optionMemo} />
                  {/* 내 답/정답/오답 표시 */}
                  {!retryMode && isUser && (
                    <span className={
                      isCorrect
                        ? 'text-xs font-medium px-1.5 py-0.5 rounded bg-green-100 text-green-700'
                        : 'text-xs font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-700'
                    }>
                      내 답
                    </span>
                  )}
                  {!retryMode && isCorrect && !isUser && (
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">정답</span>
                  )}
                  {retryMode && showRetryResult && isSelected && (
                    <span className={
                      isCorrect
                        ? 'text-xs font-medium px-1.5 py-0.5 rounded bg-green-100 text-green-700'
                        : 'text-xs font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-700'
                    }>
                      {isCorrect ? '정답' : '오답'}
                    </span>
                  )}
                  {retryMode && showRetryResult && !isSelected && isCorrect && (
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">정답</span>
                  )}
                </div>
                {/* 선택지 이미지 */}
                {opt?.images && Array.isArray(opt.images) && opt.images.length > 0 && (
                  <div className="ml-6 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {opt.images.map((img: any, j: number) => {
                      const imageUrl = getSafeImageUrl(img?.url || img);
                      if (!imageUrl) return null;
                      return (
                        <MemoImage
                          key={`opt-${i}-img-${j}`}
                          src={imageUrl}
                          alt={`선택지${i+1}-${j+1}`}
                          className="block max-w-full h-auto object-contain mx-auto border rounded"
                          onClick={() => imageZoom.showZoom(imageUrl)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {/* 미응답 안내 */}
          {!retryMode && (q.userAnswer === null || q.userAnswer === undefined || q.userAnswer === -1) && (
            <p className="text-sm text-muted-foreground mt-2">⚠️ 답변을 선택하지 않았습니다.</p>
          )}
        </div>
        {/* 다시풀기/제출/정답보기 버튼 */}
        <div className="flex flex-wrap gap-2 mb-2">
          {!retryMode ? (
            <Button variant="outline" size="sm" onClick={toggleRetryMode} className="flex items-center gap-1">
              <span>다시 풀어보기</span>
            </Button>
          ) : (
            <div className="flex flex-wrap gap-2">
              {!showRetryResult ? (
                <>
                  <Button variant="default" size="sm" onClick={checkRetryAnswer} disabled={selectedAnswer === null} className="flex items-center gap-1">
                    <span>확인하기</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={toggleRetryMode} className="flex items-center gap-1">
                    <span>취소</span>
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={toggleRetryMode} className="flex items-center gap-1">
                  <span>닫기</span>
                </Button>
              )}
            </div>
          )}
        </div>
        {/* 해설/정답/해설이미지 */}
        <div className="bg-gray-50 p-3 rounded mb-2">
          <div className="mb-2">
            <p className="text-sm font-semibold mb-1">해설:</p>
            <div className="prose prose-sm max-w-none text-sm" dangerouslySetInnerHTML={{__html: q?.explanation || ''}} />
          </div>
          {explanationImages.length > 0 && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {explanationImages.map((imgUrl: string, i: number) => (
                <MemoImage
                  key={imgUrl}
                  src={imgUrl}
                  alt={`해설이미지${i+1}`}
                  className="block max-w-full h-auto object-contain mx-auto border rounded"
                  onClick={() => imageZoom.showZoom(imgUrl)}
                />
              ))}
            </div>
          )}
        </div>
        {/* 메모 */}
        <div className="mt-4 border-2 border-blue-200 rounded bg-blue-50 p-3">
          <div className="font-semibold text-blue-700 mb-2 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487c.637-.637 1.671-.184 1.671.715V18a2 2 0 01-2 2H7a2 2 0 01-2-2V5.202c0-.899 1.034-1.352 1.671-.715l2.829 2.829a1 1 0 001.414 0l2.828-2.829z" /></svg>
            나의 메모
          </div>
          {editMode ? (
            <>
              <textarea
                value={localEditMemo}
                onChange={e => setLocalEditMemo(e.target.value)}
                className="w-full border rounded p-2 text-sm"
                rows={2}
                placeholder="이 문제에 대한 나만의 메모를 남겨보세요!"
              />
              <div className="flex gap-2 mt-1 justify-end">
                <button onClick={handleSaveMemo} className="px-3 py-1 bg-blue-500 text-white rounded">저장</button>
                <button onClick={() => setEditMode(false)} className="px-3 py-1 bg-gray-300 rounded">취소</button>
              </div>
            </>
          ) : (
            <>
              <div className="text-sm min-h-[2em]">{memo || <span className="text-gray-400">메모 없음</span>}</div>
              <div className="flex gap-2 mt-1 justify-end">
                <button onClick={() => setEditMode(true)} className="px-3 py-1 bg-gray-200 rounded">수정</button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // 문제 리스트 카드
  function WrongNoteList({ data }: { data: any[] }) {
    if (!data || data.length === 0) return <div className="text-center p-4 bg-gray-50 rounded">문제가 없습니다.</div>;
    return (
      <div className="space-y-4">
        {data.map((q: any, idx: number) => (
          <WrongNoteCard
            key={q.questionId}
            q={q}
            idx={idx}
            imageZoom={imageZoom}
          />
        ))}
      </div>
    );
  }

  // 문제 데이터 준비
  const allQuestions = (sortByTab === 'wrongCount' ? wrongCountData?.review : recentData?.review) || [];
  const 문제수 = allQuestions.length;

  // 상단에 한 문제씩 보기 토글 및 네비게이션 버튼 추가
  const TopBar = (
    <div className="flex items-center gap-2 mb-4">
      <Button onClick={() => setSingleView(v => !v)}>
        {singleView ? '전체 문제 보기' : '한 문제씩 보기'}
      </Button>
      {singleView && 문제수 > 0 && (
        <span>{currentIdx + 1} / {문제수}</span>
      )}
    </div>
  );

  // 필터 변경 핸들러 
  const handleFilterChange = async (newFilters: any) => {
    setIsFiltering(true);
    setFilters(newFilters);
    
    // 약간의 지연을 주어 필터링 상태를 표시한 후 필터링이 완료되도록 함
    setTimeout(() => {
      setIsFiltering(false);
    }, 300);
  };

  // 필터 바 컴포넌트
  const FilterBar = () => {
    return (
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center">
            <span className="text-sm font-medium mr-2">정렬:</span>
            <select 
              value={filters.sortBy} 
              onChange={e => handleFilterChange({...filters, sortBy: e.target.value})}
              className="px-2 py-1 border rounded text-sm"
            >
              <option value="wrongCount">오답 횟수 (많은순)</option>
              <option value="wrongCountAsc">오답 횟수 (적은순)</option>
              <option value="date">날짜 (최신순)</option>
              <option value="dateAsc">날짜 (오래된순)</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <span className="text-sm font-medium mr-2">복습상태:</span>
            <select 
              value={filters.filterType} 
              onChange={e => handleFilterChange({...filters, filterType: e.target.value})}
              className="px-2 py-1 border rounded text-sm"
            >
              <option value="all">전체 보기</option>
              <option value="not-reviewed">미복습</option>
              <option value="reviewing">복습 중</option>
              <option value="completed">복습 완료</option>
            </select>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center">
            <span className="text-sm font-medium mr-2">시험유형:</span>
            <select 
              value={examType} 
              onChange={e => {
                setIsFiltering(true);
                setExamType(e.target.value);
                setTimeout(() => setIsFiltering(false), 300);
              }}
              className="px-2 py-1 border rounded text-sm"
            >
              {examTypeList.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center">
            <span className="text-sm font-medium mr-2">태그:</span>
            <select 
              value={tag} 
              onChange={e => {
                setIsFiltering(true);
                setTag(e.target.value);
                setTimeout(() => setIsFiltering(false), 300);
              }}
              className="px-2 py-1 border rounded text-sm"
            >
              {tagList.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
          <Button
            variant={filters.showBookmarked ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange({...filters, showBookmarked: !filters.showBookmarked})}
            className={`flex items-center gap-1 h-8 transition-colors duration-150 ${
              filters.showBookmarked ? 'bg-blue-100 hover:bg-blue-200 border-blue-300' : ''
            }`}
          >
            {filters.showBookmarked ? (
              <BookmarkMinus className="h-4 w-4 text-blue-600" />
            ) : (
              <BookmarkPlus className="h-4 w-4" />
            )}
            <span>북마크{filters.showBookmarked ? ' 해제' : '만'}</span>
          </Button>
          
          <Button
            variant={filters.showImportant ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange({...filters, showImportant: !filters.showImportant})}
            className={`flex items-center gap-1 h-8 transition-colors duration-150 ${
              filters.showImportant ? 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300' : ''
            }`}
          >
            {filters.showImportant ? (
              <StarOff className="h-4 w-4 text-yellow-600" />
            ) : (
              <Star className="h-4 w-4" />
            )}
            <span>중요 문제{filters.showImportant ? ' 해제' : '만'}</span>
          </Button>
        </div>
        
        {(filters.showBookmarked || filters.showImportant || filters.filterType !== 'all' || examType || tag) && (
          <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded">
            <span>
              필터 적용 중: 
              {filters.showBookmarked ? ' 북마크' : ''}
              {filters.showImportant ? ' 중요' : ''}
              {filters.filterType !== 'all' ? (
                filters.filterType === 'not-reviewed' ? ' 미복습' :
                filters.filterType === 'reviewing' ? ' 복습 중' : ' 복습 완료'
              ) : ''}
              {examType ? ` ${examTypeList.find(e => e.value === examType)?.label}` : ''}
              {tag ? ` ${tag}` : ''}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsFiltering(true);
                setFilters({
                  sortBy: "wrongCount",
                  filterType: "all",
                  showBookmarked: false,
                  showImportant: false
                });
                setExamType("");
                setTag("");
                setTimeout(() => setIsFiltering(false), 300);
              }}
              className="h-6 px-2 ml-auto text-xs hover:bg-blue-100 transition-colors duration-150"
            >
              필터 초기화
            </Button>
          </div>
        )}
      </div>
    );
  };
  
  // 통계 컴포넌트
  const StatsView = () => {
    if (!statsData) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p>통계를 불러오는 중입니다...</p>
        </div>
      );
    }
    
    const { overview, reviewProgress, topWrongTags, examTypeStats, dailyWrongStats } = statsData;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* 종합 통계 */}
        <div className="p-4 border rounded bg-white">
          <h3 className="text-lg font-bold mb-2">오답 종합 통계</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-gray-600 mb-1">전체 문제 수</span>
              <span className="text-2xl font-bold text-blue-600">{overview?.totalQuestions || 0}</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-red-50 rounded-lg">
              <span className="text-sm text-gray-600 mb-1">총 오답 수</span>
              <span className="text-2xl font-bold text-red-600">{overview?.totalWrongAnswers || 0}</span>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">오답률</span>
              <span className="text-sm font-medium">{overview?.wrongPercentage || 0}%</span>
            </div>
            <Progress 
              value={overview?.wrongPercentage || 0} 
              className="h-2 bg-gray-100" 
            />
          </div>
          
          <div className="mt-4">
            <span className="text-sm font-medium">복습 현황</span>
            <div className="mt-2 flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <div className="flex flex-col items-center">
                <Circle className="h-4 w-4 text-gray-400 mb-1" />
                <span className="text-xs text-gray-600">미복습</span>
                <span className="text-lg font-medium">{reviewProgress?.notStarted || 0}</span>
              </div>
              <div className="flex flex-col items-center">
                <RotateCcw className="h-4 w-4 text-blue-500 mb-1" />
                <span className="text-xs text-gray-600">복습 중</span>
                <span className="text-lg font-medium">{reviewProgress?.inProgress || 0}</span>
              </div>
              <div className="flex flex-col items-center">
                <CheckCircle2 className="h-4 w-4 text-green-500 mb-1" />
                <span className="text-xs text-gray-600">완료</span>
                <span className="text-lg font-medium">{reviewProgress?.completed || 0}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* 자주 틀리는 태그 */}
        <div className="p-4 border rounded bg-white">
          <h3 className="text-lg font-bold mb-2">취약 부분 분석</h3>
          {topWrongTags && topWrongTags.length > 0 ? (
            <div className="space-y-3">
              {topWrongTags.map((tag: any) => (
                <div key={tag.tag} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{tag.tag}</span>
                    <span className="text-xs text-gray-500">
                      {tag.wrongCount}회 / {tag.totalCount}문제
                    </span>
                  </div>
                  <Progress
                    value={tag.percentage}
                    className="h-2 bg-gray-100"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <p>아직 데이터가 충분하지 않습니다.</p>
            </div>
          )}
        </div>
        
        {/* 시험별 오답 분석 */}
        <div className="p-4 border rounded bg-white">
          <h3 className="text-lg font-bold mb-2">시험별 오답 현황</h3>
          {examTypeStats && examTypeStats.length > 0 ? (
            <div className="space-y-3">
              {examTypeStats.map((exam: any) => (
                <div key={exam.examName} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium truncate max-w-[180px]">{exam.examName}</span>
                    <span className="text-xs text-gray-500">
                      {exam.wrongCount}회 / {exam.totalQuestions}문제
                    </span>
                  </div>
                  <Progress
                    value={exam.percentage}
                    className="h-2 bg-gray-100"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <p>아직 데이터가 충분하지 않습니다.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 모바일/데스크탑 공통 렌더링 (return문 한 번만 사용)
  return (
    <div className="max-w-2xl mx-auto py-8">
      <Tabs value={activeTab} onValueChange={(val: string) => setActiveTab(val as 'problems' | 'stats')}>
        <TabsList className="w-full mb-4">
          <TabsTrigger value="problems" className="flex-1">
            <FileText className="h-4 w-4 mr-2" />
            문제 보기
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex-1">
            <BarChart4 className="h-4 w-4 mr-2" />
            통계 및 분석
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="problems">
          {/* 한 문제씩 보기 토글 */}
          <div className="mb-4">
            <Button 
              onClick={() => setSingleView(v => !v)}
              className="transition-all duration-150 hover:shadow-md"
            >
              {singleView ? '전체 문제 보기' : '한 문제씩 보기'}
            </Button>
          </div>
          
          {/* 필터 바 */}
          <FilterBar />
          
          {/* 정렬 탭 */}
          <div className="flex mb-4 border-b">
            <button 
              className={`flex-1 py-2 transition-all duration-150 ${sortByTab === 'wrongCount' ? 'font-bold border-b-2 border-blue-500' : 'hover:bg-gray-50'}`} 
              onClick={() => setSortByTab('wrongCount')}
            >
              누적 오답순
            </button>
            <button 
              className={`flex-1 py-2 transition-all duration-150 ${sortByTab === 'recent' ? 'font-bold border-b-2 border-blue-500' : 'hover:bg-gray-50'}`} 
              onClick={() => setSortByTab('recent')}
            >
              최신 오답순
            </button>
          </div>
          
          {/* 필터링 중 로딩 인디케이터 */}
          {isFiltering && (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent"></div>
              <span className="ml-2 text-sm text-gray-600">필터 적용 중...</span>
            </div>
          )}
          
          {/* 문제 목록 또는 한 문제씩 보기 */}
          {!isFiltering && (singleView ? (
            filteredItems.length === 0 ? 
            <div className="text-center p-4 bg-gray-50 rounded">문제가 없습니다.</div> : 
            <>
              <WrongNoteCard 
                q={filteredItems[currentIdx]} 
                idx={currentIdx} 
                imageZoom={imageZoom}
              />
              <div className="mt-8 flex justify-between items-center">
                <Button
                  onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                  disabled={currentIdx === 0}
                  variant="outline"
                  className="transition-all duration-150 hover:shadow"
                >
                  이전 문제
                </Button>
                <span className="text-gray-700 font-medium">
                  {currentIdx + 1} / {filteredItems.length}
                </span>
                <Button
                  onClick={() => setCurrentIdx(i => Math.min(filteredItems.length - 1, i + 1))}
                  disabled={currentIdx === filteredItems.length - 1}
                  variant="outline"
                  className="transition-all duration-150 hover:shadow"
                >
                  다음 문제
                </Button>
              </div>
            </>
          ) : (
            loading1 || loading2 ? 
            <div className="text-center p-4">
              <div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent mx-auto mb-2"></div>
              <p>로딩 중...</p>
            </div> : 
            error1 || error2 ? 
            <div className="bg-red-50 p-4 rounded">에러: {(error1 || error2)?.message}</div> : 
            <WrongNoteList data={filteredItems} />
          ))}
        </TabsContent>
        
        <TabsContent value="stats">
          <StatsView />
        </TabsContent>
      </Tabs>
      
      <ImageZoomModal imageUrl={imageZoom.zoomedImage} onClose={imageZoom.closeZoom} />
    </div>
  );
}