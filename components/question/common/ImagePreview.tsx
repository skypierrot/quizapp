import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import React from "react"
import { CommonImage } from "@/components/common/CommonImage"
import { cn } from "@/lib/utils"

interface ImagePreviewProps {
  image: string | { url: string; hash: string };
  onRemove: () => void;
  onZoom: (imageUrl: string) => void;
  isExplanation?: boolean;
  index: number;
  className?: string;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  image,
  onRemove,
  onZoom,
  isExplanation = false,
  index,
  className
}) => {
  const imageUrl = typeof image === 'string' ? image : image.url;
  const altText = `${isExplanation ? '해설' : '문제/선택지'} 이미지 ${index + 1}`;
  return (
    <div className={cn("relative group overflow-hidden rounded-lg border shadow-sm bg-white w-max max-w-full", className)}>
      <Button
        type="button"
        size="sm"
        variant="destructive"
        onClick={onRemove}
        className="absolute top-1 right-1 h-5 w-5 p-0 rounded-full z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-700 border-none"
        aria-label={`이미지 ${index + 1} 삭제`}
      >
        <X className="h-3 w-3" />
      </Button>
      <div
        className="transition-transform duration-300 hover:scale-105 cursor-zoom-in"
        onClick={() => onZoom(imageUrl)}
      >
        <CommonImage
          src={imageUrl}
          alt={altText}
          className="block max-w-full h-auto object-contain mx-auto"
          containerClassName="flex items-center justify-center"
          style={{ display: 'block' }}
          maintainAspectRatio={true}
        />
      </div>
    </div>
  )
} 