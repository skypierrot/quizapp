"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef, useEffect, ChangeEvent, CompositionEvent } from "react";
import { useToast } from "@/components/ui/use-toast";
import { cn, generateId } from "@/lib/utils";
import { Loader2, X, Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { ToastType, ToastVariant } from "@/types/toast";
import { convertToBase64, handleImageUpload } from "@/utils/image";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { IParsedQuestion } from "./PasteForm/types";
import { ImageArea } from "./common/ImageArea"
import { ImagePreview } from "./common/ImagePreview"
import { useManualFormImage } from "@/hooks/question/useManualFormImage"
import { useManualFormTag } from "@/hooks/question/useManualFormTag"
import { IManualQuestion, IOption } from '@/types'
import { useManualFormOption } from '@/hooks/question/useManualFormOption'
import { QuestionContent } from './common/QuestionContent'
import { Options } from './common/Options'
import { Explanation } from './common/Explanation'
import { ImageGroup } from './common/ImageGroup'
import { TagGroup } from './common/TagGroup'
import { SubmitSection } from './common/SubmitSection'

export interface ManualFormProps {
  initialData?: IManualQuestion;
  isEditMode?: boolean;
  questionId?: string;
  onSuccess?: () => void;
  apiMethod?: "POST" | "PUT" | "PATCH";
  apiUrl?: string;
}

// images 객체 배열을 string[]로 변환하는 유틸 함수 추가
const mapAndFilterImageUrls = (images: { url: string; hash: string }[] = []) => images.map(img => img.url).filter(Boolean);

// images, explanationImages가 string[]이면 {url, hash: ''}[]로 변환하는 함수
const normalizeImages = (imgs: any) => {
  if (!imgs) return [];
  if (typeof imgs[0] === 'string') return imgs.map((url: string) => ({ url, hash: '' }));
  return imgs;
};

export function ManualForm({ 
  initialData, 
  isEditMode = false, 
  questionId,
  onSuccess,
  apiMethod,
  apiUrl
}: ManualFormProps) {
  // 1. useToast 훅 사용
  const { toast } = useToast();

  // 단일 문제 상태 관리
  const [question, setQuestion] = useState<IManualQuestion>(() => {
    if (initialData) {
      return {
        ...initialData,
        options: Array.isArray(initialData.options) && typeof initialData.options[0] === 'string'
          ? (initialData.options as unknown as string[]).map((text, idx) => ({
              number: idx + 1,
              text,
              images: []
            }))
          : initialData.options.map(opt => ({
              ...opt,
              images: normalizeImages(opt.images)
            })),
        images: normalizeImages(initialData.images),
        explanationImages: normalizeImages(initialData.explanationImages)
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
  const [isYearValid, setIsYearValid] = useState<boolean>(true);
  const [session, setSession] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  
  // 초기 데이터가 있는 경우 기본 태그 정보 설정
  useEffect(() => {
    if (initialData && initialData.tags) {
      // 시험명, 년도, 회차, 과목 태그 파싱
      initialData.tags.forEach((tag: string) => {
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
    options: question.options.map((opt: IOption, idx: number) => ({
      id: generateId(),
      content: opt.text
    })),
    answer: question.answer >= 0 ? question.answer : 0,
    tags: question.tags.map((tag: string) => ({
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
      setQuestion((prev: IManualQuestion) => ({
        ...prev,
        tags: parsedQuestionsState[0].tags.map((tag: { id: string; name: string; color: string; }) => tag.name)
      }));
    }
  }, [parsedQuestionsState]);
  
  // useManualFormTag 훅 사용
  const tagManager = useManualFormTag({
    question,
    setQuestion,
    parsedQuestionsState,
    setParsedQuestionsState
  })
  
  // useManualFormOption 훅 사용
  const optionManager = useManualFormOption({
    question,
    setQuestion
  })
  
  // useManualFormImage 훅 사용
  const manualImage = useManualFormImage({ question, setQuestion });

  // 년도 유효성 검사 함수
  const validateYear = (value: string): boolean => {
    return /^\d{4}$/.test(value);
  };
  
  // 년도 입력 변경 핸들러
  const handleYearChange = (e: ChangeEvent<HTMLInputElement> | CompositionEvent<HTMLInputElement>) => {
    const newValue = (e.target as HTMLInputElement).value;
    setYear(newValue);
    setIsYearValid(validateYear(newValue));
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.content) {
      toast({
        title: "문제 내용을 입력하세요",
        variant: "error" // destructive 대신 error 사용 (정의된 타입 확인 필요)
      });
      return;
    }
    
    if (question.options.some((opt: { number: number; text: string; images: { url: string; hash: string }[]; }) => !opt.text && (!opt.images || opt.images.length === 0))) {
      toast({
        title: "모든 선택지는 텍스트 또는 이미지를 1개 이상 입력해야 합니다.",
        variant: "error"
      });
      return;
    }
    
    if (question.answer < 0) {
      toast({
        title: "정답을 선택하세요",
        variant: "error" // destructive 대신 error 사용 (정의된 타입 확인 필요)
      });
      return;
    }
    
    // --- 수정: 제출 시 기본 태그 자동 적용 및 검증 ---
    const trimmedExamName = examName.trim();
    const trimmedYear = year.trim();
    const trimmedSession = session.trim();

    // 필수 태그 입력 및 년도 형식 확인
    if (!trimmedExamName || !trimmedYear || !trimmedSession || !validateYear(trimmedYear)) {
      toast({
        title: "필수 태그 오류",
        description: "시험명, 년도(YYYY 형식), 회차는 필수 입력 항목입니다.", 
        variant: "error" // destructive 대신 error 사용 (정의된 타입 확인 필요)
      });
      // 년도 형식이 잘못된 경우 상태 업데이트하여 시각적 피드백 제공
      if (!validateYear(trimmedYear)) {
        setIsYearValid(false);
      }
      return; // 제출 중단
    }
    
    // 기본 태그 구성
    const basicTags: string[] = [
      `시험명:${trimmedExamName}`,
      `년도:${trimmedYear}`,
      `회차:${trimmedSession}`,
      ...(subject.trim() ? [`과목:${subject.trim()}`] : []),
    ];
    
    // 기존 태그에서 기본 태그가 아닌 것만 필터링 + 새로운 기본 태그 추가 (중복 제거는 불필요, 덮어쓰기 방식)
    const currentTags = question.tags || [];
    const otherTags = currentTags.filter((tag: string) => 
      !(tag.startsWith('시험명:') || tag.startsWith('년도:') || 
        tag.startsWith('회차:') || tag.startsWith('과목:'))
    );
    const finalTags = [...otherTags, ...basicTags];
    
    // 등록 데이터 변환 시
    const optionsPayload = question.options.map(opt => ({
      number: opt.number,
      text: opt.text,
      images: mapAndFilterImageUrls(opt.images)
    }));
    
    // apiData 구성 전에 finalTags를 사용하도록 수정
    const apiData = {
      content: question.content,
      options: optionsPayload,
      answer: question.answer,
      explanation: question.explanation || "",
      images: mapAndFilterImageUrls(question.images),
      explanationImages: mapAndFilterImageUrls(question.explanationImages),
      tags: finalTags, // 자동 적용된 태그 사용
      updatedAt: new Date()
    };
    // --- 자동 적용 및 검증 끝 ---
    
    setIsSubmitting(true);

    try {
      // API 데이터 구성 부분에서 tags: finalTags 사용하도록 수정됨
      console.log('문제 저장/수정 데이터:', apiData);
      
      // 커스텀 URL과 메서드 사용 또는 기본값 설정
      const url = apiUrl || (isEditMode ? `/api/questions/${questionId}` : "/api/questions");
      const method = apiMethod || (isEditMode ? "PATCH" : "POST");
      
      console.log('API 요청 정보:', { url, method });

      // --- FormData 방식으로 전송 ---
      const formData = new FormData();
      formData.append('content', question.content);
      formData.append('options', JSON.stringify(optionsPayload));
      formData.append('answer', question.answer.toString());
      formData.append('explanation', question.explanation || "");
      formData.append('tags', JSON.stringify(finalTags));
      // 문제 이미지 URL 배열 추가
      formData.append('images', JSON.stringify(question.images));
      // 해설 이미지 URL 배열 추가
      formData.append('explanationImages', JSON.stringify(question.explanationImages));

      const response = await fetch(url, {
        method,
        body: formData
        // Content-Type은 브라우저가 자동으로 설정
      });
      // --- FormData 방식 끝 ---

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = errorText;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorText;
        } catch (e) {
          // JSON 파싱 실패 시 원본 텍스트 사용
        }
        throw new Error(errorMessage || (isEditMode ? "문제 수정 중 오류가 발생했습니다." : "문제 저장 중 오류가 발생했습니다."));
      }
      
      const responseData = await response.json();
      
      toast({
        title: isEditMode ? "문제 수정 완료" : "문제 등록 완료",
        description: responseData.message,
        variant: "success" // 성공 토스트 variant 추가 (정의된 타입 확인 필요)
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
            tags: [] // 초기화 시 tags도 비움
          });
          // 기본 태그 입력 필드도 초기화
          setExamName("");
          setYear("");
          setSession("");
          setSubject("");
        }
      }
    } catch (error) {
      console.error("문제 저장 오류:", error);
      toast({
        title: isEditMode ? "문제 수정 실패" : "문제 저장 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "error" // destructive 대신 error 사용 (정의된 타입 확인 필요)
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <TagGroup
        examName={examName}
        year={year}
        isYearValid={isYearValid}
        session={session}
        subject={subject}
        tagInput={tagManager.tagInput}
        tags={question.tags}
        onExamNameChange={setExamName}
        onYearChange={setYear}
        onSessionChange={setSession}
        onSubjectChange={setSubject}
        onTagInputChange={tagManager.setTagInput}
        onAddTag={tagManager.addTag}
        onRemoveTag={tagManager.removeTag}
      />
      <QuestionContent
        value={question.content}
        onChange={e => setQuestion({ ...question, content: e.target.value })}
        onPaste={manualImage.handleTextAreaPaste}
        inputRef={manualImage.contentRef}
      />
      {/* 문제 이미지 업로드 영역 - 문제 입력 아래에만 렌더링 */}
      <ImageGroup
        questionImages={normalizeImages(question.images)}
        explanationImages={normalizeImages([])}
        onRemoveImage={manualImage.removeImage}
        onZoomImage={manualImage.handleImageZoom}
        onImageAreaClick={manualImage.handleImageAreaClick}
        onImageAreaMouseEnter={() => manualImage.setIsImageAreaActive(true)}
        onImageAreaMouseLeave={() => manualImage.setIsImageAreaActive(false)}
        questionImageInputRef={manualImage.questionImageInputRef}
        explanationImageInputRef={manualImage.explanationImageInputRef}
        activeImageType={manualImage.activeImageType}
        isImageAreaActive={manualImage.isImageAreaActive}
        handleImageUpload={manualImage.handleImageUpload}
        type="question"
      />
      <Options
        options={question.options.map(opt => ({ ...opt, images: normalizeImages(opt.images) }))}
        answer={question.answer}
        onAddOption={optionManager.addOption}
        onRemoveOption={optionManager.removeOption}
        onUpdateOption={optionManager.updateOption}
        onSetAnswer={optionManager.setQuestionAnswer}
        onOptionImageUpload={optionManager.onOptionImageUpload}
        onOptionImageRemove={optionManager.onOptionImageRemove}
        onOptionImageZoom={optionManager.onOptionImageZoom}
      />
      <Explanation
        value={question.explanation || ''}
        onChange={e => setQuestion({ ...question, explanation: e.target.value })}
        onPaste={manualImage.handleTextAreaPaste}
        inputRef={manualImage.explanationRef}
      />
      {/* 해설 이미지 업로드 영역 - 해설 입력 아래에만 렌더링 */}
      <ImageGroup
        questionImages={normalizeImages([])}
        explanationImages={normalizeImages(question.explanationImages)}
        onRemoveImage={(idx) => manualImage.removeImage(idx, true)}
        onZoomImage={manualImage.handleImageZoom}
        onImageAreaClick={manualImage.handleImageAreaClick}
        onImageAreaMouseEnter={() => manualImage.setIsImageAreaActive(true)}
        onImageAreaMouseLeave={() => manualImage.setIsImageAreaActive(false)}
        questionImageInputRef={manualImage.questionImageInputRef}
        explanationImageInputRef={manualImage.explanationImageInputRef}
        activeImageType={manualImage.activeImageType}
        isImageAreaActive={manualImage.isImageAreaActive}
        handleImageUpload={manualImage.handleImageUpload}
        type="explanation"
      />
      <SubmitSection isSubmitting={isSubmitting} isEditMode={isEditMode} />
      {/* 이미지 확대 모달 */}
      <Dialog open={!!manualImage.zoomedImage} onOpenChange={() => manualImage.setZoomedImage(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto p-2">
          {/* 접근성을 위한 DialogTitle 추가 (시각적으로 숨김) */}
          <VisuallyHidden>
            <DialogTitle>확대 이미지</DialogTitle>
            <DialogDescription>선택한 이미지의 확대된 모습입니다.</DialogDescription>
          </VisuallyHidden>
          {manualImage.zoomedImage && (
            <img src={manualImage.zoomedImage} alt="Zoomed view" className="w-full h-auto object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </form>
  );
}