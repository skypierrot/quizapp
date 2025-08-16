"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CommonImageProps {
  src: string;
  alt: string;
  hash?: string;
  placeholderSrc?: string;
  fallbackText?: string;
  containerClassName?: string;
  className?: string;
  style?: React.CSSProperties;
  maintainAspectRatio?: boolean;
  onClick?: React.MouseEventHandler<HTMLDivElement> | undefined;
  loading?: "eager" | "lazy";
}

export function CommonImage({
  src,
  alt,
  hash,
  placeholderSrc = '/placeholder.png',
  fallbackText = '이미지 로딩 실패',
  className,
  containerClassName,
  maintainAspectRatio = false,
  onClick,
  style,
  loading = "lazy",
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

  const computedContainerStyle: React.CSSProperties = {
    aspectRatio: maintainAspectRatio ? calculatedAspectRatio : undefined,
    height: maintainAspectRatio && calculatedAspectRatio ? 'auto' : undefined,
  };

  return (
    <div 
      className={cn("relative overflow-hidden", containerClassName)}
      style={computedContainerStyle}
      onClick={onClick}
    >
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
          loading={loading}
          onError={handleError}
          style={style}
        />
      )}
    </div>
  );
} 