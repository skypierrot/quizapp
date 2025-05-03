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
  session: string
  sessionOptions: Option[]
  onSessionChange: (value: string) => void
  onSessionCreate: (value: string) => void
  isLoadingSessions: boolean
  isSessionDisabled: boolean
  subject: string
  onSubjectChange: (value: string) => void
}

export function BasicTagSettings({
  examName, examNameOptions, onExamNameChange, onExamNameCreate, isLoadingExamNames,
  year, yearOptions, onYearChange, onYearCreate, isLoadingYears, isYearDisabled,
  session, sessionOptions, onSessionChange, onSessionCreate, isLoadingSessions, isSessionDisabled,
  subject, onSubjectChange
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
            회차: <span className="text-red-500 font-bold">*</span>
          </Label>
          <CascadingCombobox
            options={sessionOptions}
            value={session}
            onSelect={onSessionChange}
            onCreate={onSessionCreate}
            placeholder="회차 선택 또는 생성"
            searchPlaceholder="회차 검색..."
            emptyStateMessage="회차를 찾을 수 없습니다."
            createLabel="새 회차 생성"
            disabled={isSessionDisabled}
            isLoading={isLoadingSessions}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-500 block">과목:</Label>
          <Input
            type="text"
            placeholder="과목 입력 (선택)"
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            className="h-8 text-sm w-full"
          />
        </div>
      </div>
    </div>
  )
} 