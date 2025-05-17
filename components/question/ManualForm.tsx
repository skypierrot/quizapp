"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef, useEffect, ChangeEvent, CompositionEvent, useMemo } from "react";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { useUniversalImageUpload } from '@/hooks/useUniversalImageUpload';
import { useImageZoom } from '@/hooks/useImageZoom';
import { ImageZoomModal } from '@/components/common/ImageZoomModal';
import { BasicTagSettings } from './common/BasicTagSettings';
import { useCascadingTags } from '@/hooks/question/useCascadingTags';
import { AdditionalTagInput } from './common/AdditionalTagInput';

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

// --- 추가: 초기 태그 값 파싱 헬퍼 ---
const parseInitialTags = (tags: string[] = []) => {
  let initialExamName = "";
  let initialYear = "";
  let initialSubjectFromSession = ""; // session에서 파싱될 값
  let initialSubjectFromSubject = ""; // subject에서 파싱될 값

  tags.forEach((tag: string) => {
    if (tag.startsWith('시험명:')) initialExamName = tag.replace('시험명:', '');
    else if (tag.startsWith('년도:')) initialYear = tag.replace('년도:', '');
    // "회차:" 태그를 "과목:"으로 간주하고 값을 가져옴 (session -> subject 변경의 일환)
    else if (tag.startsWith('회차:')) initialSubjectFromSession = tag.replace('회차:', ''); 
    else if (tag.startsWith('과목:')) initialSubjectFromSubject = tag.replace('과목:', '');
  });
  // 만약 "과목:" 태그가 존재하면 그것을 우선 사용하고, 없다면 "회차:"에서 변환된 값을 사용
  // 사용자의 요청은 session을 subject로 대체하는 것이므로, initialSubject는 하나여야 함.
  // 여기서는 initialSubjectFromSubject (원래 과목 태그)가 있다면 그것을 쓰고, 
  // 없다면 initialSubjectFromSession (회차에서 변환된 과목 태그)를 쓴다.
  // useCascadingTags에는 initialSubject 하나만 전달됨.
  const finalInitialSubject = initialSubjectFromSubject || initialSubjectFromSession;
  
  // useCascadingTags는 initialSubject prop 하나만 받으므로, 여기서 결정해서 넘겨야 함.
  // initialSession은 더 이상 사용하지 않음.
  return { initialExamName, initialYear, initialSubject: finalInitialSubject };
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
  
  // --- 추가: 초기 태그 값 파싱 (훅 호출 전에 수행) ---
  const initialTags = useMemo(() => parseInitialTags(initialData?.tags), [initialData?.tags]);

  // --- 추가: useCascadingTags 훅 사용 ---
  const {
    examName,
    year,
    subject,
    examNameOptions,
    yearOptions,
    subjectOptions,
    isLoadingExamNames,
    isLoadingYears,
    isLoadingSubjects,
    isYearValid,
    isYearDisabled,
    isSubjectDisabled,
    handleExamNameChange,
    handleYearChange,
    handleSubjectChange,
    handleExamNameCreate,
    handleYearCreate,
    handleSubjectCreate,
  } = useCascadingTags(initialTags);
  
  // useManualFormTag 훅 사용
  const tagManager = useManualFormTag({
    question,
    setQuestion,
    parsedQuestionsState: [],
    setParsedQuestionsState: () => {}
  })
  
  // useManualFormOption 훅 사용
  const optionManager = useManualFormOption({
    question,
    setQuestion
  })
  
  // useManualFormImage 훅 사용
  const manualImage = useManualFormImage({ question, setQuestion });

  // 이미지 업로드 공통 훅 사용
  const questionImageUpload = useUniversalImageUpload();
  const explanationImageUpload = useUniversalImageUpload();
  const imageZoom = useImageZoom();

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
    
    // --- 수정: 제출 시 기본 태그 자동 적용 및 검증 (훅 값 사용) ---
    const trimmedExamName = examName.trim();
    const trimmedYear = year.trim();
    const trimmedSubject = subject.trim();

    // 필수 태그 입력 및 년도 형식 확인 (훅의 isYearValid 사용)
    if (!trimmedExamName || !trimmedYear || !trimmedSubject || !isYearValid) {
      toast({
        title: "필수 태그 오류",
        description: "시험명, 년도(YYYY 형식), 과목은 필수 입력 항목입니다.",
        variant: "error"
      });
      return;
    }
    
    // 기본 태그 구성 (훅의 subject 사용)
    const basicTags: string[] = [
      `시험명:${trimmedExamName}`,
      `년도:${trimmedYear}`,
      `과목:${trimmedSubject}`,
    ];
    
    // 기존 태그에서 기본 태그가 아닌 것만 필터링 + 새로운 기본 태그 추가
    const currentTags = question.tags || [];
    const otherTags = currentTags.filter((tag: string) => 
      !(tag.startsWith('시험명:') || tag.startsWith('년도:') || 
        tag.startsWith('과목:'))
    );
    const finalTags = [...otherTags, ...basicTags];
    
    // 등록 데이터 변환 시
    const optionsPayload = question.options.map(opt => ({
      number: opt.number,
      text: opt.text,
      images: normalizeImages(opt.images)
    }));
    
    // apiData 구성 전에 finalTags를 사용하도록 수정
    const apiData = {
      ...question,
      options: optionsPayload,
      images: normalizeImages(question.images),
      explanationImages: normalizeImages(question.explanationImages),
      tags: finalTags, // 수정된 finalTags 사용
      // examId는 서버에서 tags를 기반으로 생성/조회하므로 클라이언트에서 보내지 않음
    };
    // delete apiData.id; // id는 서버에서 생성 (isEditMode가 아닐 때) -> 아래 로직으로 대체
    if (!isEditMode) {
      delete apiData.id; // 새 문제 생성 시에는 id 필드 제거
    } else if (questionId) {
      apiData.id = questionId; // 수정 모드이고 questionId가 있으면 id 설정
    } else {
      // 수정 모드인데 questionId가 없는 경우 (이론적으로 발생하면 안됨)
      console.warn("Edit mode without questionId, id will be auto-generated if not present in question object");
      if (!question.id) delete apiData.id; // question 객체에도 id가 없으면 제거
    }

    console.log("API 요청 정보:", {url: apiUrl || '/api/questions', method: apiMethod || (isEditMode ? 'PUT' : 'POST') });
    console.log("API 요청 데이터 tags:", apiData.tags); // 디버깅 로그 추가
    // console.log("API 요청 전체 데이터:", JSON.stringify(apiData, null, 2)); // 전체 데이터 확인용 로그
    
    setIsSubmitting(true);

    try {
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
      formData.append('tags', JSON.stringify(finalTags)); // 수정된 finalTags 사용
      formData.append('images', JSON.stringify(normalizeImages(question.images))); // normalize 적용
      formData.append('explanationImages', JSON.stringify(normalizeImages(question.explanationImages))); // normalize 적용
      
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
      
      if (onSuccess) {
        onSuccess();
      } else {
        if (!isEditMode) {
          // --- 폼 초기화 로직 수정 (question 상태만 초기화) --- 
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
          // 제거: 훅에서 관리하는 상태는 여기서 초기화하지 않음
          // setExamName("");
          // setYear("");
          // setSession("");
          // setSubject("");
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
      <BasicTagSettings
        examName={examName}
        year={year}
        subject={subject}
        examNameOptions={examNameOptions}
        yearOptions={yearOptions}
        subjectOptions={subjectOptions}
        isLoadingExamNames={isLoadingExamNames}
        isLoadingYears={isLoadingYears}
        isLoadingSubjects={isLoadingSubjects}
        isYearDisabled={isYearDisabled}
        isSubjectDisabled={isSubjectDisabled}
        onExamNameChange={handleExamNameChange}
        onYearChange={handleYearChange}
        onSubjectChange={handleSubjectChange}
        onExamNameCreate={handleExamNameCreate}
        onYearCreate={handleYearCreate}
        onSubjectCreate={handleSubjectCreate}
      />
      {!isYearValid && year && (
        <p className="text-xs text-red-500 mt-1 ml-1">년도는 4자리 숫자로 입력해주세요.</p>
      )}
      {/* --- 추가: AdditionalTagInput 컴포넌트 렌더링 (추가 태그용) --- */}
      <AdditionalTagInput
        tags={question.tags || []} // 추가 태그 배열 전달
        tagInput={tagInput} // 추가 태그 입력 상태
        onTagInputChange={setTagInput} // 추가 태그 입력 핸들러
        onAddTag={tagManager.addTag} // useManualFormTag 훅의 추가 함수
        onRemoveTag={tagManager.removeTag} // useManualFormTag 훅의 제거 함수
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
        onZoomImage={imageZoom.showZoom}
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
        onOptionImageZoom={imageZoom.showZoom}
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
        onZoomImage={imageZoom.showZoom}
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
      {/* 이미지 확대 모달 - 새로운 모달 사용 */}
      <ImageZoomModal src={imageZoom.zoomedImage} onClose={imageZoom.closeZoom} />
    </form>
  );
}