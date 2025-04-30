import { useRef, useState } from "react";

export interface IUniversalImage {
  url: string;
  hash: string;
}

export function useUniversalImageUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<IUniversalImage[]>([]);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [isImageAreaActive, setIsImageAreaActive] = useState(false);

  // 파일 해시 계산 함수 (내부에서 재사용)
  async function getFileHash(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // hash 중복 체크: images 배열을 파라미터로 받음
  const isDuplicate = async (file: File, images: IUniversalImage[]) => {
    const hash = await getFileHash(file);
    return images.some(img => img.hash === hash);
  };

  // 서버 업로드
  const uploadToServer = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/images/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (data?.url) return data.url; // /images/tmp/uuid.png
    alert(data?.error || '이미지 업로드 실패');
    return null;
  };

  // 파일 업로드 핸들러 (images 배열, onUpload 콜백을 파라미터로 받음)
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement> | File,
    images: IUniversalImage[],
    onUpload: (img: IUniversalImage) => void
  ) => {
    let file: File | null = null;
    if (e instanceof File) {
      file = e;
    } else {
      file = e.target.files?.[0] || null;
      e.target.value = '';
    }
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('이미지 크기는 5MB 이하만 업로드할 수 있습니다.');
      return;
    }
    if (await isDuplicate(file, images)) {
      alert('이미 등록된 이미지입니다.');
      return;
    }
    const url = await uploadToServer(file);
    if (!url) return;
    const hash = await getFileHash(file);
    onUpload({ url, hash });
  };

  // 붙여넣기 핸들러(이미지)
  const handlePaste = async (
    e: React.ClipboardEvent,
    images: IUniversalImage[],
    onUpload: (img: IUniversalImage) => void
  ) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') === 0) {
        const blob = items[i].getAsFile();
        if (blob) await handleImageUpload(blob, images, onUpload);
        e.preventDefault();
        return;
      }
    }
  };

  // 드래그앤드롭 지원
  const handleDrop = async (
    e: React.DragEvent,
    images: IUniversalImage[],
    onUpload: (img: IUniversalImage) => void
  ) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) await handleImageUpload(file, images, onUpload);
  };

  // 이미지 삭제
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // 이미지 확대
  const handleImageZoom = (img: string) => setZoomedImage(img);

  // 이미지 영역 클릭
  const handleImageAreaClick = () => {
    setIsImageAreaActive(true);
    inputRef.current?.click();
  };

  // 이미지 영역 마우스 떠남
  const handleImageAreaMouseLeave = () => {
    setIsImageAreaActive(false);
  };

  return {
    inputRef,
    images,
    setImages,
    zoomedImage,
    setZoomedImage,
    isImageAreaActive,
    setIsImageAreaActive,
    handlePaste,
    handleDrop,
    removeImage,
    handleImageZoom,
    handleImageAreaClick,
    handleImageAreaMouseLeave,
    handleImageUpload,
    uploadToServer,
  };
} 