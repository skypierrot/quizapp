import { ImageIcon } from "lucide-react"
import React from "react"

interface ImageAreaProps {
  index: number;
  type: 'question' | 'explanation';
  onAddImage?: (e: React.MouseEvent, index: number) => void;
  isActive: boolean;
  onClick: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: (e: React.MouseEvent) => void;
}

export const ImageArea: React.FC<ImageAreaProps> = ({
  index,
  type,
  onAddImage,
  isActive,
  onClick,
  onMouseEnter,
  onMouseLeave
}) => {
  return (
    <div 
      data-image-area="true"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-md transition-colors cursor-pointer ${
        isActive
          ? 'border-blue-300 bg-blue-50/60'
          : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      <div className="flex flex-col items-center justify-center h-10">
        <ImageIcon className="w-5 h-5 text-gray-400" />
        <p className="mt-1 text-sm text-gray-500">
          {isActive
            ? `한 번더 클릭 또는 Ctrl+V 하여 이미지 추가`
            : "한번 클릭하여 영역활성화"}
        </p>
      </div>
    </div>
  );
} 