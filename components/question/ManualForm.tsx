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

export function ManualForm({ 
  initialData, 
  isEditMode = false, 
  questionId,
  onSuccess,
  apiMethod,
  apiUrl
}: ManualFormProps) {
  const { toast } = useToast();
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
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    examName,
    date,
    subject,
    examNameOptions,
    subjectOptions,
    isLoadingExamNames,
    isLoadingSubjects,
    isDateValid,
    isDateDisabled,
    isSubjectDisabled,
    handleExamNameChange,
    handleDateChange,
    handleSubjectChange,
    handleExamNameCreate,
    handleSubjectCreate,
  } = useCascadingTags({
    initialExamName: initialData?.examName,
    initialDate: initialData?.examDate,
    initialSubject: initialData?.examSubject,
  });
  
  const tagManager = useManualFormTag({
    question,
    setQuestion,
    parsedQuestionsState: [],
    setParsedQuestionsState: () => {}
  })
  
  const optionManager = useManualFormOption({
    question,
    setQuestion
  })
  
  const manualImage = useManualFormImage({ question, setQuestion });

  const questionImageUpload = useUniversalImageUpload();
  const explanationImageUpload = useUniversalImageUpload();
  const imageZoom = useImageZoom();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.content) {
      toast({
        title: "문제 내용을 입력하세요",
        variant: "error"
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
        variant: "error"
      });
      return;
    }
    
    const trimmedExamName = examName.trim();
    const trimmedDate = date.trim();
    const trimmedSubject = subject.trim();

    if (!trimmedExamName || !trimmedDate || !trimmedSubject || !isDateValid) {
      toast({
        title: "필수 태그 오류",
        description: "시험명, 날짜(YYYY-MM-DD 형식), 과목은 필수 입력 항목입니다.",
        variant: "error"
      });
      return;
    }
    
    // 새로운 필수 태그
    const newBasicTags: string[] = [
      `시험명:${trimmedExamName}`,
      `날짜:${trimmedDate}`,
      `과목:${trimmedSubject}`,
    ];
    
    // 기존 태그에서 "시험명:", "날짜:", "과목:" 접두사를 가진 모든 태그를 필터링하여 제거
    const otherTags = (question.tags || []).filter((tag: string) => 
      !tag.startsWith('시험명:') && 
      !tag.startsWith('날짜:') && 
      !tag.startsWith('과목:')
    );
    
    // 순수 추가 태그와 새로운 필수 태그를 합침
    const finalTags = [...otherTags, ...newBasicTags];
    
    const optionsPayload = question.options.map(opt => ({
      number: opt.number,
      text: opt.text,
      images: normalizeImages(opt.images)
    }));
    
    const apiData = {
      ...question,
      options: optionsPayload,
      images: normalizeImages(question.images),
      explanationImages: normalizeImages(question.explanationImages),
      tags: finalTags,
    };
    if (!isEditMode) {
      delete apiData.id;
    } else if (questionId) {
      apiData.id = questionId;
    } else {
      console.warn("Edit mode without questionId, id will be auto-generated if not present in question object");
      if (!question.id) delete apiData.id;
    }

    console.log("API 요청 정보:", {url: apiUrl || '/api/questions', method: apiMethod || (isEditMode ? 'PUT' : 'POST') });
    console.log("API 요청 데이터 tags:", apiData.tags);
    
    setIsSubmitting(true);

    try {
      const url = apiUrl || (isEditMode ? `/api/questions/${questionId}` : "/api/questions");
      const method = apiMethod || (isEditMode ? "PATCH" : "POST");
      
      console.log('API 요청 정보:', { url, method });

      const formData = new FormData();
      formData.append('content', question.content);
      formData.append('options', JSON.stringify(optionsPayload));
      formData.append('answer', question.answer.toString());
      formData.append('explanation', question.explanation || "");
      formData.append('tags', JSON.stringify(finalTags));
      formData.append('images', JSON.stringify(normalizeImages(question.images)));
      formData.append('explanationImages', JSON.stringify(normalizeImages(question.explanationImages)));
      formData.append('examName', trimmedExamName);
      formData.append('examDate', trimmedDate);
      formData.append('examSubject', trimmedSubject);
      
      const response = await fetch(url, {
        method,
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = errorText;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorText;
        } catch (e) {
        }
        throw new Error(errorMessage || (isEditMode ? "문제 수정 중 오류가 발생했습니다." : "문제 저장 중 오류가 발생했습니다."));
      }
      
      const responseData = await response.json();
      
      toast({
        title: isEditMode ? "문제 수정 완료" : "문제 등록 완료",
        description: responseData.message,
        variant: "success"
      });
      
      if (onSuccess) {
        onSuccess();
      } else {
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
        title: isEditMode ? "문제 수정 실패" : "문제 저장 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <BasicTagSettings
        examName={examName}
        date={date}
        subject={subject}
        examNameOptions={examNameOptions}
        subjectOptions={subjectOptions}
        isLoadingExamNames={isLoadingExamNames}
        isLoadingSubjects={isLoadingSubjects}
        isDateDisabled={isDateDisabled}
        isDateValid={isDateValid}
        isSubjectDisabled={isSubjectDisabled}
        onExamNameChange={handleExamNameChange}
        onDateChange={handleDateChange}
        onSubjectChange={handleSubjectChange}
        onExamNameCreate={handleExamNameCreate}
        onSubjectCreate={handleSubjectCreate}
      />
      {!isDateValid && date && (
        <p className="text-xs text-red-500 mt-1 ml-1">날짜는 YYYY-MM-DD 형식으로 입력해주세요.</p>
      )}
      <AdditionalTagInput
        tags={question.tags || []}
        tagInput={tagManager.tagInput}
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
      <ImageZoomModal src={imageZoom.zoomedImage} onClose={imageZoom.closeZoom} />
    </form>
  );
}