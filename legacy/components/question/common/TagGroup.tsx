import React from 'react'
import { BasicTagSettings } from './BasicTagSettings'
import { AdditionalTagInput } from './AdditionalTagInput'

interface TagGroupProps {
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

export function TagGroup({
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
}: TagGroupProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col">
        <h3 className="text-base font-medium mb-2">태그 관리</h3>
        
        <BasicTagSettings
          examName={examName}
          year={year}
          isYearValid={isYearValid}
          session={session}
          subject={subject}
          onExamNameChange={onExamNameChange}
          onYearChange={onYearChange}
          onSessionChange={onSessionChange}
          onSubjectChange={onSubjectChange}
        />
        
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