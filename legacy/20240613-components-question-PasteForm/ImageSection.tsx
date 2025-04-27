import React from 'react'
import { ManualImageArea } from '../ManualForm/ManualImageArea'
import { ManualImagePreview } from '../ManualForm/ManualImagePreview'

interface ImageSectionProps {
  questionImages: string[]
  explanationImages: string[]
  onRemoveImage: (index: number, isExplanation?: boolean) => void
  onZoomImage: (imageUrl: string) => void
  onImageAreaClick: (type: 'question' | 'explanation') => void
  onImageAreaMouseLeave: () => void
  isImageAreaActive: boolean
  type?: 'question' | 'explanation'
}

export function ImageSection({
  questionImages,
  explanationImages,
  onRemoveImage,
  onZoomImage,
  onImageAreaClick,
  onImageAreaMouseLeave,
  isImageAreaActive,
  type
}: ImageSectionProps) {
  if (type === 'question') {
    return (
      <>
        {/* 문제 이미지 */}
        {questionImages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            {questionImages.map((img, imgIdx) => (
              <ManualImagePreview
                key={`question-image-${imgIdx}`}
                image={img}
                index={imgIdx}
                onRemove={() => onRemoveImage(imgIdx, false)}
                onZoom={onZoomImage}
              />
            ))}
          </div>
        )}
        <ManualImageArea
          type="question"
          isActive={isImageAreaActive}
          onClick={e => {
            e.stopPropagation();
            onImageAreaClick('question');
          }}
          onMouseEnter={() => {}}
          onMouseLeave={onImageAreaMouseLeave}
          inputRef={null as unknown as React.RefObject<HTMLInputElement>}
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
              <ManualImagePreview
                key={`explanation-image-${imgIdx}`}
                image={img}
                index={imgIdx}
                isExplanation={true}
                onRemove={() => onRemoveImage(imgIdx, true)}
                onZoom={onZoomImage}
              />
            ))}
          </div>
        )}
        <ManualImageArea
          type="explanation"
          isActive={isImageAreaActive}
          onClick={e => {
            e.stopPropagation();
            onImageAreaClick('explanation');
          }}
          onMouseEnter={() => {}}
          onMouseLeave={onImageAreaMouseLeave}
          inputRef={null as unknown as React.RefObject<HTMLInputElement>}
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
            <ManualImagePreview
              key={`question-image-${imgIdx}`}
              image={img}
              index={imgIdx}
              onRemove={() => onRemoveImage(imgIdx, false)}
              onZoom={onZoomImage}
            />
          ))}
        </div>
      )}
      <ManualImageArea
        type="question"
        isActive={isImageAreaActive}
        onClick={e => {
          e.stopPropagation();
          onImageAreaClick('question');
        }}
        onMouseEnter={() => {}}
        onMouseLeave={onImageAreaMouseLeave}
        inputRef={null as unknown as React.RefObject<HTMLInputElement>}
      />
      {/* 해설 이미지 */}
      {explanationImages.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          {explanationImages.map((img, imgIdx) => (
            <ManualImagePreview
              key={`explanation-image-${imgIdx}`}
              image={img}
              index={imgIdx}
              isExplanation={true}
              onRemove={() => onRemoveImage(imgIdx, true)}
              onZoom={onZoomImage}
            />
          ))}
        </div>
      )}
      <ManualImageArea
        type="explanation"
        isActive={isImageAreaActive}
        onClick={e => {
          e.stopPropagation();
          onImageAreaClick('explanation');
        }}
        onMouseEnter={() => {}}
        onMouseLeave={onImageAreaMouseLeave}
        inputRef={null as unknown as React.RefObject<HTMLInputElement>}
      />
    </>
  )
} 