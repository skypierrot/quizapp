'use client';

import React, { useState, useEffect, ChangeEvent, RefObject } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn, generateId } from "@/lib/utils";
import { IManualQuestion, IOption } from '@/types';
import { useManualFormOption } from '@/hooks/question/useManualFormOption';
import { useManualFormImage } from '@/hooks/question/useManualFormImage';
import { useUniversalImageUpload, IUniversalImage } from '@/hooks/useUniversalImageUpload';
import { useImageZoom } from '@/hooks/useImageZoom';
import { QuestionContent } from './common/QuestionContent';
import { Options } from './common/Options';
import { Explanation } from './common/Explanation';
import { SubmitSection } from './common/SubmitSection';
import { ImageZoomModal } from '@/components/common/ImageZoomModal';
import { Label } from "@/components/ui/label";
import { TagGroup } from './common/TagGroup';

// Props 타입 정의
interface ManualInputTabProps {
  initialData?: IManualQuestion; // 수정 시 초기 데이터
  isEditMode?: boolean;
  selectedExamId?: string; // 선택된 시험 ID (컨테이너에서 전달)
  onSubmit: (data: IManualQuestion) => void; // 제출 시 호출될 콜백
  isSubmitting: boolean; // 제출 중 상태 (컨테이너에서 전달)
}

// images, explanationImages가 string[]이면 {url, hash: ''}[]로 변환하는 함수
const normalizeImages = (imgs: any) => {
  if (!imgs) return [];
  // 이미 {url, hash} 형태이면 그대로 반환
  if (imgs.length > 0 && typeof imgs[0] === 'object' && imgs[0]?.url) return imgs;
  if (Array.isArray(imgs) && imgs.length > 0 && typeof imgs[0] === 'string') {
    return imgs.map((url: string) => ({ url, hash: '' }));
  }
  return Array.isArray(imgs) ? imgs : [];
};

export function ManualInputTab({
  initialData,
  isEditMode = false,
  selectedExamId,
  onSubmit,
  isSubmitting,
}: ManualInputTabProps) {
  const { toast } = useToast();

  // 상태 관리 (tags 포함)
  const [question, setQuestion] = useState<IManualQuestion>(() => {
    let initial: IManualQuestion;
    if (initialData) {
      // initialData에 tags가 포함되어 있다고 가정
      initial = {
        ...initialData,
        options: (initialData.options || []).map(opt => ({
            ...opt,
            images: normalizeImages(opt.images)
          })),
        images: normalizeImages(initialData.images),
        explanationImages: normalizeImages(initialData.explanationImages),
        tags: initialData.tags || [], // tags 초기화
      };
    } else {
      initial = {
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
        tags: [], // tags 초기화
      };
    }
    return initial;
  });

  // 태그 관련 상태 (예시, 필요시 useManualFormTag 훅 재활용)
  const [tagInput, setTagInput] = useState("");
  const addTag = (tag: string) => {
    if (tag && !question.tags.includes(tag)) {
      setQuestion(prev => ({ ...prev, tags: [...prev.tags, tag] }));
    }
    setTagInput("");
  };
  const removeTag = (tagToRemove: string) => {
    setQuestion(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  };

  // 훅 사용
  const optionManager = useManualFormOption({ question, setQuestion });
  const manualImageHook = useManualFormImage({ question, setQuestion });
  
  // useUniversalImageUpload 훅 사용 (각각의 이미지 상태 관리)
  const questionImageManager = useUniversalImageUpload();
  const explanationImageManager = useUniversalImageUpload();
  
  // useEffect를 사용하여 question 상태의 이미지를 각 Manager와 동기화
  // (훅 내부 상태와 동기화)
  useEffect(() => {
      questionImageManager.setImages(question.images || []);
  }, [question.images, questionImageManager.setImages]);

  useEffect(() => {
      explanationImageManager.setImages(question.explanationImages || []);
  }, [question.explanationImages, explanationImageManager.setImages]);

  // 이미지 업로드 핸들러 (훅 핸들러 사용 + question 상태 업데이트)
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement> | File, 
    isExplanation: boolean = false
  ) => {
    const manager = isExplanation ? explanationImageManager : questionImageManager;
    const currentImages = isExplanation ? question.explanationImages : question.images;
    
    await manager.handleImageUpload(e, currentImages || [], (newImage) => {
        if (isExplanation) {
            setQuestion(prev => ({ ...prev, explanationImages: [...(prev.explanationImages || []), newImage] }));
        } else {
            setQuestion(prev => ({ ...prev, images: [...(prev.images || []), newImage] }));
        }
    });
  };

  // 이미지 제거 핸들러 (훅 핸들러 사용 + question 상태 업데이트)
  const handleImageRemove = (index: number, isExplanation: boolean = false) => {
    const manager = isExplanation ? explanationImageManager : questionImageManager;
    // 훅의 removeImage는 내부 상태만 변경하므로, question 상태도 직접 변경
    const imageToRemove = isExplanation ? question.explanationImages?.[index] : question.images?.[index];
    if (!imageToRemove) return;

    if (isExplanation) {
        setQuestion(prev => ({ ...prev, explanationImages: (prev.explanationImages || []).filter((_, i) => i !== index) }));
    } else {
        setQuestion(prev => ({ ...prev, images: (prev.images || []).filter((_, i) => i !== index) }));
    }
    // TODO: 임시 이미지 삭제 API 호출 (선택 사항)
  };

  const { zoomedImage, showZoom, closeZoom } = useImageZoom();

  // 폼 제출 핸들러 (question 데이터 전달 - tags 포함)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 유효성 검사 (tags 관련 검사 추가 가능)
    if (question.tags.length === 0) {
        toast({ title: "태그 필수", description: "문제에 태그를 하나 이상 추가해주세요." });
        return;
    }
    if (!selectedExamId) {
        toast({ title: "시험 정보 필수", description: "문제를 등록할 시험을 선택해주세요." });
        return;
    }
    if (!question.content) {
      toast({ title: "문제 내용을 입력하세요" });
      return;
    }
    if (question.options.some(opt => !opt.text && (!opt.images || opt.images.length === 0))) {
      toast({ title: "모든 선택지는 텍스트 또는 이미지를 1개 이상 입력해야 합니다." });
      return;
    }
    if (question.answer < 0) {
      toast({ title: "정답을 선택하세요" });
      return;
    }
    
    // 컨테이너의 onSubmit 호출 (question 상태 전체 전달)
    onSubmit(question);

    // 폼 초기화 (tags 포함)
    if (!isEditMode) {
        setQuestion({
          id: generateId(),
          number: 1,
          content: "",
          options: Array(4).fill(null).map((_, i) => ({ number: i + 1, text: "", images: [] })),
          answer: -1,
          explanation: "",
          images: [],
          explanationImages: [],
          tags: [], // tags 초기화
        });
      }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 border rounded-md shadow-sm p-4 mt-4">
      {/* 문제 내용 입력 */}
      <QuestionContent
        value={question.content}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setQuestion(prev => ({ ...prev, content: e.target.value }))}
        onPaste={manualImageHook.handleTextAreaPaste}
        inputRef={manualImageHook.contentRef}
      />
      {/* 문제 이미지 UI (useUniversalImageUpload 훅 사용) */}
      <div>
          <Label className="text-sm font-medium">문제 이미지</Label>
          {/* ImagePreview 렌더링 (훅의 images 상태 사용) */}
          <div className="mt-2 grid grid-cols-3 gap-2">
              {questionImageManager.images.map((img, index) => (
                  <div key={img.hash || index} className="relative">
                      {/* ImagePreview 컴포넌트 사용 또는 직접 img 태그 사용 */}
                      <img src={img.url} alt={`Question image ${index}`} className="w-full h-auto rounded" onClick={() => showZoom(img.url)}/>
                      <Button size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6" onClick={() => handleImageRemove(index, false)}>
                          <span className="sr-only">Remove image</span>X
                      </Button>
                  </div>
              ))}
          </div>
      </div>

      {/* 선택지 입력 */}
      <Options
        options={question.options}
        answer={question.answer}
        onSetAnswer={optionManager.setQuestionAnswer}
        onUpdateOption={optionManager.updateOption}
        onAddOption={optionManager.addOption}
        onRemoveOption={optionManager.removeOption}
        onOptionImageUpload={optionManager.onOptionImageUpload} 
        onOptionImageRemove={optionManager.onOptionImageRemove}
        onOptionImageZoom={showZoom}
      />

      {/* 해설 입력 */}
      <Explanation
        value={question.explanation || ''}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setQuestion(prev => ({ ...prev, explanation: e.target.value }))}
        onPaste={manualImageHook.handleTextAreaPaste}
        inputRef={manualImageHook.explanationRef}
      />
       {/* 해설 이미지 UI (useUniversalImageUpload 훅 사용) */}
       <div>
          <Label className="text-sm font-medium">해설 이미지</Label>
           {/* ImagePreview 렌더링 (훅의 images 상태 사용) */}
           <div className="mt-2 grid grid-cols-3 gap-2">
              {explanationImageManager.images.map((img, index) => (
                  <div key={img.hash || index} className="relative">
                      <img src={img.url} alt={`Explanation image ${index}`} className="w-full h-auto rounded" onClick={() => showZoom(img.url)} />
                       <Button size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6" onClick={() => handleImageRemove(index, true)}>
                           <span className="sr-only">Remove image</span>X
                      </Button>
                  </div>
              ))}
          </div>
      </div>
      
      {/* 태그 입력 UI (TagGroup 사용) */}
       <TagGroup 
            tags={question.tags} 
            tagInput={tagInput} 
            onTagInputChange={setTagInput}
            addTag={addTag} 
            removeTag={removeTag} 
            examName="" 
            year="" 
            isYearValid={true} 
            session="" 
            subject="" 
            onExamNameChange={() => {}} 
            onYearChange={() => {}} 
            onSessionChange={() => {}} 
            onSubjectChange={() => {}}
            onAddTag={addTag}
            onRemoveTag={removeTag}
        />

      {/* 제출 버튼 */}
      <SubmitSection isSubmitting={isSubmitting} isEditMode={isEditMode} />

      {/* 이미지 확대 모달 */}
      <ImageZoomModal 
        src={zoomedImage}
        onClose={closeZoom}
      />
    </form>
  );
} 