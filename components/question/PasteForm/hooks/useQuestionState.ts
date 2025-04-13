import { useState } from 'react';
import { IParsedQuestion, IOption, ITag } from '../types';
import { parseQuestionsImproved } from '@/utils/questionParser';

export default function useQuestionState() {
  const [parsedQuestions, setParsedQuestions] = useState<IParsedQuestion[]>([]);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(-1);
  const [questionTagInput, setQuestionTagInput] = useState<string>('');
  const [explanationText, setExplanationText] = useState<string>('');
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [pasteValue, setPasteValue] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasWarning, setHasWarning] = useState<boolean>(false);
  
  // 예시 문제
  const pasteExample = `1. 다음 중 올바른 코딩 방식은?
① 오타 없이 코딩한다
② 디버깅 없이 코딩한다
③ 테스트 없이 코딩한다
④ 문서화 없이 코딩한다`;

  // 질문 파싱 함수
  const parsePastedText = (text: string) => {
    try {
      const parsedResult = parseQuestionsImproved(text);
      
      // 빈 이미지 배열 추가하고 타입 맞추기
      const questionsWithImages = parsedResult.questions.map((q) => {
        // 옵션 형식 변환 (기존 옵션 형식이 다르다면)
        const formattedOptions: IOption[] = q.options.map((opt: any, index: number) => ({
          id: `option-${Date.now()}-${index}`,
          content: typeof opt === 'string' ? opt : opt.text
        }));
        
        const now = new Date().toISOString();
        
        return {
          ...q,
          id: typeof q.id === 'number' ? q.id.toString() : q.id,
          options: formattedOptions,
          tags: [] as ITag[],
          images: [] as string[],
          explanationImages: [] as string[],
          created_at: now,
          updated_at: now
        };
      });
      
      setParsedQuestions(questionsWithImages);
      setPasteError(null);
      
      // 첫 번째 문제 선택
      if (questionsWithImages.length > 0) {
        setSelectedQuestionIndex(0);
      }
      
      return true;
    } catch (error) {
      console.error('Error parsing questions:', error);
      setPasteError('문제 파싱 중 오류가 발생했습니다. 형식을 확인해주세요.');
      return false;
    }
  };

  // 정답 설정
  const setQuestionAnswer = (questionIndex: number, answerIndex: number) => {
    setParsedQuestions(prevQuestions => 
      prevQuestions.map((q, idx) => 
        idx === questionIndex 
          ? { ...q, answer: answerIndex } 
          : q
      )
    );
  };

  // 문제 분석 함수
  const handleParseQuestions = (globalTags: string[]) => {
    if (!pasteValue.trim()) return;
    
    setIsProcessing(true);
    try {
      const success = parsePastedText(pasteValue);
      if (success && globalTags.length > 0) {
        // 전체 문제에 공통 태그 적용
        applyTagsToAllQuestions(globalTags);
      }
      setIsProcessing(false);
    } catch (error) {
      console.error("문제 분석 중 오류 발생:", error);
      setPasteError("문제 형식이 올바르지 않습니다. 다시 확인해주세요.");
      setIsProcessing(false);
    }
  };

  // 문제 제출 함수
  const handleSubmit = async () => {
    if (parsedQuestions.length === 0) return;
    
    setIsSubmitting(true);
    try {
      // API 호출 로직 추가...
      setIsSubmitting(false);
      
      // 성공 메시지 (콘솔 로그)
      console.log(`성공: ${parsedQuestions.length}개의 문제가 등록되었습니다.`);
      
      // 양식 초기화
      setParsedQuestions([]);
      setPasteValue('');
      
    } catch (error) {
      console.error("문제 등록 중 오류 발생:", error);
      // 오류 메시지 (콘솔 로그)
      console.error("실패: 문제 등록 중 오류가 발생했습니다.");
      setIsSubmitting(false);
    }
  };

  // 옵션 추가
  const addOption = (questionIndex: number) => {
    setParsedQuestions(prevQuestions => 
      prevQuestions.map((q, idx) => {
        if (idx !== questionIndex) return q;
        
        const newOptionId = `option-${Date.now()}-${q.options.length}`;
        const newOption: IOption = {
          id: newOptionId,
          content: ''
        };
        
        return {
          ...q,
          options: [...q.options, newOption]
        };
      })
    );
  };

  // 옵션 업데이트
  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    setParsedQuestions(prevQuestions => 
      prevQuestions.map((q, idx) => {
        if (idx !== questionIndex) return q;
        
        return {
          ...q,
          options: q.options.map((opt, oIdx) => 
            oIdx === optionIndex ? { ...opt, content: value } : opt
          )
        };
      })
    );
  };

  // 옵션 삭제
  const removeOption = (questionIndex: number, optionIndex: number) => {
    setParsedQuestions(prevQuestions => 
      prevQuestions.map((q, idx) => {
        if (idx !== questionIndex) return q;
        
        // 옵션 삭제
        const newOptions = q.options.filter((_, oIdx) => oIdx !== optionIndex);
        
        // 정답 인덱스 조정
        let newAnswerIndex = q.answer;
        if (newAnswerIndex === null) {
          newAnswerIndex = null;
        } else if (optionIndex === newAnswerIndex) {
          // 현재 삭제된 옵션이 정답이면 null으로 설정
          newAnswerIndex = null;
        } else if (optionIndex < newAnswerIndex) {
          // 삭제된 옵션이 정답보다 앞에 있으면 정답 인덱스 감소
          newAnswerIndex = newAnswerIndex - 1;
        }
        
        return {
          ...q,
          options: newOptions,
          answer: newAnswerIndex
        };
      })
    );
  };

  // 문제별 태그 추가
  const addQuestionTag = (questionIndex: number) => {
    if (!questionTagInput.trim()) return;
    
    setParsedQuestions(prevQuestions => 
      prevQuestions.map((q, idx) => {
        if (idx !== questionIndex) return q;
        
        const newTag: ITag = {
          id: `tag-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: questionTagInput,
          color: 'gray' // 기본 색상
        };
        
        return {
          ...q,
          tags: [...q.tags, newTag]
        };
      })
    );
    
    setQuestionTagInput('');
  };

  // 문제별 태그 삭제
  const removeQuestionTag = (questionIndex: number, tagName: string) => {
    setParsedQuestions(prevQuestions => 
      prevQuestions.map((q, idx) => 
        idx === questionIndex 
          ? {
              ...q,
              tags: q.tags.filter(t => t.name !== tagName)
            }
          : q
      )
    );
  };

  // 문제 이미지 추가
  const addQuestionImage = (questionIndex: number) => {
    // 파일 선택 다이얼로그 열기 로직은 클라이언트 코드로 이동
    console.log("이미지 추가 함수 호출:", questionIndex);
    
    // 여기서는 실제 이미지 업로드 로직 대신 임시 URL 생성
    const dummyImageUrl = `https://via.placeholder.com/300?text=문제이미지_${questionIndex}`;
    
    setParsedQuestions(prevQuestions => 
      prevQuestions.map((q, idx) => 
        idx === questionIndex 
          ? {
              ...q,
              images: [...q.images, dummyImageUrl]
            }
          : q
      )
    );
  };

  // 해설 이미지 추가
  const addExplanationImage = (questionIndex: number) => {
    // 파일 선택 다이얼로그 열기 로직은 클라이언트 코드로 이동
    console.log("해설 이미지 추가 함수 호출:", questionIndex);
    
    // 여기서는 실제 이미지 업로드 로직 대신 임시 URL 생성
    const dummyImageUrl = `https://via.placeholder.com/300?text=해설이미지_${questionIndex}`;
    
    setParsedQuestions(prevQuestions => 
      prevQuestions.map((q, idx) => 
        idx === questionIndex 
          ? {
              ...q,
              explanationImages: [...q.explanationImages, dummyImageUrl]
            }
          : q
      )
    );
  };

  // 해설 텍스트 추가
  const addExplanationText = (questionIndex: number) => {
    if (!explanationText.trim()) return;
    
    setParsedQuestions(prevQuestions => 
      prevQuestions.map((q, idx) => 
        idx === questionIndex 
          ? {
              ...q,
              explanation: explanationText
            }
          : q
      )
    );
    
    setExplanationText('');
  };

  // 전체 문제에 태그 적용
  const applyTagsToAllQuestions = (tags: string[]) => {
    if (!tags.length) return;
    
    setParsedQuestions(prevQuestions => 
      prevQuestions.map(q => {
        const newTags = tags.map(tagName => ({
          id: `tag-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: tagName,
          color: 'gray' // 기본 색상
        }));
        
        // 기존 태그의 이름과 새 태그 이름을 비교해서 중복 제거
        const existingTagNames = q.tags.map(t => t.name);
        const filteredNewTags = newTags.filter(t => !existingTagNames.includes(t.name));
        
        return {
          ...q,
          tags: [...q.tags, ...filteredNewTags]
        };
      })
    );
  };

  return {
    parsedQuestions,
    setParsedQuestions,
    selectedQuestionIndex,
    setSelectedQuestionIndex,
    questionTagInput,
    setQuestionTagInput,
    explanationText,
    setExplanationText,
    pasteError,
    pasteValue,
    setPasteValue,
    isProcessing,
    isSubmitting,
    errorMessage: pasteError,
    hasWarning,
    pasteExample,
    parsePastedText,
    handleParseQuestions,
    setQuestionAnswer,
    addOption,
    updateOption,
    removeOption,
    addQuestionTag,
    removeQuestionTag,
    addImageToQuestion: addQuestionImage,
    addExplanationImageToQuestion: addExplanationImage,
    addExplanationTextToQuestion: addExplanationText,
    applyTagsToAllQuestions,
    handleSubmit
  };
} 