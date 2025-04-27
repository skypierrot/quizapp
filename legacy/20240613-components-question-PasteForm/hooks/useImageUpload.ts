import { useState } from 'react';
import { IParsedQuestion } from '../types';
import { toast } from '@/components/ui/use-toast';

export function useImageUpload(
  parsedQuestions: IParsedQuestion[],
  setParsedQuestions: React.Dispatch<React.SetStateAction<IParsedQuestion[]>>
) {
  const [clipboardImage, setClipboardImage] = useState<string | null>(null);
  const [selectedImageType, setSelectedImageType] = useState<'question' | 'explanation'>('question');
  const [explanationText, setExplanationText] = useState<string>("");

  // 클립보드 붙여넣기 처리 핸들러
  const handlePaste = (e: React.ClipboardEvent) => {
    // 현재 선택된 문제 인덱스 확인
    const targetElement = e.currentTarget as HTMLElement;
    const questionIndex = targetElement.dataset.questionIndex 
      ? parseInt(targetElement.dataset.questionIndex) 
      : -1;
    const imageType = targetElement.dataset.imageType as 'question' | 'explanation' || 'question';
    
    // 클립보드에 이미지가 있는지 확인
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          e.preventDefault(); // 기본 붙여넣기 동작 방지
          
          // 개별 문제를 선택한 상태인지 확인
          if (questionIndex >= 0 && parsedQuestions.length > questionIndex) {
            // 개별 문제에 이미지 추가
            const url = URL.createObjectURL(blob);
            setParsedQuestions(prev => {
              const updated = [...prev];
              if (imageType === 'question') {
                updated[questionIndex].images = [...updated[questionIndex].images, url];
              } else if (imageType === 'explanation') {
                if (!updated[questionIndex].explanationImages) {
                  updated[questionIndex].explanationImages = [];
                }
                updated[questionIndex].explanationImages = [...updated[questionIndex].explanationImages || [], url];
              }
              return updated;
            });
            
            // 성공 메시지 표시
            alert(`${questionIndex + 1}번 문제의 ${imageType === 'question' ? '문제' : '해설'} 이미지가 추가되었습니다.`);
          } else {
            // 전역 이미지로 저장 (파싱 전)
            const url = URL.createObjectURL(blob);
            setClipboardImage(url);
          }
          return;
        }
      }
    }
  };

  // 이미지 업로드 처리
  const handleImageUpload = (file: File, questionIndex: number = -1, type: 'question' | 'explanation' = 'question'): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      try {
        const url = URL.createObjectURL(file);
        
        if (questionIndex >= 0 && parsedQuestions.length > questionIndex) {
          // 선택된 문제에 이미지 추가
          setParsedQuestions(prev => {
            const updated = [...prev];
            if (type === 'question') {
              updated[questionIndex].images.push(url);
            } else if (type === 'explanation') {
              if (!updated[questionIndex].explanationImages) {
                updated[questionIndex].explanationImages = [];
              }
              updated[questionIndex].explanationImages!.push(url);
            }
            return updated;
          });
        } else {
          // 전역 이미지로 저장 (파싱 전)
          setClipboardImage(url);
        }
        
        resolve(url);
      } catch (error) {
        console.error('이미지 처리 중 오류 발생:', error);
        reject(error);
      }
    });
  };

  // input 태그를 통한 이미지 업로드 이벤트 핸들러
  const handleImageInputChange = (e: React.ChangeEvent<HTMLInputElement>, questionIndex: number = -1, type: 'question' | 'explanation' = 'question') => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        handleImageUpload(file, questionIndex, type)
          .catch(error => {
            console.error('이미지 업로드 실패:', error);
            toast({
              title: '이미지 업로드 실패',
              description: '이미지 업로드 중 오류가 발생했습니다.',
              variant: 'destructive',
            });
          });
      } catch (error) {
        console.error('이미지 업로드 실패:', error);
        toast({
          title: '이미지 업로드 실패',
          description: '이미지 업로드 중 오류가 발생했습니다.',
          variant: 'destructive',
        });
      }
    }
  };

  // 문제에 이미지 추가
  const addImageToQuestion = (questionIndex: number) => {
    // 파일 선택 다이얼로그 열기
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleImageUpload(file, questionIndex, 'question')
          .catch(error => {
            console.error('이미지 업로드 실패:', error);
            toast({
              title: '이미지 업로드 실패',
              description: '이미지 업로드 중 오류가 발생했습니다.',
              variant: 'destructive',
            });
          });
      }
    };
    input.click();
  };

  // 문제에 해설 이미지 추가
  const addExplanationImageToQuestion = (questionIndex: number) => {
    // 파일 선택 다이얼로그 열기
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleImageUpload(file, questionIndex, 'explanation')
          .catch(error => {
            console.error('해설 이미지 업로드 실패:', error);
            toast({
              title: '이미지 업로드 실패',
              description: '해설 이미지 업로드 중 오류가 발생했습니다.',
              variant: 'destructive',
            });
          });
      }
    };
    input.click();
  };

  // 문제에 해설 텍스트 추가
  const addExplanationTextToQuestion = (questionIndex: number, text: string) => {
    setParsedQuestions(prev => {
      const updated = [...prev];
      updated[questionIndex].explanation = text;
      return updated;
    });
    setExplanationText('');
  };

  return {
    clipboardImage,
    setClipboardImage,
    selectedImageType,
    setSelectedImageType,
    explanationText,
    setExplanationText,
    handlePaste,
    handleImageUpload,
    handleImageInputChange,
    addImageToQuestion,
    addExplanationImageToQuestion,
    addExplanationTextToQuestion
  };
} 