import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import React from 'react'

interface TagSectionProps {
  examName: string
  year: string
  isYearValid: boolean
  session: string
  subject: string
  tagInput: string
  tags: string[]
  onExamNameChange: (v: string) => void
  onYearChange: (v: string) => void
  onSessionChange: (v: string) => void
  onSubjectChange: (v: string) => void
  onTagInputChange: (v: string) => void
  onAddTag: (tag: string) => void
  onRemoveTag: (tag: string) => void
}

export function TagSection({
  examName,
  year,
  isYearValid,
  session,
  subject,
  tagInput,
  tags,
  onExamNameChange,
  onYearChange,
  onSessionChange,
  onSubjectChange,
  onTagInputChange,
  onAddTag,
  onRemoveTag
}: TagSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col">
        <h3 className="text-base font-medium mb-2">태그 관리</h3>
        {/* 기본 태그 설정 */}
        <div className="flex flex-wrap gap-2 mb-4 mt-4 p-3 border border-gray-200 rounded-md bg-gray-50">
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
        {/* 추가 태그 */}
        <div className="mb-4 p-3 border border-gray-200 rounded-md">
          <h4 className="text-sm font-medium mb-2">추가 태그</h4>
          <div className="flex gap-2 mb-2">
            <Input
              type="text"
              value={tagInput}
              onChange={e => onTagInputChange(e.target.value)}
              className="text-sm"
              placeholder="예: 필기, 핵심개념, 중요문제 등"
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  if (tagInput.trim()) {
                    onAddTag(tagInput.trim());
                  }
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (tagInput.trim()) {
                  onAddTag(tagInput.trim());
                }
              }}
            >
              추가
            </Button>
          </div>
          <p className="text-xs text-gray-500 mb-2">
            기본 태그 외에 추가로 문제를 분류할 태그를 입력하세요. 입력 후 Enter 또는 추가 버튼을 클릭하세요.
          </p>
          {tags.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
              {tags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="flex items-center justify-between gap-1 px-2 py-1 text-xs">
                  <span className="truncate">{tag}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveTag(tag)}
                    className="ml-1 text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 