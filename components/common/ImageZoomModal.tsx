import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { CommonImage } from './CommonImage';

interface ImageZoomModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export function ImageZoomModal({ imageUrl, onClose }: ImageZoomModalProps) {
  return (
    <Dialog open={!!imageUrl} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto p-2">
        <DialogTitle>이미지 확대</DialogTitle>
        <DialogDescription>이미지 상세 보기</DialogDescription>
        {/* Accessibility */}
        <VisuallyHidden>
          <DialogTitle>확대 이미지</DialogTitle>
          <DialogDescription>선택한 이미지의 확대된 모습입니다.</DialogDescription>
        </VisuallyHidden>
        {imageUrl && (
          <CommonImage
            src={imageUrl}
            alt="확대 이미지"
            className="w-full h-auto"
            containerClassName="w-full h-full flex items-center justify-center"
          />
        )}
      </DialogContent>
    </Dialog>
  );
} 