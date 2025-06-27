// 임시 수정 - 아코디언 스타일 적용
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import React from 'react';
import { Button } from '@/components/ui/button';
import { BookmarkPlus, BookmarkMinus, Star, StarOff, Repeat, CheckCircle, X, ChevronUp, MessageSquarePlus, Filter, Tag, FileText, Pencil } from 'lucide-react';
import { useWrongNoteCard } from '@/components/wrong-note/useWrongNoteCard';
import { WrongNoteOption } from '@/components/wrong-note/WrongNoteOption';
import { CommonImage } from '@/components/common/CommonImage';
import { useOptionMemo } from '@/hooks/useOptionMemo';
import { OptionMemoButton, OptionMemoContent } from '@/components/common/OptionMemoUI';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

interface WrongNoteItemProps {
  item: any;
  index: number;
  resultId: string;
  imageZoom: {
    showZoom: (url: string) => void;
  };
}

export default function WrongNoteItem({ item, index, resultId, imageZoom }: WrongNoteItemProps) {
  const {
    isBookmarked, setIsBookmarked,
    isImportant, setIsImportant,
    memo, setMemo,
    editMode, setEditMode,
    localEditMemo, setLocalEditMemo,
    retryMode, setRetryMode,
    selectedAnswer, setSelectedAnswer,
    showRetryResult, setShowRetryResult,
    getSafeImageUrl
  } = useWrongNoteCard(item);
  
  // 선택지별 메모 훅 사용
  const optionMemo = useOptionMemo(item.questionId);
  
  // 북마크/중요 토글
  const handleBookmark = async () => {
    setIsBookmarked((v: boolean) => !v);
    await fetch('/api/wrong-note/flag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: item.questionId, isBookmarked: !isBookmarked }),
    });
  };
  const handleImportant = async () => {
    setIsImportant((v: boolean) => !v);
    await fetch('/api/wrong-note/flag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: item.questionId, isImportant: !isImportant }),
    });
  };
  // 메모 저장
  const handleSaveMemo = async () => {
    setMemo(localEditMemo);
    setEditMode(false);
    await fetch('/api/wrong-note/memo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: item.questionId, memo: localEditMemo }),
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
    if (!showRetryResult) setSelectedAnswer(optionIndex);
  };
  // 재시도 결과 확인
  const checkRetryAnswer = async () => {
    if (selectedAnswer === null) return;
    setShowRetryResult(true);
  };
  // 정답 번호 표시
  const getCorrectAnswerNumber = () => {
    if (item?.correctAnswer === undefined || item.correctAnswer === null || isNaN(item.correctAnswer)) return '-';
    return (item.correctAnswer + 1) + '번';
  };
  
  // 이미지 렌더링
  const questionImages = (item.images || []).map(getSafeImageUrl);
  const explanationImages = (item.explanationImages || []).map(getSafeImageUrl);

  // 복습 상태 표시 함수
  const getReviewStatus = () => {
    // reviewCount가 없을 경우를 대비한 안전한 접근
    const reviewCount = item.reviewCount || 0;
    
    if (reviewCount > 3) return "완료";
    if (reviewCount > 0) return "진행중";
    return "미시작";
  };

  // 복습 상태에 따른 색상 클래스 반환
  const getReviewStatusClass = () => {
    const status = getReviewStatus();
    if (status === "완료") return "bg-green-100 text-green-700";
    if (status === "진행중") return "bg-blue-100 text-blue-700";
    return "bg-gray-100 text-gray-700";
  };

  // 시험 유형 (임의 값, 실제 데이터에 맞게 수정 필요)
  const examType = item.examType || "일반";

  return (
    <div className="p-4 border rounded bg-white mb-4">
      {/* 헤더 영역: 문제 번호와 툴바 */}
      <div className="mb-3">
        <div className="font-bold mb-2">Q{index+1}. <span dangerouslySetInnerHTML={{__html: item.question}} /></div>
        
        {/* 필터 및 상태 표시 영역 - 모바일에서는 드롭다운으로 변경 */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* 첫번째 그룹: 핵심 필터 */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* 북마크 토글 버튼 */}
            <button 
              onClick={handleBookmark} 
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${isBookmarked ? 'bg-gray-100 text-gray-700 border border-gray-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              title={isBookmarked ? '북마크 해제' : '북마크'}
            >
              {isBookmarked ? <BookmarkMinus className="w-3 h-3" /> : <BookmarkPlus className="w-3 h-3" />}
              <span className="hidden sm:inline">북마크</span>
            </button>
            
            {/* 중요 토글 버튼 */}
            <button 
              onClick={handleImportant} 
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${isImportant ? 'bg-gray-100 text-gray-700 border border-gray-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              title={isImportant ? '중요 해제' : '중요'}
            >
              {isImportant ? <Star className="w-3 h-3" /> : <StarOff className="w-3 h-3" />}
              <span className="hidden sm:inline">중요</span>
            </button>
            
            {/* 복습상태 표시 */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getReviewStatusClass()}`}>
              <Repeat className="w-3 h-3" />
              <span>{getReviewStatus()}</span>
            </div>
          </div>
          
          {/* 두번째 그룹: 정보성 태그 */}
          <div className="flex flex-wrap items-center gap-1.5 ml-auto">
            {/* 시험유형 */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-xs font-medium">
              <FileText className="w-3 h-3" />
              <span>{examType}</span>
            </div>
            
            {/* 태그 - 있을 경우에만 표시 */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-medium">
                <Tag className="w-3 h-3" />
                <span>{item.tags[0]}{item.tags.length > 1 ? ` +${item.tags.length - 1}` : ''}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {questionImages.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {questionImages.map((imgUrl: string, i: number) => (
            <CommonImage key={imgUrl} src={imgUrl} alt={`문제이미지${i+1}`} className="rounded border max-w-[120px] max-h-[120px]" onClick={() => imageZoom.showZoom(imgUrl)} />
          ))}
        </div>
      )}
      
      {/* 선택지/정답/오답/내 답 표시 - 메모 아이콘 위치 조정 */}
      <div className="space-y-2 mb-3">
        {item.options && Array.isArray(item.options) && item.options.map((opt: any, i: number) => (
          <React.Fragment key={i}>
            <div className="relative flex items-start p-3 rounded border cursor-pointer transition-colors">
              <div className="flex-shrink-0 mr-2 font-medium text-gray-700">{i+1}.</div>
              <div className="flex-1">{typeof opt === 'string' ? opt : opt?.text || ''}</div>
              
              {/* 정답/내답/오답 배지 - 별도 공간에 배치 */}
              <div className="flex-shrink-0 ml-3 flex items-center gap-2">
                  {!retryMode && item.userAnswer === i && i !== item.correctAnswer && (
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-700">내 답</span>
                  )}
                  {!retryMode && i === item.correctAnswer && (
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">정답</span>
                  )}
                
                {/* 선택지 메모 버튼 - 배지 오른쪽에 배치 */}
                {optionMemo && 
                    <OptionMemoButton optionIndex={i} {...optionMemo} />
                }
              </div>
            </div>
            <OptionMemoContent optionIndex={i} {...optionMemo} />
          </React.Fragment>
        ))}
        
        {/* 미응답 안내 */}
        {!retryMode && (item.userAnswer === null || item.userAnswer === undefined || item.userAnswer === -1) && (
          <p className="text-sm text-muted-foreground mt-2">⚠️ 답변을 선택하지 않았습니다.</p>
        )}
      </div>
      
      {/* 다시풀기/제출/정답보기 버튼 */}
      <div className="flex flex-wrap gap-2 mb-3">
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
      
      {/* 해설/정답/해설이미지 - 배경색 변경 */}
      <div className="bg-gray-100 p-3 rounded-md mb-3 border border-gray-200">
        <div className="mb-2">
          <p className="text-sm font-semibold mb-1">해설:</p>
          <div className="prose prose-sm max-w-none text-sm" dangerouslySetInnerHTML={{__html: item?.explanation || ''}} />
        </div>
        {explanationImages.length > 0 && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {explanationImages.map((imgUrl: string, i: number) => (
              <CommonImage
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
      <div className="mt-4 border border-gray-200 rounded-md">
        <div className="flex justify-between items-center border-b border-gray-200 p-2">
          <div className="flex items-center gap-1.5">
            <Pencil className="w-4 h-4 text-gray-600" />
            <span className="font-medium text-gray-700 text-sm">나의 메모</span>
          </div>
          {!editMode && (
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setEditMode(true)} 
              className="h-7 px-2 text-xs text-gray-600 hover:bg-gray-100"
            >
              수정
            </Button>
          )}
        </div>
        {editMode ? (
          <div className="p-3 space-y-2">
            <textarea
              value={localEditMemo}
              onChange={e => setLocalEditMemo(e.target.value)}
              className="w-full border border-gray-200 rounded p-2 text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
              rows={3}
              placeholder="이 문제에 대한 나만의 메모를 남겨보세요!"
            />
            <div className="flex gap-1 justify-end">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setEditMode(false)}
                className="h-7 px-2 text-xs"
              >
                취소
              </Button>
              <Button 
                size="sm" 
                onClick={handleSaveMemo}
                className="h-7 px-2 text-xs bg-gray-800 hover:bg-gray-900 text-white"
              >
                저장
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-3">
            <div
              className="text-sm text-gray-700 whitespace-pre-wrap min-h-[20px]"
              dangerouslySetInnerHTML={{
                __html: memo ? DOMPurify.sanitize(marked.parse(memo || '', { renderer: new marked.Renderer(), async: false })) : '<span class="text-gray-400">메모 없음</span>',
              }}
            />
            </div>
        )}
      </div>
    </div>
  );
} 