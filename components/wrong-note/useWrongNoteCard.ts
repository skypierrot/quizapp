import { useState, useCallback, useMemo } from 'react';
import { getImageUrl } from '@/utils/image';

export function useWrongNoteCard(q: any) {
  // 카드별 로컬 상태
  const [isBookmarked, setIsBookmarked] = useState(q.isBookmarked ?? false);
  const [isImportant, setIsImportant] = useState(q.isImportant ?? false);
  const [memo, setMemo] = useState(q.memo ?? '');
  const [editMode, setEditMode] = useState(false);
  const [localEditMemo, setLocalEditMemo] = useState(q.memo ?? '');
  const [retryMode, setRetryMode] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showRetryResult, setShowRetryResult] = useState(false);

  // 이미지 캐싱
  const imageUrlCache = useMemo(() => {
    if (typeof window !== 'undefined') {
      if (!window.APP_IMAGE_CACHE) window.APP_IMAGE_CACHE = new Map<string, string>();
      return window.APP_IMAGE_CACHE;
    }
    return new Map<string, string>();
  }, []);
  const getSafeImageUrl = useCallback((imgPath: string | null | undefined) => {
    if (!imgPath) return '';
    if (imageUrlCache.has(imgPath)) return imageUrlCache.get(imgPath) || '';
    const url = getImageUrl(imgPath);
    imageUrlCache.set(imgPath, url);
    return url;
  }, [imageUrlCache]);

  return {
    isBookmarked, setIsBookmarked,
    isImportant, setIsImportant,
    memo, setMemo,
    editMode, setEditMode,
    localEditMemo, setLocalEditMemo,
    retryMode, setRetryMode,
    selectedAnswer, setSelectedAnswer,
    showRetryResult, setShowRetryResult,
    getSafeImageUrl
  };
} 