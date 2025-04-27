import React from 'react'
import { ImageArea } from './ImageArea'
import { ImagePreview } from './ImagePreview'

interface IImage {
  url: string;
  hash: string;
}

interface ImageGroupProps {
  questionImages: IImage[];
  explanationImages: IImage[];
  onRemoveImage: (idx: number, isExplanation?: boolean) => void;
  onZoomImage: (url: string) => void;
  onImageAreaClick: (type: 'question' | 'explanation') => void;
  onImageAreaMouseEnter: (type: 'question' | 'explanation') => void;
  onImageAreaMouseLeave: () => void;
  questionImageInputRef: React.RefObject<HTMLInputElement>;
  explanationImageInputRef: React.RefObject<HTMLInputElement>;
  activeImageType: 'question' | 'explanation' | null | undefined;
  isImageAreaActive: boolean;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>, isExplanation?: boolean) => void;
  type?: 'question' | 'explanation' | null;
  handleDrop?: (e: React.DragEvent<Element>, isExplanation?: boolean) => void;
  handleTextAreaPaste?: (e: React.ClipboardEvent<Element>) => void;
}

export function ImageGroup({
  questionImages,
  explanationImages,
  onRemoveImage,
  onZoomImage,
  onImageAreaClick,
  onImageAreaMouseEnter,
  onImageAreaMouseLeave,
  questionImageInputRef,
  explanationImageInputRef,
  activeImageType,
  isImageAreaActive,
  handleImageUpload,
  type,
  handleDrop,
  handleTextAreaPaste
}: ImageGroupProps) {
  if (type === 'question') {
    return (
      <>
        {/* 문제 이미지 */}
        {questionImages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            {questionImages.map((img, imgIdx) => (
              <ImagePreview
                key={`question-image-${imgIdx}`}
                image={img}
                index={imgIdx}
                onRemove={() => onRemoveImage(imgIdx)}
                onZoom={onZoomImage}
              />
            ))}
          </div>
        )}
        <ImageArea
          type="question"
          isActive={activeImageType === 'question' && isImageAreaActive}
          onActivate={() => onImageAreaClick('question')}
          onImageUpload={file => handleImageUpload({ target: { files: [file] } } as any, false)}
        />
      </>
    )
  }
  if (type === 'explanation') {
    return (
      <>
        {/* 해설 이미지 */}
        {explanationImages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            {explanationImages.map((img, imgIdx) => (
              <ImagePreview
                key={`explanation-image-${imgIdx}`}
                image={img}
                index={imgIdx}
                isExplanation={true}
                onRemove={() => onRemoveImage(imgIdx)}
                onZoom={onZoomImage}
              />
            ))}
          </div>
        )}
        <ImageArea
          type="explanation"
          isActive={activeImageType === 'explanation' && isImageAreaActive}
          onActivate={() => onImageAreaClick('explanation')}
          onImageUpload={file => handleImageUpload({ target: { files: [file] } } as any, true)}
        />
      </>
    )
  }
  // 기본: 둘 다 렌더링
  return (
    <>
      {/* 문제 이미지 */}
      {questionImages.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          {questionImages.map((img, imgIdx) => (
            <ImagePreview
              key={`question-image-${imgIdx}`}
              image={img}
              index={imgIdx}
              onRemove={() => onRemoveImage(imgIdx)}
              onZoom={onZoomImage}
            />
          ))}
        </div>
      )}
      <ImageArea
        type="question"
        isActive={activeImageType === 'question' && isImageAreaActive}
        onActivate={() => onImageAreaClick('question')}
        onImageUpload={file => handleImageUpload({ target: { files: [file] } } as any, false)}
      />
      {/* 해설 이미지 */}
      {explanationImages.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          {explanationImages.map((img, imgIdx) => (
            <ImagePreview
              key={`explanation-image-${imgIdx}`}
              image={img}
              index={imgIdx}
              isExplanation={true}
              onRemove={() => onRemoveImage(imgIdx)}
              onZoom={onZoomImage}
            />
          ))}
        </div>
      )}
      <ImageArea
        type="explanation"
        isActive={activeImageType === 'explanation' && isImageAreaActive}
        onActivate={() => onImageAreaClick('explanation')}
        onImageUpload={file => handleImageUpload({ target: { files: [file] } } as any, true)}
      />
    </>
  )
} 