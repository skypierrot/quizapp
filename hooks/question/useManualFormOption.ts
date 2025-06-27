import { useState } from "react"
import { IManualQuestion } from '@/types';

interface IOption {
  number: number;
  text: string;
  images: { url: string; hash: string }[];
}

export function useManualFormOption({
  question,
  setQuestion
}: {
  question: IManualQuestion,
  setQuestion: React.Dispatch<React.SetStateAction<IManualQuestion>>
}) {
  // 선택지 추가
  const addOption = () => {
    setQuestion(prev => ({
      ...prev,
      options: [
        ...prev.options,
        { number: prev.options.length + 1, text: "", images: [] }
      ]
    }))
  }

  // 선택지 삭제
  const removeOption = (index: number) => {
    setQuestion(prev => {
      const newOptions = prev.options.filter((_, i) => i !== index)
        .map((opt, idx) => ({ ...opt, number: idx + 1 }))
      // 정답 인덱스 조정
      let newAnswer = prev.answer
      if (prev.answer === index) newAnswer = -1
      else if (prev.answer > index) newAnswer = prev.answer - 1
      return {
        ...prev,
        options: newOptions,
        answer: newAnswer
      }
    })
  }

  // 선택지 텍스트 변경
  const updateOption = (index: number, text: string) => {
    setQuestion(prev => {
      const newOptions = prev.options.map((opt, i) =>
        i === index ? { ...opt, text } : opt
      )
      return { ...prev, options: newOptions }
    })
  }

  // 정답 선택(토글)
  const setQuestionAnswer = (index: number) => {
    setQuestion(prev => ({
      ...prev,
      answer: prev.answer === index ? -1 : index,
    }))
  }

  // 파일 해시 계산 함수
  async function getFileHash(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // 옵션 이미지 업로드
  const onOptionImageUpload = async (file: File, optionIdx: number) => {
    if (file.size > 5 * 1024 * 1024) {
      alert('이미지 크기는 5MB 이하만 업로드할 수 있습니다.');
      return;
    }
    const hash = await getFileHash(file);
    const isDuplicate = question.options[optionIdx].images.some(img => img.hash === hash);
    if (isDuplicate) {
      alert('이미 등록된 이미지입니다.');
      return;
    }
    // 서버 업로드 로직 (uploadToServer 함수 필요)
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/images/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!data?.url) {
      alert(data?.error || '이미지 업로드 실패');
      return;
    }
    setQuestion(prev => {
      const newOptions = prev.options.map((opt, i) =>
        i === optionIdx ? { ...opt, images: [...(opt.images || []), { url: data.url, hash }] } : opt
      );
      return { ...prev, options: newOptions };
    });
  };

  // 옵션 이미지 삭제
  const onOptionImageRemove = (optionIdx: number, imageIdx: number) => {
    setQuestion(prev => {
      const newOptions = prev.options.map((opt, i) =>
        i === optionIdx
          ? { ...opt, images: opt.images.filter((_, idx) => idx !== imageIdx) }
          : opt
      );
      return { ...prev, options: newOptions };
    });
  };

  // 옵션 이미지 확대(미리보기)
  const onOptionImageZoom = (imageUrl: string) => {
    // 필요시 상위에서 상태 관리
    // 예: setZoomedImage(imageUrl)
  };

  // 유효성 검사: 텍스트 또는 이미지가 1개 이상 있으면 유효
  const isAllOptionsFilled = question.options.every(opt => opt.text.trim() !== '' || (opt.images && opt.images.length > 0));
  // 유효성 검사: 정답이 선택됐는지
  const isAnswerSelected = question.answer >= 0 && question.answer < question.options.length;

  return {
    addOption,
    removeOption,
    updateOption,
    setQuestionAnswer,
    onOptionImageUpload,
    onOptionImageRemove,
    onOptionImageZoom,
    isAllOptionsFilled,
    isAnswerSelected,
  }
} 