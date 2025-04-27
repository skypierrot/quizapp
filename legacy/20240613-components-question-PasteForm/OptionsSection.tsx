import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import React from 'react'

interface Option {
  number: number
  text: string
  images: string[]
}

interface OptionsSectionProps {
  options: Option[]
  answer: number
  onAddOption: () => void
  onRemoveOption: (index: number) => void
  onUpdateOption: (index: number, value: string) => void
  onSetAnswer: (index: number) => void
}

export function OptionsSection({
  options,
  answer,
  onAddOption,
  onRemoveOption,
  onUpdateOption,
  onSetAnswer
}: OptionsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm font-medium text-gray-700">
          정답 선택: <span className="text-gray-900 font-bold">{answer >= 0 ? `${answer + 1}번` : '선택 안됨'}</span>
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddOption}
          className="text-xs h-8 px-2"
        >
          <Plus className="h-4 w-4 mr-1" /> 선택지 추가
        </Button>
      </div>
      <div className="space-y-3">
        {options.map((option, index) => (
          <div
            key={`option-${index}`}
            className={`flex gap-2 items-center hover:bg-gray-50 p-2 rounded-lg border-2 transition-all duration-200 ${
              answer === index
                ? 'border-gray-800 bg-gray-50/80'
                : 'border-gray-200'
            }`}
          >
            <div
              onClick={() => onSetAnswer(index)}
              className={`flex items-center justify-center h-10 w-10 rounded-full text-sm font-bold cursor-pointer transition-all duration-200 ${
                answer === index
                  ? 'bg-gray-800 text-white shadow-sm ring-2 ring-gray-300'
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
              }`}
            >
              {index + 1}
            </div>
            <Input
              value={option.text}
              onChange={e => onUpdateOption(index, e.target.value)}
              placeholder={`선택지 ${index + 1}의 내용`}
              className={`flex-1 text-sm border-gray-200 focus:ring-1 focus:ring-gray-400 ${
                answer === index ? 'bg-white' : ''
              }`}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemoveOption(index)}
              className="h-10 w-10 rounded-full p-0 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
} 