import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import React from 'react'

interface BasicTagSettingsProps {
  examName: string
  year: string
  isYearValid: boolean
  session: string
  subject: string
  onExamNameChange: (v: string) => void
  onYearChange: (v: string) => void
  onSessionChange: (v: string) => void
  onSubjectChange: (v: string) => void
}

export function BasicTagSettings({
  examName,
  year,
  isYearValid,
  session,
  subject,
  onExamNameChange,
  onYearChange,
  onSessionChange,
  onSubjectChange
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
          <Input
            type="text"
            value={examName}
            onChange={e => onExamNameChange(e.target.value)}
            className={`h-8 text-sm ${!examName.trim() ? 'border-red-300' : ''} w-full`}
            placeholder="산업안전기사"
            required
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-500 block">
            년도: <span className="text-red-500 font-bold">*</span>
          </Label>
          <Input
            type="text"
            value={year}
            onChange={e => onYearChange(e.target.value)}
            className={`h-8 text-sm ${!year.trim() || !isYearValid ? 'border-red-300' : ''} w-full`}
            placeholder="YYYY (예: 2024)"
            maxLength={4}
            required
          />
          {!isYearValid && <p className="text-xs text-red-500 mt-1">년도는 4자리 숫자로 입력하세요.</p>}
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-500 block">
            회차: <span className="text-red-500 font-bold">*</span>
          </Label>
          <Input
            type="text"
            value={session}
            onChange={e => onSessionChange(e.target.value)}
            className={`h-8 text-sm ${!session.trim() ? 'border-red-300' : ''} w-full`}
            placeholder="1회"
            required
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-500 block">과목:</Label>
          <Input
            type="text"
            value={subject}
            onChange={e => onSubjectChange(e.target.value)}
            className="h-8 text-sm w-full"
            placeholder="안전관리 (선택)"
          />
        </div>
      </div>
    </div>
  )
} 