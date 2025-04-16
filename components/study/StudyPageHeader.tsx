'use client';

import React from 'react';

interface StudyPageHeaderProps {
  encodedExamName: string;
  encodedYear: string;
  encodedSession: string;
}

export default function StudyPageHeader({
  encodedExamName,
  encodedYear,
  encodedSession,
}: StudyPageHeaderProps) {
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
    // Combine header info into a single flex container with dot separators
    <div className="flex items-center space-x-2 mb-6 text-xl font-semibold text-gray-700">
      <span>{examName}</span>
      {/* Use dot separator */}
      <span className="text-gray-400 mx-1">·</span> 
      {/* Display year with '년' suffix */}
      <span>{year}년</span> 
      {/* Use dot separator */}
      <span className="text-gray-400 mx-1">·</span> 
      <span>{session}</span>
    </div>
  );
} 