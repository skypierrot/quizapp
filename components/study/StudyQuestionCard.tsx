import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp, MessageSquarePlus } from 'lucide-react';
import { IQuestion, IOption } from '@/types';
import { useOptionMemo } from '@/hooks/useOptionMemo';
import { OptionMemoUI } from '@/components/common/OptionMemoUI';

interface StudyQuestionCardProps {
  question: IQuestion;
  index: number;
  page?: number;
  onImageZoom: (url: string) => void;
  showAnswer?: boolean;
  showExplanation?: boolean;
  onOptionSelect?: (optionIndex: number) => void;
  userAnswer?: number | null;
  shuffledOptions?: IOption[];
  shuffledAnswerIndex?: number;
}

export default function StudyQuestionCard({ question, index, page, onImageZoom, showAnswer, showExplanation, onOptionSelect, userAnswer, shuffledOptions, shuffledAnswerIndex }: StudyQuestionCardProps) {
  // ... 기존 코드 ...
  const [optionsMemoText, setOptionsMemoText] = React.useState<Record<number, string | null>>({});
  const [editingOptionMemo, setEditingOptionMemo] = React.useState<Record<number, { localEditText: string }> | null>(null);
  const [showOptionMemoUI, setShowOptionMemoUI] = React.useState<Record<number, boolean>>({});
  const [loadingOptionMemo, setLoadingOptionMemo] = React.useState<Record<number, boolean>>({});

  const fetchOptionMemo = async (optionIndex: number) => {
    if (loadingOptionMemo[optionIndex] || optionsMemoText[optionIndex] !== undefined) return;
    setLoadingOptionMemo(prev => ({ ...prev, [optionIndex]: true }));
    try {
      const response = await fetch(`/api/wrong-note/option-memo?questionId=${question.id}&optionIndex=${optionIndex}`);
      if (!response.ok) {
        if (response.status === 404) {
          setOptionsMemoText(prev => ({ ...prev, [optionIndex]: '' }));
          return;
        }
        throw new Error('Failed to fetch option memo');
      }
      const data = await response.json();
      setOptionsMemoText(prev => ({ ...prev, [optionIndex]: data.memo || '' }));
    } catch {
      setOptionsMemoText(prev => ({ ...prev, [optionIndex]: '' }));
    } finally {
      setLoadingOptionMemo(prev => ({ ...prev, [optionIndex]: false }));
    }
  };
  const handleToggleOptionMemoUI = (optionIndex: number) => {
    const newShowState = !showOptionMemoUI[optionIndex];
    setShowOptionMemoUI(prev => ({ ...prev, [optionIndex]: newShowState }));
    if (newShowState && optionsMemoText[optionIndex] === undefined) {
      fetchOptionMemo(optionIndex);
    }
  };
  const handleEditOptionMemo = (optionIndex: number) => {
    setEditingOptionMemo({ [optionIndex]: { localEditText: optionsMemoText[optionIndex] || '' } });
  };
  const handleCancelEditOptionMemo = (optionIndex: number) => {
    setEditingOptionMemo(null);
  };
  const handleSaveOptionMemo = async (optionIndex: number) => {
    if (!editingOptionMemo || editingOptionMemo[optionIndex] === undefined) return;
    const memoToSave = editingOptionMemo[optionIndex].localEditText;
    setOptionsMemoText(prev => ({ ...prev, [optionIndex]: memoToSave }));
    setEditingOptionMemo(null);
    await fetch('/api/wrong-note/option-memo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: question.id, optionIndex, memo: memoToSave }),
    });
  };

  // 기존 선택지 렌더링 로직 (props에서 optionsToDisplay, displayOptionNumber, optionStyle 등은 기존 코드와 동일하게 유지)
  const optionsToDisplay = shuffledOptions && shuffledOptions.length > 0 ? shuffledOptions : question.options;
  const correctAnswerIndex = typeof shuffledAnswerIndex === 'number' && shuffledAnswerIndex !== -1 ? shuffledAnswerIndex : question.answer;
  const isDisplayingShuffled = !!(shuffledOptions && shuffledOptions.length > 0 && optionsToDisplay === shuffledOptions);

  // 선택지별 메모 훅 사용 (id가 있을 때만)
  const optionMemo = question.id ? useOptionMemo(question.id) : null;

  return (
    <div className="p-4 border rounded-lg bg-white shadow mb-4">
      {/* ... 기존 문제/이미지/설명 렌더링 ... */}
      {optionsToDisplay && optionsToDisplay.map((opt, i) => {
        // ... 기존 코드 ...
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
          <div key={`q${question.id ?? 'noid'}-opt-${i}`} className={`p-3 pr-10 my-2 border rounded-md transition-all duration-150 ${optionStyle} relative`} onClick={() => onOptionSelect && onOptionSelect(i)}>
            <span className="mr-2 font-medium">{displayOptionNumber}.</span>
            <span className="whitespace-pre-wrap">{opt.text}</span>
            {/* 기존 이미지 렌더링 ... */}
            {optionMemo && <OptionMemoUI optionIndex={i} {...optionMemo} />}
          </div>
        );
      })}
    </div>
  );
} 