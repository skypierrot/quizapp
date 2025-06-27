import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import React from 'react'

interface QuestionContentProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onPaste?: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void
  inputRef?: React.RefObject<HTMLTextAreaElement>
}

export function QuestionContent({ value, onChange, onPaste, inputRef }: QuestionContentProps) {
  return (
    <div>
      <Label className="block mb-2 font-medium">문제 내용</Label>
      <div className="relative border border-dashed border-blue-300 rounded-md transition-all hover:border-blue-500 mb-4">
        <Textarea
          ref={inputRef}
          value={value}
          onChange={onChange}
          onPaste={onPaste}
          className="min-h-[100px]"
          placeholder="문제 내용을 입력하세요."
        />
        <div className="absolute bottom-2 right-2 pointer-events-none flex items-center">
          <div className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm flex items-center gap-1 border border-blue-200">
            <span className="text-xs text-gray-600">문제 내용을 입력하세요</span>
          </div>
        </div>
      </div>
    </div>
  )
} 