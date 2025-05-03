'use client';

import React from 'react';
import { Button } from "@/components/ui/button";

interface StudyPageHeaderProps {
  encodedExamName: string;
  encodedYear: string;
  encodedSession: string;
  isShowingAllAnswers: boolean;
  isShowingAllExplanations: boolean;
  isSingleViewMode: boolean;
  onToggleShowAllAnswers: () => void;
  onToggleShowAllExplanations: () => void;
  onToggleSingleViewMode: () => void;
  isShufflingEnabled: boolean;
  onToggleShuffle: () => void;
}

const StudyPageHeader: React.FC<StudyPageHeaderProps> = ({
  encodedExamName,
  encodedYear,
  encodedSession,
  isShowingAllAnswers,
  isShowingAllExplanations,
  isSingleViewMode,
  onToggleShowAllAnswers,
  onToggleShowAllExplanations,
  onToggleSingleViewMode,
  isShufflingEnabled,
  onToggleShuffle,
}) => {
  let examName = '';
  let year = '';
  let session = '';

  // 클라이언트 측에서 디코딩 시도 (오류 방지 포함)
  try {
    examName = decodeURIComponent(encodedExamName);
    year = decodeURIComponent(encodedYear);
    session = decodeURIComponent(encodedSession);
  } catch (e) {
    console.error("Error decoding params in StudyPageHeader:", e);
    // 디코딩 실패 시 원본 또는 기본값 표시 (선택 사항)
    examName = encodedExamName; 
    year = encodedYear;
    session = encodedSession;
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-100 rounded-lg shadow">
      <h1 className="text-lg md:text-xl font-bold text-gray-800 mb-2 sm:mb-0 flex-shrink min-w-0">
        {`${examName} · ${year}년 · ${session}`}
      </h1>
      <div className="flex flex-wrap items-center justify-start sm:justify-end gap-x-3 gap-y-2 mt-2 sm:mt-0 w-full sm:w-auto">
        <Button
          variant={isShufflingEnabled ? "default" : "outline"}
          size="sm"
          onClick={onToggleShuffle}
        >
          {isShufflingEnabled ? "선택지 섞기 해제" : "선택지 섞기"}
        </Button>
        <Button
          variant={isShowingAllAnswers ? "default" : "outline"}
          size="sm"
          onClick={onToggleShowAllAnswers}
        >
          {isShowingAllAnswers ? "정답 숨기기" : "정답 보며 학습"}
        </Button>
        <Button
          variant={isShowingAllExplanations ? "default" : "outline"}
          size="sm"
          onClick={onToggleShowAllExplanations}
        >
          {isShowingAllExplanations ? "해설 모두 숨기기" : "해설 보며 학습"}
        </Button>
        <Button
          variant={isSingleViewMode ? "default" : "outline"}
          size="sm"
          onClick={onToggleSingleViewMode}
        >
          {isSingleViewMode ? "전체 문제 보기" : "한 문제씩 보기"}
        </Button>
      </div>
    </div>
  );
};

export default StudyPageHeader; 