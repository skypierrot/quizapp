import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp, MessageSquarePlus, BookmarkPlus, BookmarkMinus, Star, StarOff, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { IQuestion, IOption } from '@/types';
import { useOptionMemo } from '@/hooks/useOptionMemo';
import { OptionMemoButton, OptionMemoContent } from '@/components/common/OptionMemoUI';
import { CommonImage } from '@/components/common/CommonImage';
import { getImageUrl } from "@/utils/image";

interface StudyQuestionCardProps {
  question: IQuestion;
  index: number;
  page?: number | undefined;
  // 선택지/정답/해설/이미지
  showAnswer?: boolean | undefined;
  showExplanation?: boolean | undefined;
  onOptionSelect?: ((optionIndex: number) => void) | undefined;
  userAnswer?: number | null | undefined;
  shuffledOptions?: IOption[] | undefined;
  shuffledAnswerIndex?: number | undefined;
  onImageZoom?: ((url: string) => void) | undefined;
  // 북마크/중요/다시풀기
  showBookmark?: boolean | undefined;
  isBookmarked?: boolean | undefined;
  onToggleBookmark?: (() => void) | undefined;
  showImportant?: boolean | undefined;
  isImportant?: boolean | undefined;
  onToggleImportant?: (() => void) | undefined;
  showRetry?: boolean | undefined;
  retryMode?: boolean | undefined;
  onRetryToggle?: (() => void) | undefined;
  // 문제별 메모
  showMemo?: boolean | undefined;
  memo?: string | undefined;
  editMode?: boolean | undefined;
  localEditMemo?: string | undefined;
  onEditMemo?: ((value: string) => void) | undefined;
  onSaveMemo?: (() => void) | undefined;
  onCancelEditMemo?: (() => void) | undefined;
  onStartEditMemo?: (() => void) | undefined;
  // 선택지별 메모
  showOptionMemo?: boolean | undefined;
  onToggleAnswer?: (() => void) | undefined;
}

export default function StudyQuestionCard({
  question, index, page,
  showAnswer, showExplanation, onOptionSelect, userAnswer, shuffledOptions, shuffledAnswerIndex, onImageZoom,
  showBookmark, isBookmarked, onToggleBookmark,
  showImportant, isImportant, onToggleImportant,
  showRetry, retryMode, onRetryToggle,
  showMemo, memo, editMode, localEditMemo, onEditMemo, onSaveMemo, onCancelEditMemo, onStartEditMemo,
  showOptionMemo,
  onToggleAnswer
}: StudyQuestionCardProps) {
  const optionsToDisplay = shuffledOptions && shuffledOptions.length > 0 ? shuffledOptions : question.options;
  const correctAnswerIndex = typeof shuffledAnswerIndex === 'number' && shuffledAnswerIndex !== -1 ? shuffledAnswerIndex : question.answer;
  const isDisplayingShuffled = !!(shuffledOptions && shuffledOptions.length > 0 && optionsToDisplay === shuffledOptions);
  const optionMemo = question.id ? useOptionMemo(question.id) : null;

  return (
    <div className="p-4 border rounded-lg bg-white shadow mb-4">
      <div className="flex justify-between items-start mb-2">
        <p className="text-xs text-gray-500">문제 {question.questionNumber !== undefined ? question.questionNumber : index + 1}{question.examDate ? ` (${question.examDate})` : ''}</p>
        {onToggleAnswer && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleAnswer}
            className="flex items-center gap-1 text-xs"
          >
            {showAnswer ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            <span className="hidden sm:inline">{showAnswer ? '정답 숨기기' : '정답 보기'}</span>
          </Button>
        )}
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
            <div key={img.hash || i} className="cursor-pointer border rounded overflow-hidden hover:opacity-80" onClick={() => onImageZoom && onImageZoom(getImageUrl(img.url))}>
              <CommonImage src={getImageUrl(img.url)} alt={`문제 ${question.questionNumber !== undefined ? question.questionNumber : index + 1} 이미지 ${i + 1}`} className="w-full h-auto object-contain max-h-40" containerClassName="w-full" />
            </div>
          ))}
        </div>
      )}
      {/* 선택지/정답/오답/내 답 표시 */}
      <div className="space-y-2 mb-2">
        {optionsToDisplay && optionsToDisplay.map((opt, i) => {
          const isSelected = userAnswer === i;
          const isCorrect = correctAnswerIndex === i;
          let optionStyle = "cursor-pointer hover:bg-blue-50 border-gray-300";
          if (showAnswer && isCorrect) {
            optionStyle = "ring-2 ring-green-500 border-green-500 bg-green-50";
          }
          if (isSelected) {
            if (showAnswer) {
              optionStyle = isCorrect ? "bg-green-100 border-green-500 text-green-800 font-semibold"
                                    : "bg-red-100 border-red-500 text-red-800 font-semibold";
            } else {
              optionStyle = "bg-blue-100 border-blue-500 text-blue-800 font-semibold";
            }
          }
          const displayOptionNumber = isDisplayingShuffled
            ? i + 1
            : (opt.number !== undefined ? opt.number + 1 : i + 1);
          return (
            <React.Fragment key={`q${question.id}-opt-${i}`}>
              <div className={`p-3 pr-10 my-2 border rounded-md transition-all duration-150 ${optionStyle} relative`} onClick={() => onOptionSelect && onOptionSelect(i)}>
                {optionMemo && <OptionMemoButton optionIndex={i} {...optionMemo} />}
                <span className="ml-2 mr-2 font-medium">{displayOptionNumber}.</span>
                {showAnswer && isSelected && !isCorrect && (
                  <span className="ml-1 text-xs font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-700">내 답</span>
                )}
                {showAnswer && isCorrect && (
                  <span className="ml-1 text-xs font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">정답</span>
                )}
                <span
                  className="flex-1 whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: opt.text || '',
                  }}
                />
                {opt.images && opt.images.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {opt.images.map((img: any, j: number) => (
                      <div key={img.hash || j} className="cursor-pointer border rounded overflow-hidden hover:opacity-80" onClick={(e) => { e.stopPropagation(); onImageZoom && onImageZoom(getImageUrl(img.url)); }}>
                        <CommonImage
                          src={getImageUrl(img.url)}
                          alt={`선택지 ${displayOptionNumber} 이미지 ${j + 1}`}
                          className="w-full h-auto object-contain max-h-32"
                          containerClassName="w-full"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {showOptionMemo && optionMemo && <OptionMemoContent optionIndex={i} {...optionMemo} />}
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
                <div key={img.hash || i} className="cursor-pointer border rounded overflow-hidden hover:opacity-80" onClick={() => onImageZoom && onImageZoom(getImageUrl(img.url))}>
                  <CommonImage
                    src={getImageUrl(img.url)}
                    alt={`해설이미지${i+1}`}
                    className="w-full h-auto object-contain max-h-40"
                    containerClassName="w-full"
                  />
                </div>
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