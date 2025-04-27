import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import React from "react"

interface ImagePreviewProps {
  image: string | { url: string; hash: string };
  onRemove: () => void;
  onZoom: (imageUrl: string) => void;
  isExplanation?: boolean;
  index: number;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  image,
  onRemove,
  onZoom,
  isExplanation = false,
  index
}) => {
  const imageUrl = typeof image === 'string' ? image : image.url;
  return (
    <div className="relative group overflow-hidden rounded-lg border shadow-sm mb-2 bg-white">
      <Button
        type="button"
        size="sm"
        variant="destructive"
        onClick={onRemove}
        className="absolute top-2 right-2 h-6 w-6 p-0 rounded-full z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-700 border-none"
      >
        <X className="h-4 w-4" />
      </Button>
      <div
        className="w-full transition-transform duration-300 hover:scale-105 cursor-zoom-in"
        onClick={() => onZoom(imageUrl)}
      >
        <img
          src={imageUrl}
          alt={`${isExplanation ? '해설' : '문제'} 이미지 ${index + 1}`}
          className="w-full max-w-[400px] h-auto max-h-[400px] object-contain mx-auto rounded-md shadow"
          style={{ display: 'block' }}
        />
      </div>
    </div>
  )
} 