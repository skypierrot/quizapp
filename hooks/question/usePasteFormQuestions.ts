import { useState, useRef, useEffect, ChangeEvent, CompositionEvent } from 'react'
import { parseQuestionsImproved } from '@/utils/questionParser'
import { IQuestion } from '@/types'
import { ToastVariant } from '@/types/toast'

interface IParsedQuestion {
  content: string;
  options: string[];
  answer: number;
  images: string[];
  explanation?: string;
  explanationImages?: string[];
  tags?: string[];
}

export function usePasteFormQuestions(initialData?: IQuestion) {
  // 상태 정의
  const [pasteValue, setPasteValue] = useState("")
  const [parsedQuestions, setParsedQuestions] = useState<IParsedQuestion[]>(() => {
    if (initialData) {
      return [{
        content: initialData.content,
        options: Array.isArray(initialData.options) && typeof initialData.options[0] === 'string'
          ? initialData.options as unknown as string[]
          : initialData.options.map((opt: any) => opt.text || ""),
        answer: initialData.answer,
        images: Array.isArray(initialData.images) 
          ? initialData.images.map(img => typeof img === 'string' ? img : (img as any)?.path || "") 
          : [],
        explanation: initialData.explanation || "",
        explanationImages: Array.isArray(initialData.explanationImages) 
          ? initialData.explanationImages.map(img => typeof img === 'string' ? img : (img as any)?.path || "") 
          : [],
        tags: (initialData as any).tags || [],
      }];
    }
    return [];
  });
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(-1)
  const [globalTagInput, setGlobalTagInput] = useState("")
  const [globalTags, setGlobalTags] = useState<string[]>(() => {
    if (initialData?.tags) {
      return initialData.tags as string[];
    }
    return [];
  })
  const [questionTagInput, setQuestionTagInput] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [hasWarning, setHasWarning] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 문제 파싱
  const handleParseQuestions = () => {
    setIsProcessing(true)
    setErrorMessage("")
    setHasWarning(false)
    try {
      if (!pasteValue.trim()) {
        throw new Error("문제 내용을 입력해주세요.")
      }
      const parsedData = parseQuestionsImproved(pasteValue);
      if (parsedData.errors.length > 0) {
        setHasWarning(true);
        console.warn("문제 파싱 중 경고:", parsedData.errors);
      }
      if (parsedData.questions.length === 0) {
        throw new Error("파싱할 수 있는 문제가 없습니다. 형식을 확인해주세요.")
      }
      const parsedDataQuestions: IParsedQuestion[] = parsedData.questions.map(q => ({
        content: q.content,
        options: q.options.map(opt => typeof opt === 'string' ? opt : (opt as any).text || ""),
        answer: -1,
        images: [],
        explanation: "",
        explanationImages: [],
        tags: globalTags,
      }));
      setParsedQuestions(parsedDataQuestions)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.")
      setParsedQuestions([])
    } finally {
      setIsProcessing(false)
    }
  }

  // 옵션 관련
  const addOption = (questionIndex: number) => {
    setParsedQuestions(prevQuestions => 
      prevQuestions.map((q, idx) => 
        idx === questionIndex 
          ? { ...q, options: [...q.options, '새 선택지'] }
          : q
      )
    );
  };
  const updateOption = (questionIndex: number, optionIndex: number, text: string) => {
    setParsedQuestions(prevQuestions => 
      prevQuestions.map((q, idx) => 
        idx === questionIndex 
          ? {
              ...q,
              options: q.options.map((opt, oIdx) => 
                oIdx === optionIndex ? text : opt
              )
            }
          : q
      )
    );
  };
  const removeOption = (questionIndex: number, optionIndex: number) => {
    setParsedQuestions(prevQuestions => 
      prevQuestions.map((q, idx) => {
        if (idx !== questionIndex) return q;
        const newOptions = q.options.filter((_, oIdx) => oIdx !== optionIndex);
        let newAnswer = q.answer;
        if (q.answer === optionIndex) {
          newAnswer = -1;
        } else if (q.answer > optionIndex) {
          newAnswer = q.answer - 1;
        }
        return { ...q, options: newOptions, answer: newAnswer };
      })
    );
  };
  const setQuestionAnswer = (questionIndex: number, optionIndex: number) => {
    setParsedQuestions(prevQuestions => {
      const updatedQuestions = JSON.parse(JSON.stringify(prevQuestions));
      const currentQuestion = updatedQuestions[questionIndex];
      if (!currentQuestion) return prevQuestions;
      const currentAnswer = currentQuestion.answer;
      if (currentAnswer === optionIndex) {
        currentQuestion.answer = -1;
      } else {
        currentQuestion.answer = optionIndex;
      }
      return updatedQuestions;
    });
  };

  // 태그 관련
  const addGlobalTag = () => {
    if (globalTagInput.trim() === '') return;
    if (!globalTags.includes(globalTagInput.trim())) {
      const newTags = [...globalTags, globalTagInput.trim()];
      setGlobalTags(newTags);
      if (parsedQuestions.length > 0) {
        setParsedQuestions(prev => prev.map(q => ({
          ...q,
          tags: [...(q.tags || []), globalTagInput.trim()]
        })));
      }
    }
    setGlobalTagInput('');
  };
  const removeGlobalTag = (tagToRemove: string) => {
    const newTags = globalTags.filter(tag => tag !== tagToRemove);
    setGlobalTags(newTags);
    if (parsedQuestions.length > 0) {
              setParsedQuestions(prev => prev.map(q => ({
          ...q,
          tags: (q.tags || []).filter(tag => tag !== tagToRemove)
        })));
    }
  };
  const addQuestionTag = (questionIndex: number) => {
    if (questionTagInput.trim() === '') return;
    setParsedQuestions(prevQuestions => 
      prevQuestions.map((q, idx) => {
        if (idx !== questionIndex) return q;
        const currentTags = q.tags || [];
        if (!currentTags.some(tag => tag === questionTagInput.trim())) {
          return { 
            ...q, 
            tags: [...currentTags, questionTagInput.trim()]
          };
        }
        return q;
      })
    );
    setQuestionTagInput('');
  };
  const removeQuestionTag = (questionIndex: number, tagToRemove: string) => {
    setParsedQuestions(prevQuestions => 
      prevQuestions.map((q, idx) => {
        if (idx !== questionIndex) return q;
        const currentTags = q.tags || [];
        return { ...q, tags: currentTags.filter(tag => tag !== tagToRemove) };
      })
    );
  };
  const applyBasicTags = (examName: string, year: string, session: string, subject: string) => {
    const tagsToAdd: string[] = [];
    if (!examName.trim() || !year.trim() || !session.trim()) {
      return;
    }
    tagsToAdd.push(`시험명:${examName.trim()}`);
    tagsToAdd.push(`년도:${year.trim()}`);
    tagsToAdd.push(`회차:${session.trim()}`);
    if (subject.trim()) {
      tagsToAdd.push(`과목:${subject.trim()}`);
    }
    const newGlobalTags = [
      ...globalTags.filter(tag => !tag.startsWith('시험명:') && !tag.startsWith('년도:') && 
                            !tag.startsWith('회차:') && !tag.startsWith('과목:')),
      ...tagsToAdd
    ];
    setGlobalTags(newGlobalTags);
    if (parsedQuestions.length > 0) {
      setParsedQuestions(prev => prev.map(q => {
        const currentTags = q.tags || [];
        const filteredTags = currentTags.filter(tag => 
          !tag.startsWith('시험명:') && !tag.startsWith('년도:') && 
          !tag.startsWith('과목:') && !tag.startsWith('회차:')
        );
        return {
          ...q,
          tags: [...filteredTags, ...tagsToAdd]
        };
      }));
    }
  };

  // 텍스트 영역 붙여넣기 방지
  const handleTextAreaPaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i]?.type.indexOf('image') === 0) {
        e.preventDefault();
        return;
      }
    }
  };

  return {
    pasteValue, setPasteValue,
    parsedQuestions, setParsedQuestions,
    selectedQuestionIndex, setSelectedQuestionIndex,
    globalTagInput, setGlobalTagInput,
    globalTags, setGlobalTags,
    questionTagInput, setQuestionTagInput,
    errorMessage, setErrorMessage,
    isProcessing, setIsProcessing,
    hasWarning, setHasWarning,
    textareaRef,
    handleParseQuestions,
    addOption, updateOption, removeOption, setQuestionAnswer,
    addGlobalTag, removeGlobalTag, addQuestionTag, removeQuestionTag, applyBasicTags,
    handleTextAreaPaste,
  }
} 