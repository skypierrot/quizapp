import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import React from 'react'

interface AdditionalTagInputProps {
  tagInput: string
  tags: string[]
  onTagInputChange: (v: string) => void
  onAddTag: (tag: string) => void
  onRemoveTag: (tag: string) => void
}

export function AdditionalTagInput({
  tagInput,
  tags,
  onTagInputChange,
  onAddTag,
  onRemoveTag
}: AdditionalTagInputProps) {
  return (
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
  )
} 