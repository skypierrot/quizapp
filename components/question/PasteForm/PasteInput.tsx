"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ImageIcon } from "lucide-react"
import { IPasteInputProps } from "./types"

export function PasteInput({
  pasteValue,
  setPasteValue,
  onPaste,
  isPasteAreaFocused,
  setIsPasteAreaFocused,
  clipboardImage,
  setClipboardImage,
  textareaRef,
  pasteExample
}: IPasteInputProps) {
  return (
    <div>
      <h3 className="font-medium mb-2">문제 붙여넣기</h3>
      <p className="text-sm text-gray-500 mb-2">
        아래 형식에 맞춰 문제를 붙여넣으세요. 여러 문제를 한 번에 등록할 수 있습니다.
      </p>
      
      <div className="text-xs text-gray-400 mb-2">
        예시 형식:
      </div>
      <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
        {pasteExample}
      </pre>
      
      {clipboardImage && (
        <div className="mb-4 relative">
          <div className="absolute top-2 right-2">
            <Button 
              type="button" 
              size="sm" 
              variant="destructive"
              onClick={() => setClipboardImage(null)}
              className="h-6 w-6 p-0"
            >
              ✕
            </Button>
          </div>
          <img 
            src={clipboardImage} 
            alt="붙여넣은 이미지" 
            className="max-h-40 rounded border border-gray-200" 
          />
        </div>
      )}
      
      <div className={`relative ${isPasteAreaFocused ? 'ring-2 ring-blue-500' : 'hover:ring-1 hover:ring-gray-300'} rounded-md transition-all`}>
        <Textarea
          ref={textareaRef}
          value={pasteValue}
          onChange={(e) => setPasteValue(e.target.value)}
          onPaste={onPaste}
          onFocus={() => setIsPasteAreaFocused(true)}
          onBlur={() => setIsPasteAreaFocused(false)}
          className="min-h-[200px] font-mono text-sm"
          placeholder="여기에 문제를 붙여넣으세요..."
        />
        <div className="absolute inset-0 pointer-events-none border border-dashed border-gray-300 rounded-md flex items-center justify-center">
          <div className={`bg-white px-3 py-1 rounded-full shadow-sm flex items-center gap-1 ${clipboardImage ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
            <ImageIcon className="h-4 w-4 text-gray-500" />
            <span className="text-xs text-gray-500">
              {clipboardImage ? "이미지가 추가됨" : "Ctrl+V로 이미지 붙여넣기 가능"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
} 