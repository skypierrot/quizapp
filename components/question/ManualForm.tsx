"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { cn, generateId } from "@/lib/utils";
import { Loader2, X, Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ToastType, ToastVariant } from "@/types/toast";
import { convertToBase64, handleImageUpload } from "@/utils/image";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { IParsedQuestion } from "./PasteForm/types";

// 단일 문제를 위한 인터페이스
interface IManualQuestion {
  id?: string;
  number?: number;
  content: string;
  options: Array<{
    number: number;
    text: string;
    images: string[];
  }>;
  answer: number;
  images: string[];
  explanation?: string;
  explanationImages: string[];
  tags: string[];
}

export interface ManualFormProps {
  initialData?: IManualQuestion;
  isEditMode?: boolean;
  questionId?: string;
  onSuccess?: () => void;
  apiMethod?: "POST" | "PUT" | "PATCH";
  apiUrl?: string;
}

export function ManualForm({ 
  initialData, 
  isEditMode = false, 
  questionId,
  onSuccess,
  apiMethod,
  apiUrl
}: ManualFormProps) {
  // 단일 문제 상태 관리
  const [question, setQuestion] = useState<IManualQuestion>(() => {
    if (initialData) {
      return {
        ...initialData,
        // 기존 options 형식이 문자열 배열이면 IOption 형식으로 변환
        options: Array.isArray(initialData.options) && typeof initialData.options[0] === 'string'
          ? (initialData.options as unknown as string[]).map((text, idx) => ({
              number: idx + 1,
              text,
              images: []
            }))
          : initialData.options
      };
    }
    
    return {
      id: generateId(),
      number: 1,
      content: "",
      options: [
        { number: 1, text: "", images: [] },
        { number: 2, text: "", images: [] },
        { number: 3, text: "", images: [] },
        { number: 4, text: "", images: [] }
      ],
      answer: -1,
      explanation: "",
      images: [],
      explanationImages: [],
      tags: []
    };
  });
  
  // 상태 관리
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState<string>("");
  
  // 직접 태그 관련 상태 관리
  const [examName, setExamName] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [session, setSession] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  
  // 초기 데이터가 있는 경우 기본 태그 정보 설정
  useEffect(() => {
    if (initialData && initialData.tags) {
      // 시험명, 년도, 회차, 과목 태그 파싱
      initialData.tags.forEach(tag => {
        if (tag.startsWith('시험명:')) setExamName(tag.replace('시험명:', ''));
        else if (tag.startsWith('년도:')) setYear(tag.replace('년도:', ''));
        else if (tag.startsWith('회차:')) setSession(tag.replace('회차:', ''));
        else if (tag.startsWith('과목:')) setSubject(tag.replace('과목:', ''));
      });
    }
  }, [initialData]);
  
  // 파싱된 질문 상태 (TagManager에서 필요한 형식으로 변환)
  const parsedQuestions: IParsedQuestion[] = [{
    id: question.id || generateId(),
    number: question.number || 1,
    content: question.content,
    options: question.options.map((opt, idx) => ({
      id: generateId(),
      content: opt.text
    })),
    answer: question.answer >= 0 ? question.answer : 0,
    tags: question.tags.map(tag => ({
      id: generateId(),
      name: tag,
      color: 'gray'
    })),
    images: [],
    explanationImages: [],
    examples: [],
    explanation: question.explanation || "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }];
  
  const [parsedQuestionsState, setParsedQuestionsState] = useState<IParsedQuestion[]>(parsedQuestions);
  
  // parsedQuestionsState가 변경될 때 question.tags 업데이트
  useEffect(() => {
    if (parsedQuestionsState.length > 0) {
      setQuestion(prev => ({
        ...prev,
        tags: parsedQuestionsState[0].tags.map(tag => tag.name)
      }));
    }
  }, [parsedQuestionsState]);
  
  // 태그 추가 함수
  const addTag = (tag: string) => {
    // 입력값이 없으면 처리하지 않음
    const trimmedInput = tag.trim();
    if (!trimmedInput) return;
    
    // 중복 태그 확인 (대소문자 구분 없이, 공백 제거 후 비교)
    const isDuplicate = question.tags.some(
      tag => tag.trim().toLowerCase() === trimmedInput.toLowerCase()
    );
    
    if (isDuplicate) {
      toast({
        title: "중복된 태그",
        description: "이미 존재하는 태그입니다.",
      });
      return;
    }
    
    // 문제 태그에 직접 추가
    setQuestion(prev => ({
      ...prev,
      tags: [...prev.tags, trimmedInput],
    }));
    
    // 동시에 파싱된 질문 상태에도 반영
    setParsedQuestionsState(prev => {
      if (prev.length === 0) return prev;
      
      const newTagObject = {
        id: generateId(),
        name: trimmedInput,
        color: 'gray'
      };
      
      return [
        {
          ...prev[0],
          tags: [...prev[0].tags, newTagObject]
        },
        ...prev.slice(1)
      ];
    });
    
    // 입력 필드 초기화
    setTagInput('');
    
    // 디버깅 로그 추가
    console.log("[DEBUG] 태그 추가됨:", trimmedInput);
  };
  
  // 태그 제거 함수
  const removeTag = (tagToRemove: string) => {
    // 문제 태그에서 제거
    setQuestion(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
    
    // 동시에 파싱된 질문 상태에서도 제거
    setParsedQuestionsState(prev => {
      if (prev.length === 0) return prev;
      
      return [
        {
          ...prev[0],
          tags: prev[0].tags.filter(tag => tag.name !== tagToRemove)
        },
        ...prev.slice(1)
      ];
    });
  };
  
  const [activeImageType, setActiveImageType] = useState<'question' | 'explanation' | null>(null);
  const [imageEventProcessing, setImageEventProcessing] = useState(false);
  const [isImageAreaActive, setIsImageAreaActive] = useState(false); // 이미지 영역 활성화 상태
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const explanationRef = useRef<HTMLTextAreaElement>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  
  // 이미지 업로드 참조
  const questionImageInputRef = useRef<HTMLInputElement>(null);
  const explanationImageInputRef = useRef<HTMLInputElement>(null);
  const imageDropzoneRef = useRef<HTMLDivElement>(null);
  const explanationDropzoneRef = useRef<HTMLDivElement>(null);

  // toast 훅 사용
  const { toast } = useToast();

  // 디바운스 함수로 마우스 이벤트 처리
  const setActiveImageTypeWithDebounce = (type: 'question' | 'explanation' | null) => {
    if (imageEventProcessing) {
      console.log("[DEBUG] 이미지 처리 중 - 타입 변경 무시");
      return;
    }
    console.log("[DEBUG] 활성 이미지 타입 설정:", type);
    setTimeout(() => setActiveImageType(type), 50);
  };

  // 이미지 영역 활성화/비활성화 처리
  const handleImageAreaClick = (type: 'question' | 'explanation') => {
    if (imageEventProcessing) return;
    
    if (activeImageType === type && isImageAreaActive) {
      // 이미 활성화된 상태에서 클릭하면 파일 업로드 dialog 열기
      if (type === 'question') {
        questionImageInputRef.current?.click();
      } else {
        explanationImageInputRef.current?.click();
      }
    } else {
      // 비활성화 상태에서 클릭하면 활성화
      setActiveImageType(type);
      setIsImageAreaActive(true);
      console.log("[DEBUG] 이미지 영역 활성화:", type);
    }
  };

  // 이미지 영역 마우스 떠남 처리
  const handleImageAreaMouseLeave = () => {
    // 이미지 처리 중이 아닐 때만 상태 초기화
    if (!imageEventProcessing) {
      console.log("[DEBUG] 마우스가 이미지 영역을 떠남 - 상태 초기화");
      setActiveImageType(null);
      setIsImageAreaActive(false);
    }
  };

  // 전역 붙여넣기 이벤트 리스너 등록
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      console.log("[DEBUG] 글로벌 붙여넣기 이벤트 발생");
      
      if (!activeImageType || imageEventProcessing) {
        console.log("[DEBUG] 붙여넣기 무시 - 활성 타입 없음 또는 처리 중", { 
          activeType: activeImageType, 
          isProcessing: imageEventProcessing 
        });
        return;
      }

      console.log("[DEBUG] 활성 이미지 타입:", activeImageType);
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') === 0) {
          const blob = items[i].getAsFile();
          if (blob) {
            console.log("[DEBUG] 이미지 Blob 감지:", { size: blob.size, type: blob.type });
            setImageEventProcessing(true);
            handleImageBlob(blob, activeImageType === 'explanation')
              .finally(() => {
                setTimeout(() => {
                  setImageEventProcessing(false);
                  console.log("[DEBUG] 이미지 처리 상태 리셋");
                }, 1000);
              });
            e.preventDefault();
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [activeImageType, imageEventProcessing]);

  // 이미지 Blob 처리 함수
  const handleImageBlob = async (blob: File, isExplanation: boolean) => {
    console.log("[DEBUG] 이미지 처리 시작:", { 
      isExplanation, 
      blobSize: blob.size, 
      blobType: blob.type 
    });

    if (!blob) {
      toast({ title: "이미지가 선택되지 않았습니다", variant: "destructive" });
      setImageEventProcessing(false);
      return;
    }
    
    if (blob.size > 10 * 1024 * 1024) {
      toast({ 
        title: "이미지 크기가 너무 큽니다", 
        description: "10MB 이하의 이미지만 업로드 가능합니다", 
        variant: "destructive" 
      });
      setImageEventProcessing(false);
      return;
    }
    
    if (!blob.type.startsWith('image/')) {
      toast({ title: "이미지 파일만 업로드 가능합니다", variant: "destructive" });
      setImageEventProcessing(false);
      return;
    }
    
    try {
      console.log("[DEBUG] 이미지 Base64 변환 중");
      const base64 = await convertToBase64(blob);
      
      // 중복 체크 개선 - 전체 이미지 비교나 해시값 생성 대신 특정 부분만 비교
      if (isExplanation) {
        // 중복 체크: 문자열 시작과 끝부분을 비교하여 효율적으로 중복 확인
        const isDuplicate = question.explanationImages.some(img => {
          if (img.length > 100 && base64.length > 100) {
            return img.substring(0, 100) === base64.substring(0, 100) && 
                   img.substring(img.length - 100) === base64.substring(base64.length - 100);
          }
          return false;
        });
        
        if (isDuplicate) {
          console.log("[DEBUG] 중복 이미지 감지: 해설");
          toast({ 
            title: "이미지 중복", 
            description: "이 이미지는 이미 등록되었습니다.", 
            variant: "warning"
          });
        } else {
          console.log("[DEBUG] 이미지 추가: 해설");
          setQuestion(prev => ({
            ...prev,
            explanationImages: [...prev.explanationImages, base64]
          }));
          
          toast({
            title: "이미지 추가 완료",
            description: "해설 이미지가 추가되었습니다.",
            variant: "success"
          });
        }
      } else {
        // 중복 체크: 문자열 시작과 끝부분을 비교하여 효율적으로 중복 확인
        const isDuplicate = question.images.some(img => {
          if (img.length > 100 && base64.length > 100) {
            return img.substring(0, 100) === base64.substring(0, 100) && 
                   img.substring(img.length - 100) === base64.substring(base64.length - 100);
          }
          return false;
        });
        
        if (isDuplicate) {
          console.log("[DEBUG] 중복 이미지 감지: 문제");
          toast({ 
            title: "이미지 중복", 
            description: "이 이미지는 이미 등록되었습니다.", 
            variant: "warning"
          });
        } else {
          console.log("[DEBUG] 이미지 추가: 문제");
          setQuestion(prev => ({
            ...prev,
            images: [...prev.images, base64]
          }));
          
          toast({
            title: "이미지 추가 완료",
            description: "문제에 이미지가 추가되었습니다.",
            variant: "success"
          });
        }
      }
    } catch (error) {
      console.error("[ERROR] 이미지 처리 실패:", error);
      toast({ 
        title: "이미지 처리 실패", 
        description: "이미지를 처리하는 중 오류가 발생했습니다.", 
        variant: "destructive"
      });
    } finally {
      // 항상 처리 완료 후 상태 리셋 (지연시간 단축)
      setTimeout(() => {
        setImageEventProcessing(false);
        console.log("[DEBUG] 이미지 처리 완료");
      }, 500); // 500ms로 단축
    }
  };

  // TextArea에서 이미지가 붙여넣기 되었을 때 처리
  const handleTextAreaPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const items = e.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') === 0) {
        // 이미지가 발견되었을 때 처리
        console.log('TextArea에 이미지 붙여넣기 감지');
        e.preventDefault(); // 기본 동작 방지
        
        // 커서 위치의 TextArea가 문제 내용인지 해설인지 확인
        if (textarea === contentRef.current) {
          setActiveImageType('question');
        } else if (textarea === explanationRef.current) {
          setActiveImageType('explanation');
        }
        
        setIsImageAreaActive(true);
        
        // 이미지 파일로 변환하여 처리
        const blob = items[i].getAsFile();
        if (blob) {
          setImageEventProcessing(true);
          const isExplanation = textarea === explanationRef.current;
          handleImageBlob(blob, isExplanation)
            .finally(() => {
              setTimeout(() => {
                setImageEventProcessing(false);
              }, 500);
            });
        }
        break;
      }
    }
  };

  // 이미지 업로드 처리
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isExplanation = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 파일 유형 확인
    if (!file.type.startsWith('image/')) {
      toast({
        title: "이미지 추가 실패",
        description: "이미지 파일만 업로드할 수 있습니다.",
        variant: "destructive"
      });
      return;
    }
    
    // 파일 크기 확인 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "이미지 크기가 너무 큽니다",
        description: "10MB 이하의 이미지만 업로드 가능합니다",
        variant: "destructive"
      });
      return;
    }
    
    // Base64로 이미지 변환
    const reader = new FileReader();
    
    reader.onload = (readerEvent) => {
      const base64Url = readerEvent.target?.result as string;
      
      if (isExplanation) {
        // 설명 이미지 업데이트
        setQuestion(prev => ({
          ...prev,
          explanationImages: [...prev.explanationImages, base64Url]
        }));
        toast({
          title: "이미지 추가 완료",
          description: "해설에 이미지가 추가되었습니다.",
          variant: "success"
        });
      } else {
        // 질문 이미지 업데이트
        setQuestion(prev => ({
          ...prev,
          images: [...prev.images, base64Url]
        }));
        toast({
          title: "이미지 추가 완료",
          description: "문제에 이미지가 추가되었습니다.",
          variant: "success"
        });
      }
    };
    
    reader.onerror = () => {
      toast({
        title: "이미지 추가 실패",
        description: "이미지를 처리하는 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    };
    
    reader.readAsDataURL(file);
    
    // 파일 입력 초기화 (동일한 파일 다시 선택할 수 있도록)
    e.target.value = '';
  };

  // 이미지 확대 모달 핸들러 (추가)
  const handleImageZoom = (imageUrl: string) => {
    setZoomedImage(imageUrl);
  };

  // 이미지 삭제 처리
  const removeImage = (index: number, isExplanation = false) => {
    if (isExplanation) {
      setQuestion(prev => ({
        ...prev,
        explanationImages: prev.explanationImages.filter((_, i) => i !== index)
      }));
    } else {
      setQuestion(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    }
    
    toast({
      title: "이미지 삭제 완료",
      description: `${isExplanation ? '해설' : '문제'}의 이미지가 삭제되었습니다.`
    });
  };

  // 선택지 추가
  const addOption = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setQuestion(prev => ({
      ...prev,
      options: [...prev.options, { number: prev.options.length + 1, text: "", images: [] }]
    }));
  };

  // 선택지 삭제
  const removeOption = (index: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    setQuestion(prev => {
      // 선택지 필터링
      const newOptions = prev.options.filter((_, i) => i !== index);
      
      // 정답 인덱스 조정
      let newAnswer = prev.answer;
      
      if (prev.answer === index) {
        // 삭제된 옵션이 현재 정답이었다면 정답 선택 취소
        newAnswer = -1;
        toast({
          title: "알림",
          description: "선택한 정답이 삭제되었습니다."
        });
      } else if (prev.answer > index) {
        // 삭제된 옵션보다 뒤에 있는 옵션이 정답이었다면 인덱스 조정
        newAnswer = prev.answer - 1;
      }
      
      return {
        ...prev,
        options: newOptions,
        answer: newAnswer
      };
    });
  };

  // 선택지 업데이트
  const updateOption = (index: number, value: string) => {
    setQuestion(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? { ...opt, text: value } : opt)
    }));
  };

  // 정답 설정
  const setQuestionAnswer = (answerIndex: number) => {
    console.log(`정답 선택: ${answerIndex}`);
    
    setQuestion(prev => {
      // 토글 방식 - 동일한 답변을 다시 클릭하면 선택 취소
      const newAnswer = prev.answer === answerIndex ? -1 : answerIndex;
      
      console.log(`정답 변경: ${prev.answer} -> ${newAnswer}`);
      
      // 토스트 메시지 표시
      if (prev.answer !== answerIndex) {
        if (newAnswer >= 0) {
          toast({
            title: "정답이 선택되었습니다",
            description: `정답: ${newAnswer + 1}번`
          });
        } else {
          toast({
            title: "정답 선택이 취소되었습니다"
          });
        }
      }
      
      return { ...prev, answer: newAnswer };
    });
  };

  // 기본 태그 적용 (시험명, 년도, 회차, 과목)
  const applyBasicTags = () => {
    // 필수 태그 유효성 검사
    const isExamNameValid = !!examName.trim();
    const isYearValid = !!year.trim();
    const isSessionValid = !!session.trim();
    
    // 필수 태그가 비어있으면 경고 표시 후 중단
    if (!isExamNameValid || !isYearValid || !isSessionValid) {
      toast({
        title: "필수 태그를 모두 입력해주세요",
        description: "시험명, 년도, 회차는 필수 입력 항목입니다."
      });
      return false;
    }
    
    const tagsToAdd: string[] = [];
    
    // 필수 태그 추가
    tagsToAdd.push(`시험명:${examName.trim()}`);
    tagsToAdd.push(`년도:${year.trim()}`);
    tagsToAdd.push(`회차:${session.trim()}`);
    
    // 과목은 선택 사항 - 입력된 경우에만 추가
    if (subject.trim()) {
      tagsToAdd.push(`과목:${subject.trim()}`);
    }
    
    // 기존 태그에서 기본 태그(시험명, 년도, 회차, 과목) 제거
    const filteredTags = question.tags.filter(tag => 
      !(tag.startsWith('시험명:') || tag.startsWith('년도:') || 
        tag.startsWith('회차:') || tag.startsWith('과목:'))
    );
    
    // 새 태그 설정
    setQuestion(prev => ({
      ...prev,
      tags: [...filteredTags, ...tagsToAdd]
    }));
    
    // 파싱된 질문 상태에도 반영
    setParsedQuestionsState(prev => {
      if (prev.length === 0) return prev;
      
      // 기존 태그에서 기본 태그 제거
      const filteredParsedTags = prev[0].tags.filter(tag => 
        !(tag.name.startsWith('시험명:') || tag.name.startsWith('년도:') || 
          tag.name.startsWith('회차:') || tag.name.startsWith('과목:'))
      );
      
      // 새 기본 태그 생성
      const newTagObjects = tagsToAdd.map(tagName => ({
        id: generateId(),
        name: tagName,
        color: 'gray'
      }));
      
      return [
        {
          ...prev[0],
          tags: [...filteredParsedTags, ...newTagObjects]
        },
        ...prev.slice(1)
      ];
    });
    
    toast({
      title: "태그가 적용되었습니다",
      description: `${tagsToAdd.length}개의 기본 태그가 적용되었습니다.`
    });
    
    return true;
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.content) {
      toast({
        title: "문제 내용을 입력하세요",
        variant: "destructive"
      });
      return;
    }
    
    if (question.options.some(opt => !opt.text)) {
      toast({
        title: "모든 선택지를 입력하세요",
        variant: "destructive"
      });
      return;
    }
    
    if (question.answer < 0) {
      toast({
        title: "정답을 선택하세요",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);

    // 기본 태그 설정
    if (!applyBasicTags()) {
      toast({
        title: "필수 태그를 올바르게 입력하세요",
        description: "시험명, 년도, 회차는 필수 입력 항목입니다.",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // API 호출 시 IOption을 문자열 배열로 변환
      const apiData = {
        content: question.content,
        options: question.options.map(opt => opt.text),
        answer: question.answer,
        explanation: question.explanation || "",
        images: question.images || [],
        explanationImages: question.explanationImages || [],
        tags: question.tags,
        updatedAt: new Date()
      };
      
      console.log('문제 저장/수정 데이터:', apiData);
      
      // 커스텀 URL과 메서드 사용 또는 기본값 설정
      const url = apiUrl || (isEditMode ? `/api/questions/${questionId}` : "/api/questions");
      const method = apiMethod || (isEditMode ? "PATCH" : "POST");
      
      console.log('API 요청 정보:', { url, method });
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(apiData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "문제 저장 중 오류가 발생했습니다.");
      }
      
      const responseData = await response.json();
      
      toast({
        title: isEditMode ? "문제 수정 완료" : "문제 등록 완료",
        description: responseData.message
      });
      
      // 성공 콜백이 있으면 호출
      if (onSuccess) {
        onSuccess();
      } else {
        // 성공 후 폼 초기화 (새로운 문제 등록 모드에서만)
        if (!isEditMode) {
          setQuestion({
            id: generateId(),
            number: 1,
            content: "",
            options: [
              { number: 1, text: "", images: [] },
              { number: 2, text: "", images: [] },
              { number: 3, text: "", images: [] },
              { number: 4, text: "", images: [] }
            ],
            answer: -1,
            explanation: "",
            images: [],
            explanationImages: [],
            tags: []
          });
        }
      }
    } catch (error) {
      console.error("문제 저장 오류:", error);
      toast({
        title: "문제 저장 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 컴포넌트 마운트 시 전역 마우스 이벤트 리스너 등록
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      // 이미지 영역이 활성화된 상태일 때만 처리
      if (isImageAreaActive && !imageEventProcessing) {
        // 마우스가 현재 이미지 영역 내부에 있는지 확인 (data-image-area 속성 사용)
        const isMouseOverImageArea = (e.target as Element)?.closest('[data-image-area="true"]');
        
        // 마우스가 어느 이미지 영역에도 없으면 상태 초기화
        if (!isMouseOverImageArea) {
          console.log("[DEBUG] 마우스가 모든 이미지 영역을 벗어남 - 상태 초기화");
          setActiveImageType(null);
          setIsImageAreaActive(false);
        }
      }
    };
    
    // 문서 클릭 시에도 이미지 영역 밖을 클릭하면 활성화 상태 초기화
    const handleDocumentClick = (e: MouseEvent) => {
      if (isImageAreaActive && !imageEventProcessing) {
        const isClickOnImageArea = (e.target as Element)?.closest('[data-image-area="true"]');
        if (!isClickOnImageArea) {
          console.log("[DEBUG] 이미지 영역 외부 클릭 - 상태 초기화");
          setActiveImageType(null);
          setIsImageAreaActive(false);
        }
      }
    };
    
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [isImageAreaActive, imageEventProcessing]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6" onKeyDown={(e) => {
      // 태그 입력 필드에서 Enter 키를 누를 때 폼 제출을 방지
      if (e.key === 'Enter' && e.target instanceof HTMLInputElement && e.target.name === 'tagInput') {
        e.preventDefault();
      }
    }}>
      {/* 태그 관리 섹션을 문제 내용 위로 이동 */}
      <div className="space-y-4">
        <div className="flex flex-col">
          <h3 className="text-base font-medium mb-2">태그 관리</h3>
          
          {/* 기본 태그 설정 (시험명, 년도, 회차, 과목) */}
          <div className="mb-4 p-3 border border-gray-200 rounded-md bg-gray-50">
            <div className="w-full">
              <h4 className="text-sm font-medium mb-2">기본 태그 설정</h4>
              <p className="text-xs text-gray-500 mb-3">
                <span className="text-red-500 font-bold">*</span> 표시는 필수 입력 항목입니다
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <div className="flex items-center gap-2">
                <label className="text-sm whitespace-nowrap font-medium">
                  시험명: <span className="text-red-500 font-bold">*</span>
                </label>
                <Input 
                  type="text" 
                  value={examName} 
                  onChange={(e) => setExamName(e.target.value)}
                  onCompositionEnd={(e) => setExamName((e.target as HTMLInputElement).value)}
                  className={`w-32 h-8 text-sm ${!examName.trim() ? 'border-red-300' : ''}`}
                  placeholder="산업안전기사"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm whitespace-nowrap font-medium">
                  년도: <span className="text-red-500 font-bold">*</span>
                </label>
                <Input 
                  type="text" 
                  value={year} 
                  onChange={(e) => setYear(e.target.value)}
                  onCompositionEnd={(e) => setYear((e.target as HTMLInputElement).value)}
                  className={`w-20 h-8 text-sm ${!year.trim() ? 'border-red-300' : ''}`}
                  placeholder="2024"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm whitespace-nowrap font-medium">
                  회차: <span className="text-red-500 font-bold">*</span>
                </label>
                <Input 
                  type="text" 
                  value={session} 
                  onChange={(e) => setSession(e.target.value)}
                  onCompositionEnd={(e) => setSession((e.target as HTMLInputElement).value)}
                  className={`w-20 h-8 text-sm ${!session.trim() ? 'border-red-300' : ''}`}
                  placeholder="1회"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm whitespace-nowrap">과목:</label>
                <Input 
                  type="text" 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value)}
                  onCompositionEnd={(e) => setSubject((e.target as HTMLInputElement).value)}
                  className="w-32 h-8 text-sm" 
                  placeholder="안전관리 (선택)"
                />
              </div>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={applyBasicTags}
                className="whitespace-nowrap ml-auto"
              >
                태그 적용
              </Button>
            </div>
          </div>
          
          {/* 태그 입력 */}
          <div className="mb-4 p-3 border border-gray-200 rounded-md">
            <h4 className="text-sm font-medium mb-2">추가 태그</h4>
            <div className="flex gap-2 mb-2">
              <Input 
                type="text" 
                name="tagInput"
                value={tagInput} 
                onChange={(e) => {
                  // 값을 직접 업데이트
                  setTagInput(e.target.value);
                }}
                onCompositionEnd={(e) => {
                  // 한글 입력 완료 후 상태 업데이트를 안정적으로 처리
                  setTagInput((e.target as HTMLInputElement).value);
                }}
                className="text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    console.log("[DEBUG] Enter키 입력됨. 현재 tagInput:", tagInput);
                    if (tagInput.trim()) {
                      // 현재 입력값을 저장
                      const inputValue = tagInput.trim();
                      // 입력값 초기화
                      setTagInput('');
                      // 태그 추가
                      addTag(inputValue);
                    }
                  }
                }}
                placeholder="예: 필기, 핵심개념, 중요문제 등"
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={(e) => {
                  e.preventDefault();
                  console.log("[DEBUG] 추가 버튼 클릭됨. 현재 tagInput:", tagInput);
                  if (tagInput.trim()) {
                    // 현재 입력값을 저장
                    const inputValue = tagInput.trim();
                    // 입력값 초기화
                    setTagInput('');
                    // 태그 추가
                    addTag(inputValue);
                  }
                }}
              >
                추가
              </Button>
            </div>
            <p className="text-xs text-gray-500 mb-2">
              기본 태그 외에 추가로 문제를 분류할 태그를 입력하세요. 입력 후 Enter 또는 추가 버튼을 클릭하세요.
            </p>
            {question.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {question.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                    {tag}
                    <button 
                      type="button" 
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 문제 내용 */}
      <div>
        <label className="block mb-2 font-medium">문제 내용</label>
        
        <div className="relative border border-dashed border-blue-300 rounded-md transition-all hover:border-blue-500 mb-4">
          <Textarea
            ref={contentRef}
            value={question.content}
            onChange={(e) => setQuestion({...question, content: e.target.value})}
            onPaste={handleTextAreaPaste}
            className="min-h-[100px]"
            placeholder="문제 내용을 입력하세요."
          />
          <div className="absolute bottom-2 right-2 pointer-events-none flex items-center">
            <div className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm flex items-center gap-1 border border-blue-200">
              <span className="text-xs text-gray-600">
                문제 내용을 입력하세요
              </span>
            </div>
          </div>
        </div>
        
        {/* 문제 이미지 첨부 영역 */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">문제 이미지 첨부</Label>
          <div 
            ref={imageDropzoneRef}
            data-image-area="true"
            onClick={(e) => {
              e.stopPropagation();
              handleImageAreaClick('question');
            }}
            onMouseEnter={() => {
              if (activeImageType === 'question' && isImageAreaActive) {
                console.log("[DEBUG] 마우스가 문제 이미지 영역에 들어옴 - 활성 상태 유지");
                // 이미 활성화된 상태라면 계속 유지
                setActiveImageType('question');
              }
            }}
            onMouseLeave={(e) => {
              e.stopPropagation();
              handleImageAreaMouseLeave();
            }}
            className={cn(
              "flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-md transition-colors cursor-pointer",
              isImageAreaActive && activeImageType === 'question'
                ? "border-blue-300 bg-blue-50/60" // 옅은 파란색 점선 테두리와 음영
                : "border-gray-300 hover:border-gray-400" // 검정색 대신 회색으로 변경
            )}
          >
            <div className="flex flex-col items-center justify-center h-10">
              <ImageIcon className="w-5 h-5 text-gray-400" />
              <p className="mt-1 text-sm text-gray-500">
                {isImageAreaActive && activeImageType === 'question' 
                  ? "한 번더 클릭 또는 Ctrl+V 하여 이미지 추가" 
                  : "한번 클릭하여 영역활성화"}
              </p>
            </div>
          </div>
          <input 
            ref={questionImageInputRef}
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={(e) => handleImageUpload(e, false)}
          />
        </div>
        
        {/* 문제 이미지 갤러리 - PasteForm 스타일로 변경 */}
        {question.images.length > 0 && (
          <div className="mb-4 grid grid-cols-1 gap-4">
            {question.images.map((img, idx) => (
              <div 
                key={`img-${idx}`} 
                className="relative group overflow-hidden rounded-lg border shadow-sm"
              >
                <Button 
                  type="button" 
                  size="sm" 
                  variant="destructive"
                  onClick={() => removeImage(idx, false)}
                  className="absolute top-2 right-2 h-6 w-6 p-0 rounded-full z-10 opacity-70 
                           group-hover:opacity-100 transition-opacity bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-700 border-none"
                >
                  <X className="h-4 w-4" />
                </Button>
                <div 
                  className="w-full transition-transform duration-300 hover:scale-105 cursor-zoom-in"
                  onClick={() => handleImageZoom(img)}
                >
                  <img 
                    src={img} 
                    alt={`문제 이미지 ${idx+1}`} 
                    className="w-full max-h-[300px] object-contain" 
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 선택지 */}
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm font-medium text-gray-700">정답 선택: <span className="text-gray-900 font-bold">{question.answer >= 0 ? `${question.answer + 1}번` : "선택 안됨"}</span></p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addOption}
            className="text-xs h-8 px-2"
          >
            <Plus className="h-4 w-4 mr-1" /> 선택지 추가
          </Button>
        </div>
        
        <div className="space-y-3">
          {question.options.map((option, index) => (
            <div 
              key={`option-${index}`} 
              className={`flex gap-2 items-center hover:bg-gray-50 p-2 rounded-lg border-2 transition-all duration-200 ${
                question.answer === index 
                  ? 'border-gray-800 bg-gray-50/80' 
                  : 'border-gray-200'
              }`}
            >
              <div 
                onClick={() => setQuestionAnswer(index)}
                className={`flex items-center justify-center h-10 w-10 rounded-full text-sm font-bold cursor-pointer transition-all duration-200 ${
                  question.answer === index 
                    ? 'bg-gray-800 text-white shadow-sm ring-2 ring-gray-300' 
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                {index + 1}
              </div>
              <Input
                value={option.text}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`선택지 ${index + 1}의 내용`}
                className={`flex-1 text-sm border-gray-200 focus:ring-1 focus:ring-gray-400 ${
                  question.answer === index ? 'bg-white' : ''
                }`}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => removeOption(index, e)}
                className="h-10 w-10 rounded-full p-0 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* 해설 */}
      <div>
        <label className="block mb-2 font-medium">해설 (선택사항)</label>
        
        {/* 해설 이미지 갤러리 - PasteForm 스타일로 변경 */}
        {question.explanationImages.length > 0 && (
          <div className="mb-4 grid grid-cols-1 gap-4">
            {question.explanationImages.map((img, idx) => (
              <div 
                key={`exp-img-${idx}`} 
                className="relative group overflow-hidden rounded-lg border shadow-sm"
              >
                <Button 
                  type="button" 
                  size="sm" 
                  variant="destructive"
                  onClick={() => removeImage(idx, true)}
                  className="absolute top-2 right-2 h-6 w-6 p-0 rounded-full z-10 opacity-70 
                           group-hover:opacity-100 transition-opacity bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-700 border-none"
                >
                  <X className="h-4 w-4" />
                </Button>
                <div 
                  className="w-full transition-transform duration-300 hover:scale-105 cursor-zoom-in"
                  onClick={() => handleImageZoom(img)}
                >
                  <img 
                    src={img} 
                    alt={`해설 이미지 ${idx+1}`} 
                    className="w-full max-h-[300px] object-contain" 
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* 해설 이미지 첨부 영역 */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">해설 이미지 첨부</Label>
          <div 
            ref={explanationDropzoneRef}
            data-image-area="true"
            onClick={(e) => {
              e.stopPropagation();
              handleImageAreaClick('explanation');
            }}
            onMouseEnter={() => {
              if (activeImageType === 'explanation' && isImageAreaActive) {
                console.log("[DEBUG] 마우스가 해설 이미지 영역에 들어옴 - 활성 상태 유지");
                // 이미 활성화된 상태라면 계속 유지
                setActiveImageType('explanation');
              }
            }}
            onMouseLeave={(e) => {
              e.stopPropagation();
              handleImageAreaMouseLeave();
            }}
            className={cn(
              "flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-md transition-colors cursor-pointer",
              isImageAreaActive && activeImageType === 'explanation'
                ? "border-blue-300 bg-blue-50/60" // 옅은 파란색 점선 테두리와 음영
                : "border-gray-300 hover:border-gray-400" // 검정색 대신 회색으로 변경
            )}
          >
            <div className="flex flex-col items-center justify-center h-10">
              <ImageIcon className="w-5 h-5 text-gray-400" />
              <p className="mt-1 text-sm text-gray-500">
                {isImageAreaActive && activeImageType === 'explanation' 
                  ? "한 번더 클릭 또는 Ctrl+V 하여 이미지 추가" 
                  : "한번 클릭하여 영역활성화"}
              </p>
            </div>
          </div>
          <input 
            ref={explanationImageInputRef}
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={(e) => handleImageUpload(e, true)}
          />
        </div>
        
        <div className="relative border border-dashed border-blue-300 rounded-md transition-all hover:border-blue-500">
          <Textarea
            ref={explanationRef}
            value={question.explanation || ""}
            onChange={(e) => setQuestion({...question, explanation: e.target.value})}
            onPaste={handleTextAreaPaste}
            className="min-h-[100px]"
            placeholder="해설 내용을 입력하세요. (선택사항)"
          />
          <div className="absolute bottom-2 right-2 pointer-events-none flex items-center">
            <div className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm flex items-center gap-1 border border-blue-200">
              <span className="text-xs text-gray-600">
                해설 내용을 입력하세요
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 제출 버튼 */}
      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting 
            ? (isEditMode ? "수정 중..." : "등록 중...") 
            : (isEditMode ? "문제 수정하기" : "문제 등록하기")}
        </Button>
      </div>

      {/* 이미지 확대 모달 추가 */}
      <Dialog open={!!zoomedImage} onOpenChange={(open) => !open && setZoomedImage(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden border-0">
          {zoomedImage && (
            <div className="w-full h-full flex items-center justify-center bg-black bg-opacity-90 p-4">
              <img
                src={zoomedImage}
                alt="큰 이미지 보기"
                className="max-w-full max-h-[80vh] object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </form>
  );
}