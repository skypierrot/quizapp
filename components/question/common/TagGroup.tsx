import React from 'react'
import { BasicTagSettings } from './BasicTagSettings'
import { AdditionalTagInput } from './AdditionalTagInput'

// Option 타입 정의 (BasicTagSettings와 동일하게 사용하기 위해 필요)
interface Option {
  value: string;
  label: string;
}

interface TagGroupProps {
  // ExamName 관련
  examName: string;
  examNameOptions: Option[];
  onExamNameChange: (v: string) => void;
  onExamNameCreate: (v: string) => void;
  isLoadingExamNames: boolean;

  // Year 관련
  year: string;
  yearOptions: Option[];
  onYearChange: (v: string) => void;
  onYearCreate: (v: string) => void;
  isLoadingYears: boolean;
  isYearDisabled: boolean;
  isYearValid: boolean;

  // Subject 관련 (기존 session 대체 및 확장)
  subject: string;
  subjectOptions: Option[];
  onSubjectChange: (v: string) => void;
  onSubjectCreate: (v: string) => void;
  isLoadingSubjects: boolean;
  isSubjectDisabled: boolean;

  // AdditionalTagInput 관련
  tagInput: string;
  tags: string[];
  onTagInputChange: (v: string) => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

export function TagGroup({
  // ExamName
  examName,
  examNameOptions,
  onExamNameChange,
  onExamNameCreate,
  isLoadingExamNames,
  // Year
  year,
  yearOptions,
  onYearChange,
  onYearCreate,
  isLoadingYears,
  isYearDisabled,
  isYearValid,
  // Subject
  subject,
  subjectOptions,
  onSubjectChange,
  onSubjectCreate,
  isLoadingSubjects,
  isSubjectDisabled,
  // Additional Tags
  tagInput,
  tags,
  onTagInputChange,
  onAddTag,
  onRemoveTag
}: TagGroupProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col">
        <h3 className="text-base font-medium mb-2">태그 관리</h3>
        
        <BasicTagSettings
          examName={examName}
          examNameOptions={examNameOptions}
          onExamNameChange={onExamNameChange}
          onExamNameCreate={onExamNameCreate}
          isLoadingExamNames={isLoadingExamNames}
          
          date={year} // year를 date로 매핑
          onDateChange={onYearChange} // onYearChange를 onDateChange로 매핑
          isDateValid={isYearValid}
          isDateDisabled={isYearDisabled}
          
          year={year}
          yearOptions={yearOptions}
          onYearChange={onYearChange}
          onYearCreate={onYearCreate}
          isLoadingYears={isLoadingYears}
          isYearDisabled={isYearDisabled}

          subject={subject}
          subjectOptions={subjectOptions}
          onSubjectChange={onSubjectChange}
          onSubjectCreate={onSubjectCreate}
          isLoadingSubjects={isLoadingSubjects}
          isSubjectDisabled={isSubjectDisabled}
        />
        
        {!isYearValid && year && (
           <p className="text-xs text-red-500 mt-1 ml-1">년도는 4자리 숫자로 입력해주세요.</p>
        )}

        <AdditionalTagInput
          tagInput={tagInput}
          tags={tags}
          onTagInputChange={onTagInputChange}
          onAddTag={onAddTag}
          onRemoveTag={onRemoveTag}
        />
      </div>
    </div>
  )
} 