import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CommonImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholderSrc?: string; // Optional placeholder for error
  fallbackText?: string; // Optional text fallback
  containerClassName?: string;
  maintainAspectRatio?: boolean; // 비율 유지 여부 prop 추가
}

export function CommonImage({
  src,
  alt,
  placeholderSrc = '/placeholder.png', // Provide a default placeholder path
  fallbackText = '이미지 로딩 실패',
  className,
  containerClassName,
  maintainAspectRatio = false, // 기본값 false
  style,
  ...props
}: CommonImageProps) {
  const [error, setError] = useState(false);
  const [calculatedAspectRatio, setCalculatedAspectRatio] = useState<string | undefined>(undefined);

  useEffect(() => {
    setCalculatedAspectRatio(undefined);
    setError(false);

    if (maintainAspectRatio && src) {
      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          // CSS aspect-ratio 속성값 (width / height)
          setCalculatedAspectRatio(`${img.naturalWidth} / ${img.naturalHeight}`);
        }
      };
      img.onerror = () => {
        setError(true);
      };
      img.src = src;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, maintainAspectRatio]);

  const handleError = () => {
    setError(true);
  };

  // 컨테이너 스타일 계산 (기존 스타일 + aspect-ratio)
  const containerStyle: React.CSSProperties = {
    ...style,
    aspectRatio: maintainAspectRatio ? calculatedAspectRatio : undefined,
    height: maintainAspectRatio && calculatedAspectRatio && !style?.height ? 'auto' : style?.height,
  };

  return (
    <div className={cn("relative overflow-hidden", containerClassName)} style={containerStyle}>
      {error ? (
        <div className={cn("absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500 text-xs", className)}>
          {placeholderSrc ? (
            <img src={placeholderSrc} alt="이미지 로딩 실패" className="w-full h-full object-contain" />
          ) : (
            fallbackText
          )}
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={cn(
            "block",
            maintainAspectRatio ? "w-full h-auto" : "w-full h-full object-cover",
            className
          )}
          loading="lazy"
          onError={handleError}
          {...props}
          style={{}}
        />
      )}
    </div>
  );
} 