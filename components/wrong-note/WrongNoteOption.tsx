import React from 'react';
import { CommonImage } from '@/components/common/CommonImage';

export function WrongNoteOption({
  opt, i, userAnswer, correctAnswer, retryMode, selectedAnswer, showRetryResult, onSelect, getSafeImageUrl
}: {
  opt: any;
  i: number;
  userAnswer: number|null|undefined;
  correctAnswer: number|null|undefined;
  retryMode: boolean;
  selectedAnswer: number|null;
  showRetryResult: boolean;
  onSelect?: (i: number) => void;
  getSafeImageUrl: (imgPath: string) => string;
}) {
  const isUser = userAnswer !== null && userAnswer !== undefined && userAnswer !== -1 && i === userAnswer;
  const isCorrect = i === correctAnswer;
  const isSelected = i === selectedAnswer;
  let optionClass = "flex flex-col gap-1 p-3 rounded border cursor-pointer transition-colors";
  if (!retryMode) {
    if (isUser && !isCorrect) optionClass += " bg-red-50 border-red-300";
    if (isCorrect) optionClass += " bg-green-50 border-green-300";
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
    <div className={optionClass} onClick={() => retryMode && onSelect?.(i)}>
      <div className="flex items-start">
        <span className="font-medium text-gray-700 mr-2">{i+1}.</span>
        <span className="flex-1">{typeof opt === 'string' ? opt : opt?.text || ''}</span>
        {!retryMode && isUser && (
          <span className={isCorrect ? 'text-xs font-medium px-1.5 py-0.5 rounded bg-green-100 text-green-700' : 'text-xs font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-700'}>
            내 답
          </span>
        )}
        {!retryMode && isCorrect && !isUser && (
          <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">정답</span>
        )}
        {retryMode && showRetryResult && isSelected && (
          <span className={isCorrect ? 'text-xs font-medium px-1.5 py-0.5 rounded bg-green-100 text-green-700' : 'text-xs font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-700'}>
            {isCorrect ? '정답' : '오답'}
          </span>
        )}
        {retryMode && showRetryResult && !isSelected && isCorrect && (
          <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">정답</span>
        )}
      </div>
      {opt?.images && Array.isArray(opt.images) && opt.images.length > 0 && (
        <div className="ml-6 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {opt.images.map((img: any, j: number) => {
            const imageUrl = getSafeImageUrl(img?.url || img);
            if (!imageUrl) return null;
            return (
              <CommonImage
                key={`opt-${i}-img-${j}`}
                src={imageUrl}
                alt={`선택지${i+1}-${j+1}`}
                className="block max-w-full h-auto object-contain mx-auto border rounded"
                onClick={() => {}}
              />
            );
          })}
        </div>
      )}
    </div>
  );
} 