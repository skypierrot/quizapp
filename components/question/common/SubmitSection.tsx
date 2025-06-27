import { Button } from '@/components/ui/button'
import React from 'react'

interface SubmitSectionProps {
  isSubmitting: boolean
  isEditMode?: boolean
  buttonText?: string
}

export function SubmitSection({ isSubmitting, isEditMode = false, buttonText }: SubmitSectionProps) {
  return (
    <div className="flex justify-end gap-3">
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting
          ? (buttonText ? '저장 중...' : (isEditMode ? '수정 중...' : '등록 중...'))
          : (buttonText || (isEditMode ? '문제 수정하기' : '문제 등록하기'))}
      </Button>
    </div>
  )
} 