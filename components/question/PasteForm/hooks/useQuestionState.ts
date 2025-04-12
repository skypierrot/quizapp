import { useState } from 'react';
import { IParsedQuestion } from '../types';
import { parseQuestionsImproved } from '@/utils/questionParser';
import { toast } from '@/components/ui/use-toast';

export default function useQuestionState() {
  const [questions, setQuestions] = useState<IParsedQuestion[]>([]);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(-1);
  const [questionTagInput, setQuestionTagInput] = useState<string>('');
  const [explanationText, setExplanationText] = useState<string>('');
  const [pasteError, setPasteError] = useState<string | null>(null);

  // 질문 파싱 함수
  const parsePastedText = (text: string) => {
    try {
      const parsedResult = parseQuestionsImproved(text);
      
      // 빈 이미지 배열 추가
      const questionsWithImages = parsedResult.questions.map((q) => ({
        ...q,
        images: [],
        explanationImages: []
      }));
      
      setQuestions(questionsWithImages);
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
  const setAnswer = (questionIndex: number, answerIndex: number) => {
    setQuestions(prevQuestions => 
      prevQuestions.map((q, idx) => 
        idx === questionIndex 
          ? { ...q, answer: answerIndex } 
          : q
      )
    );
  };

  // 옵션 추가
  const addOption = (questionIndex: number) => {
    setQuestions(prevQuestions => 
      prevQuestions.map((q, idx) => 
        idx === questionIndex 
          ? { ...q, options: [...q.options, ''] } 
          : q
      )
    );
  };

  // 옵션 업데이트
  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    setQuestions(prevQuestions => 
      prevQuestions.map((q, idx) => 
        idx === questionIndex 
          ? { 
              ...q, 
              options: q.options.map((opt, oIdx) => 
                oIdx === optionIndex ? value : opt
              ) 
            } 
          : q
      )
    );
  };

  // 옵션 삭제
  const removeOption = (questionIndex: number, optionIndex: number) => {
    setQuestions(prevQuestions => 
      prevQuestions.map((q, idx) => {
        if (idx !== questionIndex) return q;
        
        // 옵션 삭제
        const newOptions = q.options.filter((_, oIdx) => oIdx !== optionIndex);
        
        // 정답 인덱스 조정
        let newAnswerIndex = q.answer;
        if (optionIndex === q.answer) {
          // 현재 삭제된 옵션이 정답이면 0으로 설정
          newAnswerIndex = 0;
        } else if (optionIndex < q.answer) {
          // 삭제된 옵션이 정답보다 앞에 있으면 정답 인덱스 감소
          newAnswerIndex = q.answer - 1;
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
    
    setQuestions(prevQuestions => 
      prevQuestions.map((q, idx) => 
        idx === questionIndex 
          ? { 
              ...q, 
              tags: q.tags 
                ? [...q.tags, questionTagInput] 
                : [questionTagInput] 
            } 
          : q
      )
    );
    
    setQuestionTagInput('');
  };

  // 문제별 태그 삭제
  const removeQuestionTag = (questionIndex: number, tag: string) => {
    setQuestions(prevQuestions => 
      prevQuestions.map((q, idx) => 
        idx === questionIndex 
          ? { 
              ...q, 
              tags: q.tags ? q.tags.filter(t => t !== tag) : [] 
            } 
          : q
      )
    );
  };

  // 문제 이미지 추가
  const addQuestionImage = (questionIndex: number, imageUrl: string) => {
    setQuestions(prevQuestions => 
      prevQuestions.map((q, idx) => 
        idx === questionIndex 
          ? { 
              ...q, 
              images: [...q.images, imageUrl]
            } 
          : q
      )
    );
  };

  // 문제 이미지 삭제
  const removeQuestionImage = (questionIndex: number, imageUrl: string) => {
    setQuestions(prevQuestions => 
      prevQuestions.map((q, idx) => 
        idx === questionIndex 
          ? { 
              ...q, 
              images: q.images.filter(img => img !== imageUrl)
            } 
          : q
      )
    );
  };

  // 해설 이미지 추가
  const addExplanationImage = (questionIndex: number, imageUrl: string) => {
    setQuestions(prevQuestions => 
      prevQuestions.map((q, idx) => 
        idx === questionIndex 
          ? { 
              ...q, 
              explanationImages: q.explanationImages 
                ? [...q.explanationImages, imageUrl] 
                : [imageUrl]
            } 
          : q
      )
    );
  };

  // 해설 이미지 삭제
  const removeExplanationImage = (questionIndex: number, imageUrl: string) => {
    setQuestions(prevQuestions => 
      prevQuestions.map((q, idx) => 
        idx === questionIndex 
          ? { 
              ...q, 
              explanationImages: q.explanationImages 
                ? q.explanationImages.filter(img => img !== imageUrl)
                : []
            } 
          : q
      )
    );
  };

  // 해설 텍스트 추가
  const addExplanationText = (questionIndex: number, text?: string) => {
    const explanationToAdd = text || explanationText;
    if (!explanationToAdd.trim()) return;
    
    setQuestions(prevQuestions => 
      prevQuestions.map((q, idx) => 
        idx === questionIndex 
          ? { 
              ...q, 
              explanation: explanationToAdd
            } 
          : q
      )
    );
    
    setExplanationText('');
  };

  // 전체 문제에 태그 적용
  const applyTagsToAllQuestions = (tags: string[]) => {
    if (!tags.length) return;
    
    setQuestions(prevQuestions => 
      prevQuestions.map(q => ({ 
        ...q, 
        tags: q.tags 
          ? Array.from(new Set([...q.tags, ...tags])) 
          : [...tags] 
      }))
    );
  };

  return {
    questions,
    setQuestions,
    selectedQuestionIndex,
    setSelectedQuestionIndex,
    questionTagInput,
    setQuestionTagInput,
    explanationText,
    setExplanationText,
    pasteError,
    setPasteError,
    parsePastedText,
    setAnswer,
    addOption,
    updateOption,
    removeOption,
    addQuestionTag,
    removeQuestionTag,
    addQuestionImage,
    removeQuestionImage,
    addExplanationImage,
    removeExplanationImage,
    addExplanationText,
    applyTagsToAllQuestions
  };
} 