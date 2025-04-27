"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useState, useRef, useEffect, ChangeEvent, CompositionEvent } from "react"
import { parseQuestionsImproved } from "@/utils/questionParser"
import { IQuestion } from "@/types"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Image as ImageIcon, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ToastType } from "@/types/toast"
import { convertToBase64 } from "@/utils/image"
import { ToastActionElement, ToastVariant } from "@/types/toast"
import { ImageArea } from "./PasteForm/ImageArea"
import { ImagePreview } from "./PasteForm/ImagePreview"
import { usePasteFormImage } from "@/hooks/question/usePasteFormImage"
import { TagSection } from './PasteForm/TagSection'
import { QuestionListSection } from './PasteForm/QuestionListSection'
import { OptionsSection } from './PasteForm/OptionsSection'
import { ExplanationSection } from './PasteForm/ExplanationSection'
import { ImageSection } from './PasteForm/ImageSection'
import { SubmitSection } from './PasteForm/SubmitSection'
import { usePasteFormQuestions } from '@/hooks/question/usePasteFormQuestions'
import { normalizeUrl } from '@/utils/normalizeUrl'

interface IParsedQuestion {
  content: string;
  options: string[];
  answer: number;
  images: string[];
  explanation?: string;
  explanationImages?: string[];
  tags?: string[];
  examples?: string[];
}

export interface PasteFormProps {
  initialData?: IQuestion;
  isEditMode?: boolean;
  questionId?: string;
  onSuccess?: () => void;
}

export function PasteForm({
  initialData,
  isEditMode = false,
  questionId,
  onSuccess
}: PasteFormProps) {
  const { toast } = useToast();
  
  const safeToast = (title: string, description: string = "", variant: string = "default") => {
    toast({ title, description, variant: variant as any });
  };
  
  const { 
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
  } = usePasteFormQuestions(initialData)

  const [selectedImageType, setSelectedImageType] = useState<'question' | 'explanation'>('question')
  const [activeImageArea, setActiveImageArea] = useState<{index: number, type: 'question' | 'explanation'} | null>(null)
  const [imageEventProcessing, setImageEventProcessing] = useState(false)
  const [processingCount, setProcessingCount] = useState(0)
  const [explanationText, setExplanationText] = useState<string>("")
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const [examName, setExamName] = useState<string>("")
  const [year, setYear] = useState<string>("")
  const [session, setSession] = useState<string>("")
  const [subject, setSubject] = useState<string>("")
  const [isYearValid, setIsYearValid] = useState<boolean>(true);
  
  const [isImageAreaActive, setIsImageAreaActive] = useState(false);

  const setActiveImageAreaWithDebounce = (value: typeof activeImageArea) => {
    if (imageEventProcessing) {
      console.log("[DEBUG] 이미지 처리 중 - 영역 상태 변경 무시");
      safeToast("이미지 처리 중입니다. 잠시 후 다시 시도하세요.", "", "warning");
    }
    console.log("[DEBUG] 활성 이미지 영역 설정:", value);
    setActiveImageArea(value);
  };

  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      console.log("[DEBUG] 글로벌 붙여넣기 이벤트 발생");
      
      if (processingCount > 0) {
        console.log("[DEBUG] 이미지 처리 중 - 추가 이벤트 차단");
        return;
      }
      
      if (!activeImageArea) {
        console.log("[DEBUG] 붙여넣기 무시 - 활성 영역 없음", {activeArea: activeImageArea});
        safeToast("이미지 영역을 클릭하거나 마우스를 올려주세요.", "", "warning");
        return;
      }

      console.log("[DEBUG] 활성 이미지 영역:", activeImageArea);
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') === 0) {
          const blob = items[i].getAsFile();
          if (blob) {
            console.log("[DEBUG] 이미지 Blob 감지:", { size: blob.size, type: blob.type });
            setProcessingCount(prev => prev + 1);
            setImageEventProcessing(true);
            
            handleImageBlob(blob, activeImageArea.index, activeImageArea.type === 'explanation')
              .finally(() => {
                setTimeout(() => {
                  setImageEventProcessing(false);
                  setProcessingCount(prev => Math.max(0, prev - 1));
                  console.log("[DEBUG] 이미지 처리 상태 리셋");
                }, 300);
              });
            
            e.preventDefault();
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => {
      window.removeEventListener('paste', handleGlobalPaste);
    };
  }, [activeImageArea, imageEventProcessing, processingCount, parsedQuestions]);

  const handleImageBlob = async (blob: File, questionIndex: number, isExplanation: boolean) => {
    console.log("[DEBUG] 이미지 처리 시작:", { questionIndex, isExplanation, blobSize: blob.size, blobType: blob.type });
    
    if (!blob) {
      safeToast("이미지가 선택되지 않았습니다", "", "destructive");
      return Promise.reject("이미지가 선택되지 않았습니다");
    }
    
    if (blob.size > 10 * 1024 * 1024) {
      safeToast("이미지 크기가 너무 큽니다", "10MB 이하의 이미지만 업로드 가능합니다", "destructive");
      return Promise.reject("이미지 크기 초과");
    }
    
    if (!blob.type.startsWith('image/')) {
      safeToast("이미지 파일만 업로드 가능합니다", "", "destructive");
      return Promise.reject("이미지 파일이 아님");
    }
    
    try {
      console.log("[DEBUG] 이미지 Base64 변환 중");
      const base64 = await convertToBase64(blob);
      
      const generateImageHash = (imgData: string) => {
        if (imgData.length > 300) {
          const start = imgData.substring(0, 100);
          const middle = imgData.substring(Math.floor(imgData.length / 2) - 50, Math.floor(imgData.length / 2) + 50);
          const end = imgData.substring(imgData.length - 100);
          return start + middle + end;
        }
        return imgData;
      };
      
      setParsedQuestions(prevState => {
        const currentQuestion = prevState[questionIndex];
        if (!currentQuestion) {
          safeToast("문제를 찾을 수 없습니다", "", "destructive");
          return prevState;
        }
        
        const currentImages = isExplanation 
          ? (currentQuestion.explanationImages || []) 
          : (currentQuestion.images || []);
        
        const newImageHash = generateImageHash(base64);
        const isDuplicate = currentImages.some(img => generateImageHash(img) === newImageHash);
        
        if (isDuplicate) {
          console.log("[DEBUG] 중복 이미지 감지");
          safeToast("이미지 중복", "이 이미지는 이미 등록되었습니다.", "warning");
          return prevState;
        }
        
        console.log("[DEBUG] 이미지 추가:", { isExplanation });
        
        const updatedQuestions = [...prevState];
        const updatedQuestion = {...updatedQuestions[questionIndex]};
        
        if (isExplanation) {
          updatedQuestion.explanationImages = [...(updatedQuestion.explanationImages || []), base64];
          safeToast("이미지 추가 완료", "해설에 이미지가 추가되었습니다.", "success");
        } else {
          updatedQuestion.images = [...(updatedQuestion.images || []), base64];
          safeToast("이미지 추가 완료", "문제에 이미지가 추가되었습니다.", "success");
        }
        
        updatedQuestions[questionIndex] = updatedQuestion;
        return updatedQuestions;
      });
      
      return Promise.resolve();
    } catch (error) {
      console.error("[ERROR] 이미지 처리 실패:", error);
      safeToast("이미지 처리 실패", "이미지를 처리하는 중 오류가 발생했습니다.", "destructive");
      return Promise.reject(error);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (selectedQuestionIndex < 0) return;
    
    await handleImageBlob(
      file, 
      selectedQuestionIndex, 
      selectedImageType === 'explanation'
    );
  };

  const addImageToQuestion = (e: React.MouseEvent, questionIndex: number) => {
    e.stopPropagation();
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    setSelectedQuestionIndex(questionIndex);
    setSelectedImageType('question');
    input.click();
    
    input.onchange = (event) => {
      if (event.target instanceof HTMLInputElement && event.target.files && event.target.files.length > 0) {
        const file = event.target.files[0];
        handleImageUpload(file);
      }
    };
  };

  const addExplanationImageToQuestion = (e: React.MouseEvent, questionIndex: number) => {
    e.stopPropagation();
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    setSelectedQuestionIndex(questionIndex);
    setSelectedImageType('explanation');
    input.click();
    
    input.onchange = (event) => {
      if (event.target instanceof HTMLInputElement && event.target.files && event.target.files.length > 0) {
        const file = event.target.files[0];
        handleImageUpload(file);
      }
    };
  };

  const handleImageZoom = (imageUrl: string) => {
    setZoomedImage(imageUrl);
  };

  const handleImageAreaClick = (index: number, type: 'question' | 'explanation') => {
    if (imageEventProcessing) return;
    
    const isCurrentlyActive = activeImageArea?.index === index && 
                              activeImageArea?.type === type && 
                              isImageAreaActive;
    
    if (isCurrentlyActive) {
      if (type === 'question') {
        addImageToQuestion(new MouseEvent('click') as any, index);
      } else {
        addExplanationImageToQuestion(new MouseEvent('click') as any, index);
      }
    } else {
      setActiveImageArea({ index, type });
      setIsImageAreaActive(true);
      console.log("[DEBUG] 이미지 영역 활성화:", {index, type});
    }
  };

  const handleImageAreaMouseLeave = () => {
    if (!imageEventProcessing) {
      console.log("[DEBUG] 마우스가 이미지 영역을 떠남 - 상태 초기화");
      setActiveImageArea(null);
      setIsImageAreaActive(false);
    }
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isImageAreaActive && !imageEventProcessing) {
        const isMouseOverImageArea = (e.target as Element)?.closest('[data-image-area="true"]');
        
        if (!isMouseOverImageArea) {
          console.log("[DEBUG] 마우스가 모든 이미지 영역을 벗어남 - 상태 초기화");
          setActiveImageArea(null);
          setIsImageAreaActive(false);
        }
      }
    };
    
    const handleDocumentClick = (e: MouseEvent) => {
      if (isImageAreaActive && !imageEventProcessing) {
        const isClickOnImageArea = (e.target as Element)?.closest('[data-image-area="true"]');
        if (!isClickOnImageArea) {
          console.log("[DEBUG] 이미지 영역 외부 클릭 - 상태 초기화");
          setActiveImageArea(null);
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

  const handleSubmit = async () => {
    if (parsedQuestions.length === 0) {
      setErrorMessage("등록할 문제가 없습니다. 먼저 문제를 파싱해주세요.")
      return
    }
    
    const unansweredQuestions = parsedQuestions.filter(q => q.answer === -1);
    if (unansweredQuestions.length > 0) {
      setErrorMessage(`${unansweredQuestions.length}개의 문제에 정답이 선택되지 않았습니다.`);
      return;
    }
    
    const trimmedExamName = examName.trim();
    const trimmedYear = year.trim();
    const trimmedSession = session.trim();
    
    if (!trimmedExamName || !trimmedYear || !trimmedSession || !validateYear(trimmedYear)) {
      safeToast("필수 태그 오류", "시험명, 년도(YYYY 형식), 회차는 필수 입력 항목입니다.", "destructive" as ToastVariant);
      if (!validateYear(trimmedYear)) {
        setIsYearValid(false);
      }
      return;
    }
    
    setIsProcessing(true);
    setErrorMessage("");
    
    try {
      if (isEditMode && questionId) {
        const questionToUpdate = parsedQuestions[0];
        
        const combinedTags = [
          `시험명:${trimmedExamName}`,
          `년도:${trimmedYear}`,
          `회차:${trimmedSession}`,
          ...(subject.trim() ? [`과목:${subject.trim()}`] : []),
          ...globalTags,
          ...(questionToUpdate.tags || [])
        ].filter((tag, index, self) => self.indexOf(tag) === index);
        
        const questionPayload = {
          ...questionToUpdate,
          images: (questionToUpdate.images || []).map(url => normalizeUrl(url)),
          explanationImages: (questionToUpdate.explanationImages || []).map(url => normalizeUrl(url)),
          options: (questionToUpdate.options || []).map(opt => normalizeUrl(opt)),
          tags: combinedTags
        };

        console.log('수정할 문제 데이터 (태그 포함):', questionPayload);

        const response = await fetch(`/api/questions/${questionId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(questionPayload),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `문제 수정 실패`);
        }
        
        safeToast("문제 수정 완료", "문제가 성공적으로 수정되었습니다.", "success" as ToastVariant);
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const savedQuestions = [];
        let errors = [];
        
        for (let i = 0; i < parsedQuestions.length; i++) {
          const question = parsedQuestions[i];
          
          const combinedTags = [
            `시험명:${trimmedExamName}`,
            `년도:${trimmedYear}`,
            `회차:${trimmedSession}`,
            ...(subject.trim() ? [`과목:${subject.trim()}`] : []),
            ...globalTags,
            ...(question.tags || [])
          ].filter((tag, index, self) => self.indexOf(tag) === index);
          
          const questionPayload = {
            ...question,
            images: (question.images || []).map(url => normalizeUrl(url)),
            explanationImages: (question.explanationImages || []).map(url => normalizeUrl(url)),
            options: (question.options || []).map(opt => normalizeUrl(opt)),
            tags: combinedTags
          };
          
          try {
            console.log(`[DEBUG] 문제 ${i + 1} 전송 직전 Payload:`, JSON.stringify(questionPayload, null, 2));
            
            const response = await fetch('/api/questions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(questionPayload),
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              const errorMessage = errorData.error || `문제 ${i + 1} 등록 실패`;
              console.error(`문제 ${i + 1} 등록 응답 오류:`, errorData);
              throw new Error(errorMessage);
            }
            
            const data = await response.json();
            console.log(`문제 ${i + 1} 등록 성공:`, data);
            savedQuestions.push(data.question);
            
          } catch (error) {
            console.error(`문제 ${i + 1} 등록 중 오류:`, error);
            errors.push(`문제 ${i + 1}: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
          }
        }
        
        if (errors.length === 0) {
          safeToast("문제 등록 성공", `${savedQuestions.length}개의 문제가 성공적으로 등록되었습니다.`, "success" as ToastVariant);
          
          setParsedQuestions([]);
          setPasteValue("");
          setGlobalTags([]);
          setGlobalTagInput("");
        } else {
          safeToast("일부 문제 등록 성공", `${savedQuestions.length}개의 문제가 등록되었습니다. ${errors.length}개의 문제에서 오류가 발생했습니다.`, "warning" as ToastVariant);
          
          console.error("문제 등록 실패:", errors);
        }
      }
    } catch (error) {
      console.error("전체 문제 등록 처리 중 오류 발생:", error);
      setErrorMessage(error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.");
      
      safeToast(
        isEditMode ? "문제 수정 실패" : "문제 등록 실패",
        error instanceof Error ? error.message : "문제 저장 중 오류가 발생했습니다.",
        "destructive" as ToastVariant
      );
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const handleFocus = () => {
      console.log('[DEBUG] 브라우저 창 포커스 획득 - 활성 영역 재확인');
      if (activeImageArea) {
        setActiveImageArea(activeImageArea);
      }
    };

    const handleBlur = () => {
      console.log('[DEBUG] 브라우저 창 포커스 상실');
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [activeImageArea]);

  console.log("파싱된 문제:", parsedQuestions);

  const pasteFormImage = usePasteFormImage({
    parsedQuestions,
    setParsedQuestions,
    safeToast
  });

  const handleRemoveQuestion = () => {};
  const handleReorderQuestion = () => {};

  const validateYear = (value: string): boolean => /^\d{4}$/.test(value);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <TagSection
        examName={examName}
        year={year}
        isYearValid={isYearValid}
        session={session}
        subject={subject}
        tagInput={globalTagInput}
        tags={globalTags}
        onExamNameChange={setExamName}
        onYearChange={setYear}
        onSessionChange={setSession}
        onSubjectChange={setSubject}
        onTagInputChange={setGlobalTagInput}
        onAddTag={addGlobalTag}
        onRemoveTag={removeGlobalTag}
      />
      <div className="mb-4">
        <Textarea
          ref={textareaRef}
          value={pasteValue}
          onChange={e => setPasteValue(e.target.value)}
          className="min-h-[200px] font-mono text-sm"
          placeholder="여기에 문제를 붙여넣으세요..."
        />
        <div className="flex gap-3 justify-end mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleParseQuestions}
            disabled={isProcessing || !pasteValue.trim()}
          >
            {isProcessing ? "분석 중..." : "문제 분석"}
          </Button>
        </div>
      </div>
      <QuestionListSection
        questions={parsedQuestions}
        onEdit={setSelectedQuestionIndex}
        onRemove={handleRemoveQuestion}
        onReorder={handleReorderQuestion}
      />
      {parsedQuestions.length > 0 && (
        <div className="space-y-8 mt-8">
          {parsedQuestions.map((q, idx) => (
            <div key={idx} className="border rounded-lg shadow-sm bg-white p-6 relative">
              <div className="absolute -top-4 left-4 bg-white px-3 py-1 rounded shadow text-lg font-bold border border-gray-200">{idx + 1}번 문제</div>
              <div className="mb-4">
                <Textarea
                  value={q.content}
                  onChange={e => {
                    const value = e.target.value;
                    setParsedQuestions(prev => {
                      const updated = [...prev];
                      updated[idx].content = value;
                      return updated;
                    });
                  }}
                  className="w-full min-h-[60px] text-base font-medium"
                  placeholder="문제 내용을 입력하세요"
                />
              </div>
              <ImageSection
                questionImages={q.images || []}
                explanationImages={[]}
                onRemoveImage={(imgIdx) => {
                  setParsedQuestions(prev => {
                    const updated = [...prev];
                    updated[idx].images = (updated[idx].images || []).filter((_, i) => i !== imgIdx);
                    return updated;
                  });
                }}
                onZoomImage={handleImageZoom}
                onImageAreaClick={() => handleImageAreaClick(idx, 'question')}
                onImageAreaMouseLeave={handleImageAreaMouseLeave}
                isImageAreaActive={isImageAreaActive}
                type="question"
              />
              <OptionsSection
                options={q.options.map((text, oIdx) => ({ number: oIdx + 1, text, images: [] }))}
                answer={q.answer}
                onAddOption={() => addOption(idx)}
                onRemoveOption={optIdx => removeOption(idx, optIdx)}
                onUpdateOption={(optIdx, value) => updateOption(idx, optIdx, value)}
                onSetAnswer={optIdx => setQuestionAnswer(idx, optIdx)}
              />
              <ExplanationSection
                value={q.explanation || ''}
                onChange={e => {
                  const value = e.target.value;
                  setParsedQuestions(prev => {
                    const updated = [...prev];
                    updated[idx].explanation = value;
                    return updated;
                  });
                }}
                onPaste={handleTextAreaPaste}
              />
              <ImageSection
                questionImages={[]}
                explanationImages={q.explanationImages || []}
                onRemoveImage={(imgIdx) => {
                  setParsedQuestions(prev => {
                    const updated = [...prev];
                    updated[idx].explanationImages = (updated[idx].explanationImages || []).filter((_, i) => i !== imgIdx);
                    return updated;
                  });
                }}
                onZoomImage={handleImageZoom}
                onImageAreaClick={() => handleImageAreaClick(idx, 'explanation')}
                onImageAreaMouseLeave={handleImageAreaMouseLeave}
                isImageAreaActive={isImageAreaActive}
                type="explanation"
              />
            </div>
          ))}
        </div>
      )}
      <SubmitSection isSubmitting={isProcessing} isEditMode={isEditMode} />
    </form>
  )
} 