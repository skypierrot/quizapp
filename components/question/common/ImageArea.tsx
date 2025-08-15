import { ImageIcon } from "lucide-react"
import React, { useRef } from "react"

interface ImageAreaProps {
  type: 'question' | 'explanation' | 'option';
  isActive: boolean;
  onActivate: () => void;
  onImageUpload: (file: File) => void;
  heightClass?: string;
}

export const ImageArea: React.FC<ImageAreaProps> = ({
  type,
  isActive,
  onActivate,
  onImageUpload,
  heightClass
}) => {
  const inputRef = useRef<HTMLInputElement>(null)

  // 드래그앤드롭
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (!isActive) return
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file)
    }
  }

  // 붙여넣기
  const handlePaste = (e: React.ClipboardEvent) => {
    if (!isActive) return
    const items = e.clipboardData?.items
    if (!items) return
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item && item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) onImageUpload(file)
        e.preventDefault()
        return
      }
    }
  }

  return (
    <div
      data-image-area="true"
      onClick={onActivate}
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
      onPaste={handlePaste}
      tabIndex={0}
      className={`flex flex-col items-center justify-center w-full border-2 border-dashed rounded-md transition-colors cursor-pointer ${heightClass ?? 'h-24'} ${
        isActive
          ? 'border-blue-300 bg-blue-50/60'
          : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        tabIndex={-1}
        aria-hidden
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) onImageUpload(file)
        }}
      />
      <button
        type="button"
        onClick={e => {
          e.stopPropagation();
          inputRef.current?.click();
        }}
        className="flex flex-col items-center justify-center h-10 focus:outline-none"
      >
        <ImageIcon className="w-5 h-5 text-gray-400" />
        <span className="mt-1 text-sm text-gray-500">
          {isActive
            ? `${type === 'question' ? '문제' : type === 'explanation' ? '해설' : '옵션'} 이미지 업로드`
            : `${type === 'question' ? '문제' : type === 'explanation' ? '해설' : '옵션'} 이미지 영역 클릭`}
        </span>
      </button>
    </div>
  )
} 