"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ImageUploaderProps {
  onUpload: (imageData: { id: number, path: string }) => void;
  type: 'question' | 'option' | 'explanation';
  questionId: string;
  optionId?: string;
  buttonText?: string;
  buttonVariant?: 'default' | 'outline' | 'ghost' | 'link';
  buttonSize?: 'default' | 'sm' | 'xs';
  beforeUpload?: () => void;
}

export function ImageUploader({
  onUpload,
  type,
  questionId,
  optionId,
  buttonText = "이미지 업로드",
  buttonVariant = "outline",
  buttonSize = "default",
  beforeUpload,
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleUpload = async (file: File) => {
    if (!file) return;
    
    if (beforeUpload) beforeUpload();
    setIsUploading(true);
    
    try {
      // FormData 구성
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      if (questionId) formData.append('relatedId', questionId);
      if (optionId) formData.append('optionId', optionId);
      formData.append('userId', 'current-user-id'); // 실제 구현에서는 인증된 사용자 ID
      
      // 이미지 업로드 API 호출
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('이미지 업로드 실패');
      }
      
      const data = await response.json();
      
      if (data.success) {
        onUpload({ 
          id: data.image.id, 
          path: data.image.path 
        });
      }
    } catch (error) {
      console.error('이미지 업로드 중 오류:', error);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  // 파일 선택 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  // 드래그 앤 드롭 핸들러
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleUpload(file);
    }
  };

  // 클립보드 붙여넣기 핸들러
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          handleUpload(file);
          break;
        }
      }
    }
  };

  return (
    <div
      ref={dropZoneRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
      tabIndex={0} // 키보드 이벤트를 받기 위해 필수
      className={`
        ${isDragOver ? 'bg-blue-50 border-blue-400' : 'border-gray-200'}
        border-2 border-dashed rounded-md p-2 transition-colors
        ${buttonSize === 'xs' ? 'w-16 h-16' : buttonSize === 'sm' ? 'w-20 h-20' : 'w-24 h-24'}
        flex flex-col items-center justify-center focus:outline-none
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      
      {isUploading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <Button
            type="button"
            variant={buttonVariant as any}
            size={buttonSize as any}
            onClick={() => fileInputRef.current?.click()}
            className={`
              ${buttonSize === 'xs' ? 'text-xs py-0 px-1 h-6' : ''}
              ${buttonSize === 'sm' ? 'text-sm' : ''}
            `}
          >
            {buttonText}
          </Button>
          {buttonSize !== 'xs' && (
            <p className="text-xs text-gray-500 mt-1">
              또는 이미지 드래그
            </p>
          )}
        </>
      )}
    </div>
  );
} 