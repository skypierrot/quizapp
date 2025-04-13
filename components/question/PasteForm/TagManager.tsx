"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { ITagManagerProps } from "./types"

export function TagManager({
  globalTags,
  globalTagInput,
  setGlobalTagInput,
  examName,
  year,
  session,
  subject,
  setExamName,
  setYear,
  setSession,
  setSubject,
  onAddGlobalTag,
  onRemoveGlobalTag,
  onApplyBasicTags
}: ITagManagerProps) {
  return (
    <>
      {/* 기본 태그 설정 (시험명, 년도, 회차, 과목) */}
      <div className="flex flex-wrap gap-2 mb-4 mt-4 p-3 border border-gray-200 rounded-md bg-gray-50">
        <div className="w-full">
          <h4 className="text-sm font-medium mb-2">기본 태그 설정</h4>
          <p className="text-xs text-gray-500 mb-3">
            <span className="text-red-500 font-bold">*</span> 표시는 필수 입력 항목입니다
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <div className="flex items-center gap-2">
            <label className="text-sm whitespace-nowrap font-medium">
              시험명: <span className="text-red-500 font-bold">*</span>
            </label>
            <Input 
              type="text" 
              value={examName} 
              onChange={(e) => setExamName(e.target.value)}
              onCompositionEnd={(e) => setExamName((e.target as HTMLInputElement).value)}
              className={`w-32 h-8 text-sm ${!examName.trim() ? 'border-red-300' : ''}`}
              placeholder="산업안전기사"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm whitespace-nowrap font-medium">
              년도: <span className="text-red-500 font-bold">*</span>
            </label>
            <Input 
              type="text" 
              value={year} 
              onChange={(e) => setYear(e.target.value)}
              onCompositionEnd={(e) => setYear((e.target as HTMLInputElement).value)}
              className={`w-20 h-8 text-sm ${!year.trim() ? 'border-red-300' : ''}`}
              placeholder="2024"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm whitespace-nowrap font-medium">
              회차: <span className="text-red-500 font-bold">*</span>
            </label>
            <Input 
              type="text" 
              value={session} 
              onChange={(e) => setSession(e.target.value)}
              onCompositionEnd={(e) => setSession((e.target as HTMLInputElement).value)}
              className={`w-20 h-8 text-sm ${!session.trim() ? 'border-red-300' : ''}`}
              placeholder="1회"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm whitespace-nowrap">과목:</label>
            <Input 
              type="text" 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)}
              onCompositionEnd={(e) => setSubject((e.target as HTMLInputElement).value)}
              className="w-32 h-8 text-sm" 
              placeholder="안전관리 (선택)"
            />
          </div>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={onApplyBasicTags}
            className="whitespace-nowrap ml-auto"
          >
            태그 적용
          </Button>
        </div>
      </div>
      
      {/* 글로벌 태그 설정 */}
      <div className="mb-4 p-3 border border-gray-200 rounded-md">
        <h4 className="text-sm font-medium mb-2">공통 태그 설정 (모든 문제에 적용)</h4>
        <div className="flex gap-2 mb-2">
          <Input 
            type="text" 
            value={globalTagInput} 
            onChange={(e) => setGlobalTagInput(e.target.value)}
            onCompositionEnd={(e) => setGlobalTagInput((e.target as HTMLInputElement).value)}
            className="text-sm"
            onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && onAddGlobalTag()}
            placeholder="태그 입력 후 Enter"
          />
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={onAddGlobalTag}
          >
            추가
          </Button>
        </div>
        {globalTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {globalTags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                {tag}
                <button 
                  type="button" 
                  onClick={() => onRemoveGlobalTag(tag)}
                  className="ml-1 text-gray-500 hover:text-gray-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </>
  )
} 