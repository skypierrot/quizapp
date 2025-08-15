import { useRef, useState } from "react"

// 파일 해시 계산 함수
async function getFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function useManualFormImage({ question, setQuestion }: any) {
  // 이미지 관련 ref 및 상태
  const contentRef = useRef<HTMLTextAreaElement | null>(null)
  const explanationRef = useRef<HTMLTextAreaElement | null>(null)
  const questionImageInputRef = useRef<HTMLInputElement | null>(null);
  const explanationImageInputRef = useRef<HTMLInputElement | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)
  const [activeImageType, setActiveImageType] = useState<'question' | 'explanation' | null>(null)
  const [isImageAreaActive, setIsImageAreaActive] = useState(false)

  // 중복 체크: 해시값 기준
  const isDuplicate = (hash: string, isExplanation?: boolean) => {
    const arr = isExplanation ? (question.explanationImages || []) : (question.images || []);
    return arr.some((img: any) => img.hash === hash);
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
    if (data?.url) return data.url;
    alert(data?.error || '이미지 업로드 실패');
    return null;
  };

  // 파일 업로드 핸들러 (파일 선택/붙여넣기/드래그앤드롭 공통)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement> | File, isExplanation?: boolean) => {
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
    const hash = await getFileHash(file);
    if (isDuplicate(hash, isExplanation)) {
      alert('이미 등록된 이미지입니다.');
      return;
    }
    const url = await uploadToServer(file);
    if (!url) return;
    setQuestion((prev: any) => {
      if (isExplanation) {
        return { ...prev, explanationImages: [...(prev.explanationImages || []), { url, hash }] };
      }
      return { ...prev, images: [...(prev.images || []), { url, hash }] };
    });
  };

  // 붙여넣기 핸들러(이미지)
  const handleTextAreaPaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item && item.type.indexOf('image') === 0) {
        const blob = item.getAsFile();
        if (blob) await handleImageUpload(blob, activeImageType === 'explanation');
        e.preventDefault();
        return;
      }
    }
  };

  // 드래그앤드롭 지원 (ImageArea에서 onDrop 등으로 연결 필요)
  const handleDrop = async (e: React.DragEvent, isExplanation?: boolean) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) await handleImageUpload(file, isExplanation);
  };

  // 이미지 삭제
  const removeImage = (index: number, isExplanation?: boolean) => {
    setQuestion((prev: any) => {
      if (isExplanation) {
        return { ...prev, explanationImages: prev.explanationImages.filter((_: any, i: number) => i !== index) }
      }
      return { ...prev, images: prev.images.filter((_: any, i: number) => i !== index) }
    });
  };

  // 이미지 확대
  const handleImageZoom = (img: string) => setZoomedImage(img);

  // 이미지 영역 클릭
  const handleImageAreaClick = (type: 'question' | 'explanation') => {
    setActiveImageType(type);
    setIsImageAreaActive(true);
    if (type === 'question' && questionImageInputRef.current) {
      questionImageInputRef.current.click();
    } else if (type === 'explanation' && explanationImageInputRef.current) {
      explanationImageInputRef.current.click();
    }
  };

  // 이미지 영역 마우스 떠남
  const handleImageAreaMouseLeave = () => {
    setIsImageAreaActive(false);
    setActiveImageType(null);
  };

  return {
    contentRef,
    explanationRef,
    questionImageInputRef,
    explanationImageInputRef,
    zoomedImage,
    setZoomedImage,
    activeImageType,
    setActiveImageType,
    isImageAreaActive,
    setIsImageAreaActive,
    handleTextAreaPaste,
    handleDrop,
    removeImage,
    handleImageZoom,
    handleImageAreaClick,
    handleImageAreaMouseLeave,
    handleImageUpload,
  }
} 