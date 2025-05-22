import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, XCircle, Repeat, BookmarkPlus, BookmarkMinus, 
  Star, StarOff, CheckCircle2, Circle, RotateCcw, Save, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSWRConfig } from 'swr';
import { CommonImage } from '@/components/common/CommonImage';
import { getImageUrl } from '@/utils/image';
import { useToast } from '@/components/ui/use-toast';

interface WrongNoteItemProps {
  item: any;
  index: number;
  resultId: string;
  imageZoom: {
    showZoom: (url: string) => void;
  };
  onFlagChange: () => void;
}

export default function WrongNoteItem({ item, index, resultId, imageZoom, onFlagChange }: WrongNoteItemProps) {
  const { mutate } = useSWRConfig();
  const { toast } = useToast();
  
  // 재시도 상태
  const [retryMode, setRetryMode] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showRetryResult, setShowRetryResult] = useState(false);
  
  // 메모 상태
  const [memo, setMemo] = useState('');
  const [editMemo, setEditMemo] = useState(false);
  const [memoText, setMemoText] = useState('');
  
  // 북마크 및 중요 표시 상태
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isImportant, setIsImportant] = useState(false);
  
  // 복습 상태
  const [reviewStatus, setReviewStatus] = useState<number>(0); // 0: 미복습, 1: 복습 중, 2: 완료
  
  // 로딩 상태
  const [isLoading, setIsLoading] = useState({
    bookmark: false,
    important: false,
    memo: false,
    reviewStatus: false
  });
  
  // 초기 데이터 로드
  useEffect(() => {
    if (item?.questionId) {
      // 메모 로드
      fetchMemo();
      
      // 북마크/중요 플래그 로드
      fetchFlags();
      
      // 복습 상태 로드
      fetchReviewStatus();
    }
  }, [item?.questionId]);
  
  const fetchMemo = async () => {
    if (!item?.questionId) return;
    
    try {
      const res = await fetch(`/api/wrong-note/memo?questionId=${item.questionId}`, { credentials: 'include' });
      if (!res.ok) {
        console.error('메모 로드 API 오류:', res.status);
        return;
      }
      
      const data = await res.json();
      if (data?.memo) {
        setMemo(data.memo);
        setMemoText(data.memo);
      }
    } catch (error) {
      console.error('메모 로드 실패:', error);
    }
  };
  
  const fetchFlags = async () => {
    if (!item?.questionId) return;
    
    try {
      const res = await fetch(`/api/wrong-note/flag?questionId=${item.questionId}`, { credentials: 'include' });
      if (!res.ok) {
        console.error('플래그 로드 API 오류:', res.status);
        return;
      }
      
      const data = await res.json();
      setIsBookmarked(data?.flags?.isBookmarked || false);
      setIsImportant(data?.flags?.isImportant || false);
    } catch (error) {
      console.error('플래그 로드 실패:', error);
    }
  };
  
  const fetchReviewStatus = async () => {
    if (!item?.questionId) return;
    
    try {
      const res = await fetch(`/api/wrong-note/review-status?questionId=${item.questionId}`, { credentials: 'include' });
      if (!res.ok) {
        console.error('복습 상태 로드 API 오류:', res.status);
        return;
      }
      
      const data = await res.json();
      setReviewStatus(data?.status?.reviewStatus || 0);
    } catch (error) {
      console.error('복습 상태 로드 실패:', error);
    }
  };
  
  // 재시도 모드 토글
  const toggleRetryMode = () => {
    setRetryMode(!retryMode);
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
    if (selectedAnswer === null || !item?.questionId) return;
    
    setShowRetryResult(true);
    setIsLoading({...isLoading, reviewStatus: true});
    
    // 재시도 결과를 서버에 저장
    try {
      const isCorrect = selectedAnswer === item.correctAnswer;
      const res = await fetch('/api/wrong-note/review-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: item.questionId,
          isCorrect
        }),
        credentials: 'include'
      });
      
      if (!res.ok) {
        toast({
          title: "오류",
          description: "재시도 결과 저장에 실패했습니다.",
          variant: "error"
        });
        return;
      }
      
      // 복습 상태 다시 로드
      fetchReviewStatus();
    } catch (error) {
      console.error('재시도 결과 저장 실패:', error);
      toast({
        title: "오류",
        description: "재시도 결과 저장에 실패했습니다.",
        variant: "error"
      });
    } finally {
      setIsLoading({...isLoading, reviewStatus: false});
    }
  };
  
  // 메모 저장
  const saveMemo = async () => {
    if (!item?.questionId) return;
    
    setIsLoading({...isLoading, memo: true});
    try {
      const res = await fetch('/api/wrong-note/memo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: item.questionId,
          memo: memoText
        }),
        credentials: 'include'
      });
      
      if (!res.ok) {
        toast({
          title: "오류",
          description: "메모 저장에 실패했습니다.",
          variant: "error"
        });
        return;
      }
      
      setMemo(memoText);
      setEditMemo(false);
      mutate(`/api/wrong-note/${resultId}`);
      toast({
        title: "성공",
        description: "메모가 저장되었습니다.",
        variant: "success"
      });
    } catch (error) {
      console.error('메모 저장 실패:', error);
      toast({
        title: "오류",
        description: "메모 저장에 실패했습니다.",
        variant: "error"
      });
    } finally {
      setIsLoading({...isLoading, memo: false});
    }
  };
  
  // 북마크 토글
  const toggleBookmark = async () => {
    if (!item?.questionId) return;
    
    setIsLoading({...isLoading, bookmark: true});
    try {
      const res = await fetch('/api/wrong-note/flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: item.questionId,
          isBookmarked: !isBookmarked
        }),
        credentials: 'include'
      });
      
      if (!res.ok) {
        toast({
          title: "오류",
          description: "북마크 상태 변경에 실패했습니다.",
          variant: "error"
        });
        return;
      }
      
      setIsBookmarked(!isBookmarked);
      onFlagChange();
      toast({
        title: "성공",
        description: isBookmarked ? "북마크가 해제되었습니다." : "북마크가 추가되었습니다.",
        variant: "success"
      });
    } catch (error) {
      console.error('북마크 토글 실패:', error);
      toast({
        title: "오류",
        description: "북마크 상태 변경에 실패했습니다.",
        variant: "error"
      });
    } finally {
      setIsLoading({...isLoading, bookmark: false});
    }
  };
  
  // 중요 표시 토글
  const toggleImportant = async () => {
    if (!item?.questionId) return;
    
    setIsLoading({...isLoading, important: true});
    try {
      const res = await fetch('/api/wrong-note/flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: item.questionId,
          isImportant: !isImportant
        }),
        credentials: 'include'
      });
      
      if (!res.ok) {
        toast({
          title: "오류",
          description: "중요 표시 변경에 실패했습니다.",
          variant: "error"
        });
        return;
      }
      
      setIsImportant(!isImportant);
      onFlagChange();
      toast({
        title: "성공",
        description: isImportant ? "중요 표시가 해제되었습니다." : "중요 표시가 추가되었습니다.",
        variant: "success"
      });
    } catch (error) {
      console.error('중요 표시 토글 실패:', error);
      toast({
        title: "오류",
        description: "중요 표시 변경에 실패했습니다.",
        variant: "error"
      });
    } finally {
      setIsLoading({...isLoading, important: false});
    }
  };
  
  // 복습 상태 변경
  const changeReviewStatus = async (status: number) => {
    if (!item?.questionId) return;
    
    setIsLoading({...isLoading, reviewStatus: true});
    try {
      const res = await fetch('/api/wrong-note/review-status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: item.questionId,
          reviewStatus: status
        }),
        credentials: 'include'
      });
      
      if (!res.ok) {
        toast({
          title: "오류",
          description: "복습 상태 변경에 실패했습니다.",
          variant: "error"
        });
        return;
      }
      
      setReviewStatus(status);
    } catch (error) {
      console.error('복습 상태 변경 실패:', error);
      toast({
        title: "오류",
        description: "복습 상태 변경에 실패했습니다.",
        variant: "error"
      });
    } finally {
      setIsLoading({...isLoading, reviewStatus: false});
    }
  };
  
  // 복습 상태 라벨
  const getReviewStatusLabel = () => {
    switch(reviewStatus) {
      case 0: return '미복습';
      case 1: return '복습 중';
      case 2: return '복습 완료';
      default: return '미복습';
    }
  };
  
  // 복습 상태 아이콘
  const ReviewStatusIcon = () => {
    switch(reviewStatus) {
      case 0: return <Circle className="h-4 w-4" />;
      case 1: return <RotateCcw className="h-4 w-4" />;
      case 2: return <CheckCircle2 className="h-4 w-4" />;
      default: return <Circle className="h-4 w-4" />;
    }
  };

  // 정답 번호 안전하게 표시
  const getCorrectAnswerNumber = () => {
    if (item?.correctAnswer === undefined || item.correctAnswer === null || isNaN(item.correctAnswer)) {
      return '-';
    }
    return (item.correctAnswer + 1) + '번';
  };

  return (
    <Card key={item.questionId} className={cn(
      "mb-6 shadow-sm",
      isImportant ? "border-yellow-300" : "border-gray-200"
    )}>
      {/* 카드 헤더 */}
      <div className="p-4 pb-0 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">문제 {index+1}</span>
          <span className="text-orange-600 text-sm font-medium">
            (누적 오답: {item?.wrongCount || 0}회)
          </span>
          
          {/* 북마크 및 중요 표시 */}
          <div className="flex items-center">
            <button 
              onClick={toggleBookmark}
              className={cn(
                "p-1 rounded transition-colors",
                isBookmarked ? "text-blue-600 hover:text-blue-500" : "text-gray-400 hover:text-gray-600"
              )}
              disabled={isLoading.bookmark}
            >
              {isBookmarked ? <BookmarkMinus size={18} /> : <BookmarkPlus size={18} />}
            </button>
            
            <button 
              onClick={toggleImportant}
              className={cn(
                "p-1 rounded transition-colors",
                isImportant ? "text-yellow-500 hover:text-yellow-400" : "text-gray-400 hover:text-gray-600"
              )}
              disabled={isLoading.important}
            >
              {isImportant ? <Star size={18} /> : <StarOff size={18} />}
            </button>
          </div>
        </div>
        
        {/* 복습 상태 표시 */}
        <div className="flex items-center gap-2">
          <div className="relative group">
            <button 
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded text-xs",
                reviewStatus === 0 ? "bg-gray-100 text-gray-700" :
                reviewStatus === 1 ? "bg-blue-100 text-blue-700" :
                "bg-green-100 text-green-700"
              )}
              disabled={isLoading.reviewStatus}
            >
              <ReviewStatusIcon />
              <span>{getReviewStatusLabel()}</span>
            </button>
            
            {/* 복습 상태 변경 드롭다운 */}
            <div className="hidden group-hover:flex absolute top-full right-0 mt-1 bg-white shadow-md rounded border flex-col z-10 min-w-[120px]">
              <button 
                onClick={() => changeReviewStatus(0)} 
                className="flex items-center gap-1 px-3 py-2 text-xs hover:bg-gray-100"
                disabled={isLoading.reviewStatus}
              >
                <Circle className="h-3 w-3" />
                <span>미복습</span>
              </button>
              <button 
                onClick={() => changeReviewStatus(1)} 
                className="flex items-center gap-1 px-3 py-2 text-xs hover:bg-gray-100"
                disabled={isLoading.reviewStatus}
              >
                <RotateCcw className="h-3 w-3" />
                <span>복습 중</span>
              </button>
              <button 
                onClick={() => changeReviewStatus(2)} 
                className="flex items-center gap-1 px-3 py-2 text-xs hover:bg-gray-100"
                disabled={isLoading.reviewStatus}
              >
                <CheckCircle2 className="h-3 w-3" />
                <span>복습 완료</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <CardContent className="p-4">
        {/* 문제 내용 */}
        <div className="mb-4">
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{__html: item?.question || ''}} 
          />
          
          {/* 문제 이미지 */}
          {item?.images && item.images.length > 0 && (
            <div className="my-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {item.images.map((img: any, i: number) => {
                const imageUrl = getImageUrl(img?.url || img);
                if (!imageUrl) return null;
                return (
                  <CommonImage
                    key={`q-${item.questionId}-img-${i}`}
                    src={imageUrl}
                    alt={`문제이미지${i+1}`}
                    className="block max-w-full h-auto object-contain mx-auto border rounded"
                    containerClassName="max-w-[400px] max-h-[300px] flex items-center justify-center cursor-zoom-in"
                    maintainAspectRatio={true}
                    onClick={() => imageZoom.showZoom(imageUrl)}
                  />
                );
              })}
            </div>
          )}
        </div>
        
        {/* 보기 목록 (재시도 모드에 따라 다르게 표시) */}
        <div className="space-y-2 mb-4">
          {item?.options && Array.isArray(item.options) && item.options.map((opt: any, i: number) => {
            const isUser = i === item.userAnswer;
            const isCorrect = i === item.correctAnswer;
            const isSelected = i === selectedAnswer;
            
            return (
              <div
                key={i}
                className={cn(
                  "flex flex-col gap-1 p-3 rounded border cursor-pointer transition-colors",
                  // 재시도 모드가 아닐 때 스타일
                  !retryMode && isUser && !isCorrect && "bg-red-50 border-red-300",
                  !retryMode && isCorrect && "bg-green-50 border-green-300",
                  !retryMode && !isUser && !isCorrect && "border-gray-200 hover:bg-gray-50",
                  
                  // 재시도 모드일 때 스타일
                  retryMode && showRetryResult && isSelected && isCorrect && "bg-green-50 border-green-300",
                  retryMode && showRetryResult && isSelected && !isCorrect && "bg-red-50 border-red-300",
                  retryMode && showRetryResult && !isSelected && isCorrect && "bg-green-50 border-green-300",
                  retryMode && !showRetryResult && isSelected && "bg-blue-50 border-blue-300",
                  retryMode && !showRetryResult && !isSelected && "border-gray-200 hover:bg-gray-50"
                )}
                onClick={() => retryMode && handleSelectOption(i)}
              >
                <div className="flex items-start">
                  <span className="font-medium text-gray-700 mr-2">{i+1}.</span>
                  <span className="flex-1">{typeof opt === 'string' ? opt : opt?.text || ''}</span>
                  
                  {!retryMode && isUser && (
                    <span className={cn(
                      "text-xs font-medium px-1.5 py-0.5 rounded",
                      isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                      내 답
                    </span>
                  )}
                  
                  {!retryMode && isCorrect && !isUser && (
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                      정답
                    </span>
                  )}
                  
                  {retryMode && showRetryResult && isSelected && (
                    <span className={cn(
                      "text-xs font-medium px-1.5 py-0.5 rounded",
                      isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                      {isCorrect ? '정답' : '오답'}
                    </span>
                  )}
                  
                  {retryMode && showRetryResult && !isSelected && isCorrect && (
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                      정답
                    </span>
                  )}
                </div>
                
                {/* 보기 이미지 */}
                {opt?.images && Array.isArray(opt.images) && opt.images.length > 0 && (
                  <div className="ml-6 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {opt.images.map((img: any, j: number) => {
                      const imageUrl = getImageUrl(img?.url || img);
                      if (!imageUrl) return null;
                      return (
                        <CommonImage
                          key={`opt-${i}-img-${j}`}
                          src={imageUrl}
                          alt={`선택지${i+1}-${j+1}`}
                          className="block max-w-full h-auto object-contain mx-auto border rounded"
                          containerClassName="max-w-[300px] max-h-[200px] flex items-center justify-center cursor-zoom-in"
                          maintainAspectRatio={true}
                          onClick={() => imageZoom.showZoom(imageUrl)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* 재시도 버튼 영역 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {!retryMode ? (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleRetryMode}
              className="flex items-center gap-1"
            >
              <Repeat className="h-4 w-4" />
              <span>다시 풀어보기</span>
            </Button>
          ) : (
            <div className="flex flex-wrap gap-2">
              {!showRetryResult ? (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={checkRetryAnswer}
                    disabled={selectedAnswer === null || isLoading.reviewStatus}
                    className="flex items-center gap-1"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>확인하기</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleRetryMode}
                    className="flex items-center gap-1"
                    disabled={isLoading.reviewStatus}
                  >
                    <X className="h-4 w-4" />
                    <span>취소</span>
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleRetryMode}
                  className="flex items-center gap-1"
                >
                  <X className="h-4 w-4" />
                  <span>닫기</span>
                </Button>
              )}
            </div>
          )}
        </div>
        
        {/* 해설 */}
        <div className="bg-gray-50 p-3 md:p-4 rounded-md mb-4">
          <p className="text-sm font-semibold mb-1">정답: {getCorrectAnswerNumber()}</p>
          
          <div className="mb-2">
            <p className="text-sm font-semibold mb-1">해설:</p>
            <div className="prose prose-sm max-w-none text-sm" dangerouslySetInnerHTML={{__html: item?.explanation || ''}} />
          </div>
          
          {/* 해설 이미지 */}
          {item?.explanationImages && Array.isArray(item.explanationImages) && item.explanationImages.length > 0 && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {item.explanationImages.map((img: any, i: number) => {
                const imageUrl = getImageUrl(img?.url || img);
                if (!imageUrl) return null;
                return (
                  <CommonImage
                    key={`exp-${item.questionId}-img-${i}`}
                    src={imageUrl}
                    alt={`해설이미지${i+1}`}
                    className="block max-w-full h-auto object-contain mx-auto border rounded"
                    containerClassName="max-w-[400px] max-h-[300px] flex items-center justify-center cursor-zoom-in"
                    maintainAspectRatio={true}
                    onClick={() => imageZoom.showZoom(imageUrl)}
                  />
                );
              })}
            </div>
          )}
        </div>
        
        {/* 메모 */}
        <div className="border rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-700">메모</h4>
            {editMemo ? (
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={saveMemo}
                  className="h-7 w-7 p-0"
                  disabled={isLoading.memo}
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {setEditMemo(false); setMemoText(memo);}}
                  className="h-7 w-7 p-0"
                  disabled={isLoading.memo}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setEditMemo(true)}
                className="h-7 px-2 text-xs"
              >
                {memo ? '수정' : '추가'}
              </Button>
            )}
          </div>
          
          {editMemo ? (
            <Textarea
              value={memoText}
              onChange={(e) => setMemoText(e.target.value)}
              placeholder="이 문제에 대한 메모를 작성하세요..."
              className="h-24 text-sm"
              disabled={isLoading.memo}
            />
          ) : (
            <p className="text-sm text-gray-600 whitespace-pre-wrap min-h-[2rem]">
              {memo || '메모가 없습니다.'}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 