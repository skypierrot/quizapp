import { toast } from "sonner";

/**
 * 클립보드에서 이미지를 추출
 * @param e 클립보드 이벤트
 * @returns 추출된 이미지 파일 또는 null
 */
export const extractImageFromClipboard = (e: ClipboardEvent): File | null => {
  if (!e.clipboardData) {
    return null;
  }

  const items = e.clipboardData.items;
  
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf("image") !== -1) {
      const file = items[i].getAsFile();
      return file;
    }
  }
  
  return null;
};

/**
 * 이미지 파일 유효성 검사
 * @param file 검사할 파일
 * @returns 유효성 검사 결과 (true: 유효, false: 유효하지 않음)
 */
export const validateImageFile = (file: File): boolean => {
  // 파일이 이미지인지 확인
  if (!file.type.startsWith('image/')) {
    toast.error('이미지 파일만 업로드 가능합니다.');
    return false;
  }
  
  // 파일 크기 제한 (10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    toast.error('이미지 크기는 10MB 이하만 가능합니다.');
    return false;
  }
  
  return true;
};

/**
 * 이미지 파일에서 임시 URL 생성
 * @param file 이미지 파일
 * @returns 생성된 URL
 */
export const createImageUrl = (file: File): string => {
  return URL.createObjectURL(file);
};

/**
 * 이미지 URL 해제
 * @param url 해제할 URL
 */
export const revokeImageUrl = (url: string): void => {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

/**
 * 이미지 파일을 서버에 업로드
 * @param file 업로드할 파일
 * @returns 업로드된 이미지 URL
 */
export const uploadImageToServer = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('이미지 업로드에 실패했습니다.');
    }
    
    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error('이미지 업로드 오류:', error);
    toast.error('이미지 업로드에 실패했습니다.');
    throw error;
  }
};

/**
 * 다중 이미지 업로드 처리
 * @param files 업로드할 파일 목록
 * @param onProgress 진행 상황 콜백
 * @returns 업로드된 이미지 URL 배열
 */
export const uploadMultipleImages = async (
  files: File[],
  onProgress?: (progress: number) => void
): Promise<string[]> => {
  const validFiles = files.filter(validateImageFile);
  
  if (validFiles.length === 0) {
    return [];
  }
  
  const urls: string[] = [];
  
  for (let i = 0; i < validFiles.length; i++) {
    try {
      const url = await uploadImageToServer(validFiles[i]);
      urls.push(url);
      
      if (onProgress) {
        onProgress(Math.round(((i + 1) / validFiles.length) * 100));
      }
    } catch (error) {
      console.error(`${i+1}번째 이미지 업로드 실패:`, error);
    }
  }
  
  return urls;
};

/**
 * 이미지 파일 드래그 앤 드롭 이벤트 처리
 * @param e 드래그 이벤트
 * @returns 드래그된 이미지 파일 배열
 */
export const handleImageDrop = (e: React.DragEvent<HTMLDivElement>): File[] => {
  e.preventDefault();
  e.stopPropagation();
  
  const files: File[] = [];
  
  if (e.dataTransfer.items) {
    // DataTransferItemList 인터페이스 사용
    for (let i = 0; i < e.dataTransfer.items.length; i++) {
      if (e.dataTransfer.items[i].kind === 'file') {
        const file = e.dataTransfer.items[i].getAsFile();
        if (file) files.push(file);
      }
    }
  } else {
    // DataTransfer 인터페이스 사용
    for (let i = 0; i < e.dataTransfer.files.length; i++) {
      files.push(e.dataTransfer.files[i]);
    }
  }
  
  return files;
};

/**
 * 이미지 드래그 오버 이벤트 처리
 * @param e 드래그 오버 이벤트
 */
export const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
  e.preventDefault();
  e.stopPropagation();
};

/**
 * Base64 이미지 URL을 파일 객체로 변환
 * @param dataUrl Base64 이미지 URL
 * @param filename 파일 이름
 * @returns 변환된 파일 객체
 */
export const dataUrlToFile = (
  dataUrl: string,
  filename: string = `image-${Date.now()}.png`
): Promise<File> => {
  return fetch(dataUrl)
    .then(res => res.blob())
    .then(blob => {
      return new File([blob], filename, { type: blob.type });
    });
}; 