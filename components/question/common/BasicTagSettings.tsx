import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CascadingCombobox } from './CascadingCombobox'

interface Option {
  value: string;
  label: string;
}

interface BasicTagSettingsProps {
  examName: string
  examNameOptions: Option[]
  onExamNameChange: (value: string) => void
  onExamNameCreate: (value: string) => void
  isLoadingExamNames: boolean
  year: string
  yearOptions: Option[]
  onYearChange: (value: string) => void
  onYearCreate: (value: string) => void
  isLoadingYears: boolean
  isYearDisabled: boolean
  subject: string
  subjectOptions: Option[]
  onSubjectChange: (value: string) => void
  onSubjectCreate: (value: string) => void
  isLoadingSubjects: boolean
  isSubjectDisabled: boolean
}

export function BasicTagSettings({
  examName, examNameOptions, onExamNameChange, onExamNameCreate, isLoadingExamNames,
  year, yearOptions, onYearChange, onYearCreate, isLoadingYears, isYearDisabled,
  subject, subjectOptions, onSubjectChange, onSubjectCreate, isLoadingSubjects, isSubjectDisabled
}: BasicTagSettingsProps) {
  return (
    <div className="mb-4 p-3 border border-gray-200 rounded-md bg-gray-50">
      <div className="w-full">
        <h4 className="text-sm font-medium mb-2">기본 태그 설정</h4>
        <p className="text-xs text-gray-500 mb-3">
          <span className="text-red-500 font-bold">*</span> 표시는 필수 입력 항목입니다
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full items-end">
        <div className="space-y-1">
          <Label className="text-xs text-gray-500 block">
            시험명: <span className="text-red-500 font-bold">*</span>
          </Label>
          <CascadingCombobox
            options={examNameOptions}
            value={examName}
            onSelect={onExamNameChange}
            onCreate={onExamNameCreate}
            placeholder="시험명 선택 또는 생성"
            searchPlaceholder="시험명 검색..."
            emptyStateMessage="시험명을 찾을 수 없습니다."
            createLabel="새 시험명 생성"
            isLoading={isLoadingExamNames}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-500 block">
            년도: <span className="text-red-500 font-bold">*</span>
          </Label>
          <CascadingCombobox
            options={yearOptions}
            value={year}
            onSelect={onYearChange}
            onCreate={onYearCreate}
            placeholder="년도 선택 또는 생성"
            searchPlaceholder="년도 검색..."
            emptyStateMessage="년도를 찾을 수 없습니다."
            createLabel="새 년도 생성"
            disabled={isYearDisabled}
            isLoading={isLoadingYears}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-500 block">
            과목: <span className="text-red-500 font-bold">*</span>
          </Label>
          <CascadingCombobox
            options={subjectOptions}
            value={subject}
            onSelect={onSubjectChange}
            onCreate={onSubjectCreate}
            placeholder="과목 선택 또는 생성"
            searchPlaceholder="과목 검색..."
            emptyStateMessage="과목을 찾을 수 없습니다."
            createLabel="새 과목 생성"
            disabled={isSubjectDisabled}
            isLoading={isLoadingSubjects}
          />
        </div>
      </div>
    </div>
  )
} 