'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StudyPageHeaderProps {
  title: string;
  showAllAnswers: boolean;
  showAllExplanations: boolean;
  isSingleViewMode: boolean;
  onToggleShowAllAnswers: () => void;
  onToggleShowAllExplanations: () => void;
  onToggleSingleViewMode: () => void;
  isShuffled: boolean;
  onToggleShuffle: () => void;
  isQuestionsShuffled?: boolean;
  onToggleQuestionsShuffle?: () => void;
  currentQuestionNumber?: number;
  totalQuestions?: number;
  onPrev?: () => void;
  onNext?: () => void;
  showControls?: boolean;
  isQuestionsShuffleDisabled?: boolean;
  questionCount?: number | null;
  onQuestionCountChange?: (count: number | null) => void;
  isQuestionCountEnabled?: boolean;
  onToggleQuestionCount?: () => void;
}

const StudyPageHeader: React.FC<StudyPageHeaderProps> = ({
  title,
  showAllAnswers,
  showAllExplanations,
  isSingleViewMode,
  onToggleShowAllAnswers,
  onToggleShowAllExplanations,
  onToggleSingleViewMode,
  isShuffled,
  onToggleShuffle,
  isQuestionsShuffled,
  onToggleQuestionsShuffle,
  currentQuestionNumber,
  totalQuestions,
  onPrev,
  onNext,
  showControls = true,
  isQuestionsShuffleDisabled = false,
  questionCount,
  onQuestionCountChange,
  isQuestionCountEnabled = false,
  onToggleQuestionCount,
}) => {
  const [localQuestionCount, setLocalQuestionCount] = useState<string>(questionCount?.toString() || '');

  const handleQuestionCountChange = (value: string) => {
    setLocalQuestionCount(value);
    const numValue = parseInt(value);
    if (value === '') {
      onQuestionCountChange?.(null);
    } else if (!isNaN(numValue) && numValue > 0) {
      onQuestionCountChange?.(numValue);
    }
  };

  const handleToggleQuestionCount = () => {
    onToggleQuestionCount?.();
    if (!isQuestionCountEnabled) {
      setLocalQuestionCount(questionCount?.toString() || '10');
    } else {
      setLocalQuestionCount('');
    }
  };

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow mb-4">
        <div className="flex-shrink min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 truncate">
            {title}
          </h1>
        </div>
        {showControls && (
          <div className="flex flex-wrap items-center justify-start sm:justify-end gap-x-3 gap-y-2 mt-2 sm:mt-0 w-full sm:w-auto">
            {onToggleQuestionCount && (
              <div className="flex items-center gap-2">
                <Button
                  variant={isQuestionCountEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={handleToggleQuestionCount}
                >
                  {isQuestionCountEnabled ? "모든 문제" : "문제 수 설정"}
                </Button>
                {isQuestionCountEnabled && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="questionCount" className="text-sm whitespace-nowrap">
                      문제 수:
                    </Label>
                    <Input
                      id="questionCount"
                      type="number"
                      min="1"
                      max="1000"
                      value={localQuestionCount}
                      onChange={(e) => handleQuestionCountChange(e.target.value)}
                      className="w-20 h-8 text-sm"
                      placeholder="10"
                    />
                  </div>
                )}
              </div>
            )}
            {onToggleQuestionsShuffle && !isQuestionsShuffleDisabled && (
              <Button
                variant={isQuestionsShuffled ? "default" : "outline"}
                size="sm"
                onClick={onToggleQuestionsShuffle}
              >
                {isQuestionsShuffled ? "문제 순서대로" : "문제 섞기"}
              </Button>
            )}
            <Button
              variant={isShuffled ? "default" : "outline"}
              size="sm"
              onClick={onToggleShuffle}
            >
              {isShuffled ? "섞기 해제" : "선택지 섞기"}
            </Button>
            <Button
              variant={showAllAnswers ? "default" : "outline"}
              size="sm"
              onClick={onToggleShowAllAnswers}
            >
              {showAllAnswers ? "정답 모두 숨기기" : "정답 모두 보기"}
            </Button>
            <Button
              variant={showAllExplanations ? "default" : "outline"}
              size="sm"
              onClick={onToggleShowAllExplanations}
            >
              {showAllExplanations ? "해설 모두 숨기기" : "해설 모두 보기"}
            </Button>
            <Button
              variant={isSingleViewMode ? "default" : "outline"}
              size="sm"
              onClick={onToggleSingleViewMode}
            >
              {isSingleViewMode ? "전체 문제 보기" : "한 문제씩 보기"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyPageHeader; 