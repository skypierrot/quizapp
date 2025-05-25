import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp, MessageSquarePlus, BookmarkPlus, BookmarkMinus, Star, StarOff, RotateCcw } from 'lucide-react';
import { IQuestion, IOption } from '@/types';
import { useOptionMemo } from '@/hooks/useOptionMemo';
import { OptionMemoButton, OptionMemoContent } from '@/components/common/OptionMemoUI';
import { CommonImage } from '@/components/common/CommonImage';

interface StudyQuestionCardProps {
  question: IQuestion;
  index: number;
  // 선택지/정답/해설/이미지
  showAnswer?: boolean;
  showExplanation?: boolean;
  onOptionSelect?: (optionIndex: number) => void;
  userAnswer?: number | null;
  shuffledOptions?: IOption[];
  shuffledAnswerIndex?: number;
  onImageZoom?: (url: string) => void;
  // 북마크/중요/다시풀기
  showBookmark?: boolean;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  showImportant?: boolean;
  isImportant?: boolean;
  onToggleImportant?: () => void;
  showRetry?: boolean;
  retryMode?: boolean;
  onRetryToggle?: () => void;
  // 문제별 메모
  showMemo?: boolean;
  memo?: string;
  editMode?: boolean;
  localEditMemo?: string;
  onEditMemo?: (value: string) => void;
  onSaveMemo?: () => void;
  onCancelEditMemo?: () => void;
  onStartEditMemo?: () => void;
  // 선택지별 메모
  showOptionMemo?: boolean;
}

export default function StudyQuestionCard({
  question, index,
  showAnswer, showExplanation, onOptionSelect, userAnswer, shuffledOptions, shuffledAnswerIndex, onImageZoom,
  showBookmark, isBookmarked, onToggleBookmark,
  showImportant, isImportant, onToggleImportant,
  showRetry, retryMode, onRetryToggle,
  showMemo, memo, editMode, localEditMemo, onEditMemo, onSaveMemo, onCancelEditMemo, onStartEditMemo,
  showOptionMemo
}: StudyQuestionCardProps) {
  const optionsToDisplay = shuffledOptions && shuffledOptions.length > 0 ? shuffledOptions : question.options;
  const correctAnswerIndex = typeof shuffledAnswerIndex === 'number' && shuffledAnswerIndex !== -1 ? shuffledAnswerIndex : question.answer;
  const isDisplayingShuffled = !!(shuffledOptions && shuffledOptions.length > 0 && optionsToDisplay === shuffledOptions);
  const optionMemo = question.id ? useOptionMemo(question.id) : null;

  return (
    <div className="p-4 border rounded-lg bg-white shadow mb-4">
      <div className="flex justify-between items-start mb-2">
        <div className="font-bold">Q{index+1}. <span dangerouslySetInnerHTML={{__html: question.content}} /></div>
        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
          {showBookmark && (
            <button onClick={onToggleBookmark} className={isBookmarked ? 'text-blue-600' : 'text-gray-400'} title={isBookmarked ? '북마크 해제' : '북마크'}>
              {isBookmarked ? <BookmarkMinus className="w-5 h-5" /> : <BookmarkPlus className="w-5 h-5" />}
            </button>
          )}
          {showImportant && (
            <button onClick={onToggleImportant} className={isImportant ? 'text-yellow-500' : 'text-gray-400'} title={isImportant ? '중요 해제' : '중요'}>
              {isImportant ? <Star className="w-5 h-5" /> : <StarOff className="w-5 h-5" />}
            </button>
          )}
          {showRetry && (
            <button onClick={onRetryToggle} className={retryMode ? 'text-green-600' : 'text-gray-400'} title={retryMode ? '재시도 취소' : '다시풀기'}>
              <RotateCcw className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      {question.images && question.images.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {question.images.map((img: any, i: number) => (
            <CommonImage key={img.url || i} src={img.url} alt={`문제이미지${i+1}`} className="rounded border max-w-[120px] max-h-[120px]" onClick={() => onImageZoom && onImageZoom(img.url)} />
          ))}
        </div>
      )}
      {/* 선택지/정답/오답/내 답 표시 */}
      <div className="space-y-2 mb-2">
        {optionsToDisplay && optionsToDisplay.map((opt, i) => {
          let optionStyle = "cursor-pointer hover:bg-blue-50 border-gray-300";
          if (showAnswer && correctAnswerIndex === i) {
            optionStyle = "ring-2 ring-green-500 border-green-500 bg-green-50";
          }
          if (userAnswer === i) {
            if (showAnswer) {
              optionStyle = correctAnswerIndex === i ? "bg-green-100 border-green-500 text-green-800 font-semibold"
                : "bg-red-100 border-red-500 text-red-800 font-semibold";
            } else {
              optionStyle = "bg-blue-100 border-blue-500 text-blue-800 font-semibold";
            }
          }
          const displayOptionNumber = isDisplayingShuffled
            ? i + 1
            : (opt.number !== undefined ? opt.number + 1 : i + 1);
          return (
            <React.Fragment key={`q${question.id ?? 'noid'}-opt-${i}`}>
              <div className={`relative pr-10 flex items-center gap-2 p-3 my-2 border rounded-md transition-all duration-150 ${optionStyle}`} onClick={() => onOptionSelect && onOptionSelect(i)}>
                <span className="mr-1 font-medium">{displayOptionNumber}.</span>
                {/* 뱃지: 번호 오른쪽에 */}
                {showAnswer && userAnswer === i && correctAnswerIndex !== i && (
                  <span className="ml-1 text-xs font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-700">내 답</span>
                )}
                {showAnswer && correctAnswerIndex === i && (
                  <span className="ml-1 text-xs font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">정답</span>
                )}
                <span className="flex-1 whitespace-pre-wrap">{opt.text}</span>
                {opt.images && opt.images.length > 0 && (
                  <div className="ml-6 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {opt.images.map((img: any, j: number) => (
                      <CommonImage
                        key={`opt-${i}-img-${j}`}
                        src={img.url}
                        alt={`선택지${i+1}-${j+1}`}
                        className="block max-w-full h-auto object-contain mx-auto border rounded"
                        onClick={() => onImageZoom && onImageZoom(img.url)}
                      />
                    ))}
                  </div>
                )}
              </div>
              {showOptionMemo && optionMemo && <OptionMemoButton optionIndex={i} {...optionMemo} />}
            </React.Fragment>
          );
        })}
      </div>
      {/* 해설/정답/해설이미지 */}
      {showExplanation && (
        <div className="bg-gray-50 p-3 rounded mb-2">
          <div className="mb-2">
            <p className="text-sm font-semibold mb-1">해설:</p>
            <div className="prose prose-sm max-w-none text-sm" dangerouslySetInnerHTML={{__html: question?.explanation || ''}} />
          </div>
          {question.explanationImages && question.explanationImages.length > 0 && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {question.explanationImages.map((img: any, i: number) => (
                <CommonImage
                  key={img.url || i}
                  src={img.url}
                  alt={`해설이미지${i+1}`}
                  className="block max-w-full h-auto object-contain mx-auto border rounded"
                  onClick={() => onImageZoom && onImageZoom(img.url)}
                />
              ))}
            </div>
          )}
        </div>
      )}
      {/* 문제별 메모 */}
      {showMemo && (
        <div className="mt-4 border-2 border-blue-200 rounded bg-blue-50 p-3">
          <div className="font-semibold text-blue-700 mb-2 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487c.637-.637 1.671-.184 1.671.715V18a2 2 0 01-2 2H7a2 2 0 01-2-2V5.202c0-.899 1.034-1.352 1.671-.715l2.829 2.829a1 1 0 001.414 0l2.828-2.829z" /></svg>
            나의 메모
          </div>
          {editMode ? (
            <>
              <textarea
                value={localEditMemo}
                onChange={e => onEditMemo && onEditMemo(e.target.value)}
                className="w-full border rounded p-2 text-sm"
                rows={2}
                placeholder="이 문제에 대한 나만의 메모를 남겨보세요!"
              />
              <div className="flex gap-2 mt-1 justify-end">
                <button onClick={onSaveMemo} className="px-3 py-1 bg-blue-500 text-white rounded">저장</button>
                <button onClick={onCancelEditMemo} className="px-3 py-1 bg-gray-300 rounded">취소</button>
              </div>
            </>
          ) : (
            <>
              <div className="text-sm min-h-[2em]">{memo || <span className="text-gray-400">메모 없음</span>}</div>
              <div className="flex gap-2 mt-1 justify-end">
                <button onClick={onStartEditMemo} className="px-3 py-1 bg-gray-200 rounded">수정</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
} 