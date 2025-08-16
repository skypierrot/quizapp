"use client";

import { useState } from 'react';

export function useImageZoom() {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const showZoom = (src: string) => {
    setZoomedImage(src);
  };

  const closeZoom = () => {
    setZoomedImage(null);
  };

  return {
    zoomedImage,
    showZoom,
    closeZoom,
  };
} 