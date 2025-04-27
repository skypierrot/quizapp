import React from 'react'

interface QuestionListSectionProps {
  questions: any[]
  onEdit: (index: number) => void
  onRemove: (index: number) => void
  onReorder?: (from: number, to: number) => void
}

export function QuestionListSection({ questions, onEdit, onRemove, onReorder }: QuestionListSectionProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-base font-medium mb-2">문제 리스트</h3>
      {questions.length === 0 && <p className="text-sm text-gray-500">문제가 없습니다.</p>}
      {questions.map((q, idx) => (
        <div key={q.id || idx} className="flex items-center gap-2 border rounded p-2 bg-white hover:bg-gray-50">
          <div className="flex-1">
            <span className="font-semibold mr-2">{idx + 1}.</span>
            <span className="truncate">{q.content?.slice(0, 40) || '내용 없음'}</span>
          </div>
          <button type="button" className="text-blue-600 text-xs px-2" onClick={() => onEdit(idx)}>편집</button>
          <button type="button" className="text-red-500 text-xs px-2" onClick={() => onRemove(idx)}>삭제</button>
          {onReorder && idx > 0 && (
            <button type="button" className="text-xs px-1" onClick={() => onReorder(idx, idx - 1)}>▲</button>
          )}
          {onReorder && idx < questions.length - 1 && (
            <button type="button" className="text-xs px-1" onClick={() => onReorder(idx, idx + 1)}>▼</button>
          )}
        </div>
      ))}
    </div>
  )
} 