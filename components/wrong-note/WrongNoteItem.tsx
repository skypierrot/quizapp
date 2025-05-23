import React from 'react';
import { Button } from '@/components/ui/button';
import { BookmarkPlus, BookmarkMinus, Star, StarOff, Repeat, CheckCircle, X, ChevronUp, MessageSquarePlus } from 'lucide-react';
import { useWrongNoteCard } from '@/components/wrong-note/useWrongNoteCard';
import { WrongNoteOption } from '@/components/wrong-note/WrongNoteOption';
import { CommonImage } from '@/components/common/CommonImage';
import { useOptionMemo } from '@/hooks/useOptionMemo';
import { OptionMemoUI } from '@/components/common/OptionMemoUI';

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

  return (
    <div className="p-4 border rounded bg-white mb-4">
      <div className="flex justify-between items-start mb-2">
        <div className="font-bold">Q{index+1}. <span dangerouslySetInnerHTML={{__html: item.question}} /></div>
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
            <CommonImage key={imgUrl} src={imgUrl} alt={`문제이미지${i+1}`} className="rounded border max-w-[120px] max-h-[120px]" onClick={() => imageZoom.showZoom(imgUrl)} />
          ))}
        </div>
      )}
      {/* 선택지/정답/오답/내 답 표시 */}
      <div className="space-y-2 mb-2">
        {item.options && Array.isArray(item.options) && item.options.map((opt: any, i: number) => (
          <div key={i} className="relative">
            <WrongNoteOption
              opt={opt}
              i={i}
              userAnswer={item.userAnswer}
              correctAnswer={item.correctAnswer}
              retryMode={retryMode}
              selectedAnswer={selectedAnswer}
              showRetryResult={showRetryResult}
              onSelect={handleSelectOption}
              getSafeImageUrl={getSafeImageUrl}
            />
            <OptionMemoUI optionIndex={i} {...optionMemo} />
          </div>
        ))}
        {/* 미응답 안내 */}
        {!retryMode && (item.userAnswer === null || item.userAnswer === undefined || item.userAnswer === -1) && (
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