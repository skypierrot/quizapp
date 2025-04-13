"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useState, useRef, useEffect } from "react"
import { parseQuestionsImproved } from "@/utils/questionParser"
import { IQuestion } from "@/types"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Image as ImageIcon, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { generateId } from "@/lib/utils"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ToastType } from "@/types/toast"
import { convertToBase64 } from "@/utils/image"
import { ToastActionElement, ToastVariant } from "@/types/toast"

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
  
  // 안전한 토스트 처리 함수 추가
  const safeToast = (title: string, description: string = "", variant: string = "default") => {
    toast({
      title,
      description,
      variant: variant as any // any 타입으로 변경하여 타입 에러 우회
    });
  };
  
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
        examples: initialData.examples || []
      }];
    }
    return [];
  });
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [hasWarning, setHasWarning] = useState(false)
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(-1)
  const [selectedImageType, setSelectedImageType] = useState<'question' | 'explanation'>('question')
  const [activeImageArea, setActiveImageArea] = useState<{index: number, type: 'question' | 'explanation'} | null>(null)
  const [imageEventProcessing, setImageEventProcessing] = useState(false)
  const [processingCount, setProcessingCount] = useState(0)
  const [explanationText, setExplanationText] = useState<string>("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // 글로벌 태그 관련 상태
  const [globalTagInput, setGlobalTagInput] = useState("")
  const [globalTags, setGlobalTags] = useState<string[]>(() => {
    // 초기 데이터에서 태그 가져오기 (수정 모드)
    if (initialData?.tags) {
      return initialData.tags as string[];
    }
    return [];
  })
  const [year, setYear] = useState<string>("")
  const [subject, setSubject] = useState<string>("")
  const [session, setSession] = useState<string>("")
  
  // 문제별 태그 관련 상태
  const [questionTagInput, setQuestionTagInput] = useState("")
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // 붙여넣기 형식 예시
  const pasteExample = `1. 산업안전보건법령상 관계수급인 근로자가 도급인의 사업장에서 작업을 하는 경우 도급인의 안전조치 및 보건조치에 관한 설명으로 옳지 않은 것은?
① 도급인은 같은 장소에서 이루어지는 도급인과 관계수급인의 작업에 있어서 관계수급인의 작업시기ㆍ내용, 안전조치 및 보건조치 등을 확인하여야 한다.
② 건설업의 경우에는 도급사업의 정기 안전ㆍ보건 점검을 분기에 1회 이상 실시하여야 한다.
③ 관계수급인의 공사금액을 포함한 해당 공사의 총공사금액이 20억원 이상인 건설업의 경우 도급인은 그 사업장의 안전보건관리책임자를 안전보건총괄책임자로 지정하여야 한다.
④ 도급인은 도급인과 수급인을 구성원으로 하는 안전 및 보건에 관한 협의체를 도급인 및 그의 수급인 전원으로 구성하여야 한다.
⑤ 도급인은 제조업 작업장의 순회점검을 2일에 1회 이상 실시하여야 한다.`;

  // 새로운 상태 추가
  const [isImageAreaActive, setIsImageAreaActive] = useState(false);

  // 디바운스 함수로 마우스 이벤트 처리
  const setActiveImageAreaWithDebounce = (value: typeof activeImageArea) => {
    if (imageEventProcessing) {
      console.log("[DEBUG] 이미지 처리 중 - 영역 상태 변경 무시");
      safeToast("이미지 처리 중입니다. 잠시 후 다시 시도하세요.", "", "warning");
    }
    console.log("[DEBUG] 활성 이미지 영역 설정:", value);
    setActiveImageArea(value);
  };

  // 전역 붙여넣기 이벤트 리스너 등록
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
        return;  // null인 경우 토스트로 사용자 안내
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

  // 이미지 Blob 처리 함수
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
      // Base64 변환
      console.log("[DEBUG] 이미지 Base64 변환 중");
      const base64 = await convertToBase64(blob);
      
      // 중복 이미지 감지 알고리즘 개선
      const generateImageHash = (imgData: string) => {
        // 고유한 이미지 특성 추출 (처음, 중간, 끝부분 샘플링)
        if (imgData.length > 300) {
          const start = imgData.substring(0, 100);
          const middle = imgData.substring(Math.floor(imgData.length / 2) - 50, Math.floor(imgData.length / 2) + 50);
          const end = imgData.substring(imgData.length - 100);
          return start + middle + end;
        }
        return imgData;
      };
      
      // 실시간 상태 조회 - 함수형 업데이트로 최신 상태 보장
      setParsedQuestions(prevState => {
        const currentQuestion = prevState[questionIndex];
        if (!currentQuestion) {
          safeToast("문제를 찾을 수 없습니다", "", "destructive");
          return prevState;
        }
        
        // 이미지 배열 가져오기 (항상 string[] 타입으로 처리)
        const currentImages = isExplanation 
          ? (currentQuestion.explanationImages || []) 
          : (currentQuestion.images || []);
        
        // 중복 체크 (해시 기반)
        const newImageHash = generateImageHash(base64);
        const isDuplicate = currentImages.some(img => generateImageHash(img) === newImageHash);
        
        if (isDuplicate) {
          console.log("[DEBUG] 중복 이미지 감지");
          safeToast("이미지 중복", "이 이미지는 이미 등록되었습니다.", "warning");
          return prevState; // 변경 없음
        }
        
        // 새 이미지 추가 (중복이 아닌 경우만)
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

  // 텍스트 영역 붙여넣기 처리 수정
  const handleTextAreaPaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    // 이미지 타입이 있는지 확인
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') === 0) {
        // 텍스트 영역에서는 이미지 붙여넣기 차단
        e.preventDefault();
        safeToast("텍스트 영역에는 이미지를 붙여넣을 수 없습니다", "위쪽 이미지 영역에 붙여넣기 해주세요", "warning");
        return;
      }
    }
  };

  const handleParseQuestions = () => {
    setIsProcessing(true)
    setErrorMessage("")
    setHasWarning(false)
    
    try {
      if (!pasteValue.trim()) {
        throw new Error("문제 내용을 입력해주세요.")
      }
      
      // 개선된 파싱 로직 사용
      const parsedData = parseQuestionsImproved(pasteValue);
      
      // 경고 처리
      if (parsedData.errors.length > 0) {
        setHasWarning(true);
        console.warn("문제 파싱 중 경고:", parsedData.errors);
      }
      
      if (parsedData.questions.length === 0) {
        throw new Error("파싱할 수 있는 문제가 없습니다. 형식을 확인해주세요.")
      }
      
      // IQuestion[] → IParsedQuestion[] 변환
      const parsedDataQuestions: IParsedQuestion[] = parsedData.questions.map(q => ({
        content: q.content,
        options: q.options.map(opt => 
          typeof opt === 'string' ? opt : (opt as any).text || ""
        ),
        answer: -1, // 아직 선택되지 않음
        images: [], // 초기에는 모든 문제에 이미지 없음
        explanation: undefined, // 초기에는 해설 없음
        explanationImages: [], // 초기에는 해설 이미지 없음
        tags: [...globalTags], // 글로벌 태그를 기본적으로 추가
        examples: q.examples || []
      }));
      
      setParsedQuestions(parsedDataQuestions)
      console.log("파싱된 문제:", parsedDataQuestions)
      
    } catch (error) {
      console.error("문제 파싱 중 오류 발생:", error)
      setErrorMessage(error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.")
      setParsedQuestions([])
    } finally {
      setIsProcessing(false)
    }
  }

  // 이미지 업로드 핸들러 (파일 선택 시)
  const handleImageUpload = async (file: File) => {
    if (selectedQuestionIndex < 0) return;
    
    // 기존의 handleImageBlob 함수 재사용
    await handleImageBlob(
      file, 
      selectedQuestionIndex, 
      selectedImageType === 'explanation'
    );
  };

  // 이미지 추가 함수
  const addImageToQuestion = (e: React.MouseEvent, questionIndex: number) => {
    // 버블링 방지
    e.stopPropagation();
    
    // 파일 선택 다이얼로그 열기
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

  // 해설 이미지 추가 함수
  const addExplanationImageToQuestion = (e: React.MouseEvent, questionIndex: number) => {
    // 버블링 방지
    e.stopPropagation();
    
    // 파일 선택 다이얼로그 열기
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

  // 이미지 확대 모달 핸들러
  const handleImageZoom = (imageUrl: string) => {
    setZoomedImage(imageUrl);
  };

  // 이미지 영역 클릭 처리 함수 추가
  const handleImageAreaClick = (index: number, type: 'question' | 'explanation') => {
    if (imageEventProcessing) return;
    
    const isCurrentlyActive = activeImageArea?.index === index && 
                              activeImageArea?.type === type && 
                              isImageAreaActive;
    
    if (isCurrentlyActive) {
      // 이미 활성화된 상태에서 클릭하면 파일 업로드 다이얼로그 열기
      if (type === 'question') {
        addImageToQuestion(new MouseEvent('click') as any, index);
      } else {
        addExplanationImageToQuestion(new MouseEvent('click') as any, index);
      }
    } else {
      // 비활성화 상태에서 클릭하면 활성화
      setActiveImageArea({ index, type });
      setIsImageAreaActive(true);
      console.log("[DEBUG] 이미지 영역 활성화:", {index, type});
    }
  };

  // 이미지 영역 마우스 떠남 처리 함수 추가
  const handleImageAreaMouseLeave = () => {
    // 이미지 처리 중이 아닐 때만 상태 초기화
    if (!imageEventProcessing) {
      console.log("[DEBUG] 마우스가 이미지 영역을 떠남 - 상태 초기화");
      setActiveImageArea(null);
      setIsImageAreaActive(false);
    }
  };

  // 컴포넌트 마운트 시 전역 마우스 이벤트 리스너 등록
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      // 이미지 영역이 활성화된 상태일 때만 처리
      if (isImageAreaActive && !imageEventProcessing) {
        // 마우스가 현재 이미지 영역 내부에 있는지 확인
        const isMouseOverImageArea = (e.target as Element)?.closest('[data-image-area="true"]');
        
        // 마우스가 어느 이미지 영역에도 없으면 상태 초기화
        if (!isMouseOverImageArea) {
          console.log("[DEBUG] 마우스가 모든 이미지 영역을 벗어남 - 상태 초기화");
          setActiveImageArea(null);
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

  // ImageArea 컴포넌트 수정
  const ImageArea = ({ index, type, onAddImage }: { index: number, type: 'question' | 'explanation', onAddImage?: (e: React.MouseEvent, index: number) => void }) => {
    // 현재 영역이 활성화되었는지 확인 (전역 상태와 함께 체크)
    const isThisAreaActive = activeImageArea?.index === index && 
                             activeImageArea?.type === type && 
                             isImageAreaActive;
    
    return (
      <div 
        data-image-area="true"
        onClick={(e) => {
          e.stopPropagation();
          handleImageAreaClick(index, type);
        }}
        onMouseEnter={() => {
          if (activeImageArea?.index === index && 
              activeImageArea?.type === type && 
              isImageAreaActive) {
            console.log("[DEBUG] 마우스가 이미지 영역에 들어옴 - 활성 상태 유지", {index, type});
            // 이미 활성화된 상태라면 계속 유지
            setActiveImageArea({ index, type });
          }
        }}
        onMouseLeave={(e) => {
          e.stopPropagation();
          handleImageAreaMouseLeave();
        }}
        className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-md transition-colors cursor-pointer ${
          isThisAreaActive
            ? 'border-blue-300 bg-blue-50/60' // 옅은 파란색 점선 테두리와 음영
            : 'border-gray-300 hover:border-gray-400' // 검정색 대신 회색으로 변경
        }`}
      >
        <div className="flex flex-col items-center justify-center h-10">
          <ImageIcon className="w-5 h-5 text-gray-400" />
          <p className="mt-1 text-sm text-gray-500">
            {isThisAreaActive
              ? `한 번더 클릭 또는 Ctrl+V 하여 이미지 추가`
              : "한번 클릭하여 영역활성화"}
          </p>
        </div>
      </div>
    );
  };

  // 이미지 미리보기 컴포넌트
  const ImagePreview = ({ 
    image, 
    onRemove,
    questionIndex,
    imageIndex,
    isExplanation = false
  }: { 
    image: string, 
    onRemove: () => void,
    questionIndex: number,
    imageIndex: number,
    isExplanation?: boolean
  }) => {
    return (
      <div className="relative group overflow-hidden rounded-lg border shadow-sm mb-2 bg-white">
        <Button 
          type="button" 
          size="sm" 
          variant="destructive"
          onClick={onRemove}
          className="absolute top-2 right-2 h-6 w-6 p-0 rounded-full z-10 opacity-0 
                   group-hover:opacity-100 transition-opacity bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-700 border-none"
        >
          <X className="h-4 w-4" />
        </Button>
        <div 
          className="w-full transition-transform duration-300 hover:scale-105 cursor-zoom-in"
          onClick={() => handleImageZoom(image)}
        >
          <img 
            src={image} 
            alt={`${isExplanation ? '해설' : '문제'} ${questionIndex + 1} 이미지 ${imageIndex + 1}`} 
            className="w-full max-h-[300px] object-contain" 
          />
        </div>
      </div>
    );
  };

  // 글로벌 태그 추가 함수
  const addGlobalTag = () => {
    if (globalTagInput.trim() === '') return;
    
    if (!globalTags.includes(globalTagInput.trim())) {
      const newTags = [...globalTags, globalTagInput.trim()];
      setGlobalTags(newTags);
      
      // 이미 파싱된 문제에도 글로벌 태그 추가
      if (parsedQuestions.length > 0) {
        setParsedQuestions(prev => prev.map(q => ({
          ...q,
          tags: [...(q.tags || []), globalTagInput.trim()]
        })));
      }
    }
    
    setGlobalTagInput('');
  };
  
  // 글로벌 태그 삭제 함수
  const removeGlobalTag = (tagToRemove: string) => {
    const newTags = globalTags.filter(tag => tag !== tagToRemove);
    setGlobalTags(newTags);
    
    // 이미 파싱된 문제에서도 해당 태그 제거
    if (parsedQuestions.length > 0) {
      setParsedQuestions(prev => prev.map(q => ({
        ...q,
        tags: (q.tags || []).filter(tag => tag !== tagToRemove)
      })));
    }
  };
  
  // 문제별 태그 추가 함수
  const addQuestionTag = (questionIndex: number) => {
    if (questionTagInput.trim() === '') return;
    
    setParsedQuestions(prevQuestions => 
      prevQuestions.map((q, idx) => {
        if (idx !== questionIndex) return q;
        
        const currentTags = q.tags || [];
        
        if (!currentTags.includes(questionTagInput.trim())) {
          return { ...q, tags: [...currentTags, questionTagInput.trim()] };
        }
        
        return q;
      })
    );
    
    setQuestionTagInput('');
  };
  
  // 문제별 태그 삭제 함수
  const removeQuestionTag = (questionIndex: number, tagToRemove: string) => {
    setParsedQuestions(prevQuestions => 
      prevQuestions.map((q, idx) => {
        if (idx !== questionIndex) return q;
        
        const currentTags = q.tags || [];
        return { ...q, tags: currentTags.filter(tag => tag !== tagToRemove) };
      })
    );
  };
  
  // 기본 태그(년도, 과목, 회차) 적용 함수
  const applyBasicTags = () => {
    const tagsToAdd: string[] = [];
    
    if (year.trim()) tagsToAdd.push(`년도:${year.trim()}`);
    if (subject.trim()) tagsToAdd.push(`과목:${subject.trim()}`);
    if (session.trim()) tagsToAdd.push(`회차:${session.trim()}`);
    
    if (tagsToAdd.length === 0) return;
    
    // 새 태그 추가
    const newGlobalTags = [
      ...globalTags.filter(tag => !tag.startsWith('년도:') && !tag.startsWith('과목:') && !tag.startsWith('회차:')),
      ...tagsToAdd
    ];
    
    setGlobalTags(newGlobalTags);
    
    // 이미 파싱된 문제에도 적용
    if (parsedQuestions.length > 0) {
      setParsedQuestions(prev => prev.map(q => {
        const currentTags = q.tags || [];
        const filteredTags = currentTags.filter(tag => 
          !tag.startsWith('년도:') && !tag.startsWith('과목:') && !tag.startsWith('회차:')
        );
        
        return {
          ...q,
          tags: [...filteredTags, ...tagsToAdd]
        };
      }));
    }
  };

  // 선택지 관련 함수 추가
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
        
        // 새 옵션 배열 생성 (불변성 유지)
        const newOptions = q.options.filter((_, oIdx) => oIdx !== optionIndex);
        
        // 정답 인덱스 조정 로직
        let newAnswer = q.answer;
        
        if (q.answer === optionIndex) {
          // 삭제된 옵션이 현재 정답이었다면 정답 선택 취소
          newAnswer = -1;
          safeToast("알림", "선택한 정답이 삭제되었습니다.", "warning");
        } else if (q.answer > optionIndex) {
          // 삭제된 옵션보다 뒤에 있는 옵션이 정답이었다면 인덱스 조정
          newAnswer = q.answer - 1;
        }
        
        return { ...q, options: newOptions, answer: newAnswer };
      })
    );
  };

  // 문제 정답 설정 함수 - 안정성 개선
  const setQuestionAnswer = (questionIndex: number, optionIndex: number) => {
    console.log(`[ANSWER] 정답 선택 시작:`, {
      questionIndex,
      optionIndex,
      현재정답: parsedQuestions[questionIndex]?.answer,
      옵션개수: parsedQuestions[questionIndex]?.options.length
    });
    
    setParsedQuestions(prevQuestions => {
      // 기존 상태 깊은 복사로 불변성 보장
      const updatedQuestions = JSON.parse(JSON.stringify(prevQuestions));
      const currentQuestion = updatedQuestions[questionIndex];
      
      if (!currentQuestion) {
        console.error("[ANSWER] 문제를 찾을 수 없음:", {questionIndex});
        return prevQuestions;
      }
      
      // 현재 정답 상태
      const currentAnswer = currentQuestion.answer;
      
      // 토글 로직 - 동일한 옵션 클릭 시 선택 취소
      if (currentAnswer === optionIndex) {
        currentQuestion.answer = -1;
        console.log(`[ANSWER] 정답 취소됨`, {questionIndex, 이전: optionIndex, 현재: -1});
        safeToast("정답 취소", "정답 선택이 취소되었습니다.", "warning");
      } else {
        // 다른 옵션 선택 시 정답 변경
        currentQuestion.answer = optionIndex;
        console.log(`[ANSWER] 정답 변경됨`, {questionIndex, 이전: currentAnswer, 현재: optionIndex});
        safeToast("정답 설정", `${optionIndex + 1}번이 정답으로 설정되었습니다.`, "success");
      }
      
      // 선택 상태 UI 반영을 위한 상태 확인 (디버깅용)
      setTimeout(() => {
        console.log(`[ANSWER] 업데이트 확인:`, {
          questionIndex,
          변경된정답: currentQuestion.answer,
          상태확인: parsedQuestions[questionIndex]?.answer
        });
      }, 100);
      
      return updatedQuestions;
    });
  };

  const handleSubmit = async () => {
    if (parsedQuestions.length === 0) {
      setErrorMessage("등록할 문제가 없습니다. 먼저 문제를 파싱해주세요.")
      return
    }
    
    // 정답이 선택되지 않은 문제 확인
    const unansweredQuestions = parsedQuestions.filter(q => q.answer === -1);
    if (unansweredQuestions.length > 0) {
      setErrorMessage(`${unansweredQuestions.length}개의 문제에 정답이 선택되지 않았습니다.`);
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage("");
    
    try {
      // 수정 모드인 경우 단일 문제만 업데이트
      if (isEditMode && questionId) {
        // API에 전송할 데이터 준비
        const questionToUpdate = parsedQuestions[0];
        
        // API 호출
        const response = await fetch(`/api/questions/${questionId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(questionToUpdate),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `문제 수정 실패`);
        }
        
        safeToast("문제 수정 완료", "문제가 성공적으로 수정되었습니다.");
        
        // 성공 콜백이 있으면 호출
        if (onSuccess) {
          onSuccess();
        }
      } else {
        // 일반 등록 모드 - 여러 문제를 순차적으로 API에 저장
        const savedQuestions = [];
        let errors = [];
        
        for (let i = 0; i < parsedQuestions.length; i++) {
          const question = parsedQuestions[i];
          
          try {
            console.log(`문제 ${i + 1} 전송 데이터:`, question);
            
            // API 호출
            const response = await fetch('/api/questions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(question),
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
        
        // 결과 메시지 표시
        if (errors.length === 0) {
          safeToast("문제 등록 성공", `${savedQuestions.length}개의 문제가 성공적으로 등록되었습니다.`);
          
          // 성공 시 초기화
          setParsedQuestions([]);
          setPasteValue("");
          setGlobalTags([]);
          setGlobalTagInput("");
        } else {
          // 일부 문제만 성공한 경우
          safeToast("일부 문제 등록 성공", `${savedQuestions.length}개의 문제가 등록되었습니다. ${errors.length}개의 문제에서 오류가 발생했습니다.`, "warning");
          
          console.error("문제 등록 실패:", errors);
        }
      }
    } catch (error) {
      console.error("전체 문제 등록 처리 중 오류 발생:", error);
      setErrorMessage(error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.");
      
      safeToast(
        isEditMode ? "문제 수정 실패" : "문제 등록 실패",
        error instanceof Error ? error.message : "문제 저장 중 오류가 발생했습니다.",
        "destructive"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // useEffect에 창 포커스 이벤트 추가
  useEffect(() => {
    const handleFocus = () => {
      console.log('[DEBUG] 브라우저 창 포커스 획득 - 활성 영역 재확인');
      if (activeImageArea) {
        setActiveImageArea(activeImageArea);  // 강제 재설정
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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium mb-2">문제 붙여넣기</h3>
        <p className="text-sm text-gray-500 mb-2">
          아래 형식에 맞춰 문제를 붙여넣으세요. 여러 문제를 한 번에 등록할 수 있습니다.
        </p>
        
        <div className="text-xs text-gray-400 mb-2">
          예시 형식:
        </div>
        <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
          {pasteExample}
        </pre>
        
        {/* 기본 태그 설정 */}
        <div className="mb-4 p-4 border border-gray-200 rounded-md bg-white">
          <h4 className="text-sm font-medium mb-2">기본 태그 설정</h4>
          
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">년도:</label>
              <Input 
                type="text" 
                value={year} 
                onChange={(e) => setYear(e.target.value)} 
                className="text-sm h-8"
                placeholder="2024"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">과목:</label>
              <Input 
                type="text" 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)} 
                className="text-sm h-8"
                placeholder="산업안전기사"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">회차:</label>
              <Input 
                type="text" 
                value={session} 
                onChange={(e) => setSession(e.target.value)} 
                className="text-sm h-8"
                placeholder="1회"
              />
            </div>
          </div>
          
          <div className="flex gap-2 mb-2">
            <Input 
              type="text" 
              value={globalTagInput} 
              onChange={(e) => setGlobalTagInput(e.target.value)} 
              className="text-sm flex-1"
              onKeyDown={(e) => e.key === 'Enter' && addGlobalTag()}
              placeholder="추가 태그 입력 후 Enter"
            />
            <Button type="button" variant="outline" size="sm" onClick={addGlobalTag}>추가</Button>
          </div>
          
          {globalTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {globalTags.map((tag, i) => (
                <Badge 
                  key={`global-tag-${i}`} 
                  variant="secondary" 
                  className="flex items-center px-2 py-1 text-sm"
                >
                  <span className="max-w-[150px] truncate">{tag}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeGlobalTag(tag)}
                    className="h-5 w-5 p-0 ml-1"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
          
          <div className="flex justify-end mt-2">
            <Button 
              onClick={applyBasicTags}
              className="whitespace-nowrap"
              size="sm"
            >
              태그 적용
            </Button>
          </div>
        </div>
        
        <div className="relative rounded-md transition-all">
          <Textarea
            ref={textareaRef}
            value={pasteValue}
            onChange={(e) => setPasteValue(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
            placeholder="여기에 문제를 붙여넣으세요..."
          />
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
          {errorMessage}
        </div>
      )}

      <div className="flex gap-3 justify-end">
        {!isEditMode && (
          <Button
            type="button"
            variant="outline"
            onClick={() => handleParseQuestions()}
            disabled={isProcessing || isSubmitting || !pasteValue.trim()}
          >
            {isProcessing ? "분석 중..." : "문제 분석"}
          </Button>
        )}
        
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || parsedQuestions.length === 0}
        >
          {isSubmitting 
            ? (isEditMode ? "수정 중..." : "등록 중...") 
            : (isEditMode ? "문제 수정하기" : `문제 등록 (${parsedQuestions.length}개)`)}
        </Button>
      </div>

      {parsedQuestions.length > 0 && (
        <div className="mt-6">
          <h3 className="font-medium mb-3">분석된 문제 ({parsedQuestions.length}개)</h3>
          <div className="grid grid-cols-1 gap-4">
            {parsedQuestions.map((q, qIndex) => (
              <div key={qIndex} className="border rounded-md p-4 shadow-sm">
                <div className="flex justify-between mb-3">
                  <p className="font-medium">
                    {qIndex + 1}. {q.content}
                  </p>
                </div>
                
                {/* 문제 이미지 영역 - 개선된 구조 */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">문제 이미지</h4>
                  
                  {/* 이미지 미리보기 영역 */}
                  {q.images && q.images.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      {q.images.map((img, imgIndex) => (
                        <ImagePreview
                          key={`question-image-${qIndex}-${imgIndex}`}
                          image={img}
                          questionIndex={qIndex}
                          imageIndex={imgIndex}
                          onRemove={() => {
                            setParsedQuestions(prev => {
                              const updated = [...prev];
                              updated[qIndex].images = updated[qIndex].images.filter((_, idx) => idx !== imgIndex);
                              return updated;
                            });
                          }}
                        />
                      ))}
                    </div>
                  )}
                  
                  {/* 이미지 붙여넣기 영역 */}
                  <ImageArea 
                    index={qIndex} 
                    type="question" 
                    onAddImage={addImageToQuestion}
                  />
                </div>
                
                {/* 보기 표시 (ㄱ,ㄴ,ㄷ,ㄹ 형태) */}
                {q.examples && q.examples.length > 0 && (
                  <div className="mb-3 bg-gray-50 p-3 rounded text-sm">
                    <h4 className="font-medium mb-1">보기:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ'].map((label, i) => (
                        q.examples && i < q.examples.length ? (
                          <div key={i} className="flex">
                            <span className="font-bold mr-2">{label}.</span>
                            <span>{q.examples[i]}</span>
                          </div>
                        ) : null
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 정답 선택 버튼과 선택지 추가 버튼을 한 줄에 배치 */}
                <div className="flex justify-between items-center mb-3">
                  <p className="font-medium text-sm text-gray-700">정답 선택: <span className="text-gray-900 font-bold">{q.answer > -1 ? `${q.answer + 1}번` : "선택 안됨"}</span></p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => addOption(qIndex)}
                    className="text-xs h-8 px-2"
                  >
                    <Plus className="h-4 w-4 mr-1" /> 선택지 추가
                  </Button>
                </div>
                
                {/* 선택지 목록 */}
                <div className="space-y-3 mb-3">{q.options.map((option, optIndex) => (
                    <div 
                      key={optIndex} 
                      className={`flex gap-2 items-center p-2 rounded-lg border-2 transition-all duration-200 hover:bg-gray-50 ${
                        q.answer === optIndex 
                          ? 'border-gray-800 bg-gray-50/80' 
                          : 'border-gray-200'
                      }`}
                    >
                      <div 
                        onClick={() => {
                          console.log(`선택지 클릭: 문제 ${qIndex}, 옵션 ${optIndex}, 현재 정답: ${q.answer}`);
                          setQuestionAnswer(qIndex, optIndex);
                        }}
                        className={`flex items-center justify-center h-10 w-10 rounded-full text-sm font-bold cursor-pointer transition-all duration-200 ${
                          q.answer === optIndex 
                            ? 'bg-gray-800 text-white shadow-sm ring-2 ring-gray-300' 
                            : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {optIndex + 1}
                      </div>
                      <Input
                        value={option}
                        onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                        className={`flex-1 text-sm border-gray-200 focus:ring-1 focus:ring-gray-400 ${
                          q.answer === optIndex ? 'bg-white' : ''
                        }`}
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeOption(qIndex, optIndex)}
                        className="h-10 w-10 rounded-full p-0 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                {/* 문제별 태그 UI 개선 */}
                {/* 문제별 태그 영역 */}
                <div className="mb-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium mb-2">문제 태그</h4>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={questionTagInput}
                        onChange={(e) => setQuestionTagInput(e.target.value)}
                        className="text-sm max-w-[200px]"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addQuestionTag(qIndex);
                          }
                        }}
                        placeholder="태그 입력 후 Enter"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => addQuestionTag(qIndex)}
                      >
                        추가
                      </Button>
                    </div>
                  </div>
                  
                  {/* 태그 목록 */}
                  {q.tags && q.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {q.tags.map((tag, tagIdx) => (
                        <div 
                          key={`tag-${qIndex}-${tagIdx}`} 
                          className="bg-gray-100 text-gray-800 rounded-full px-3 py-1 text-sm flex items-center"
                        >
                          {tag}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeQuestionTag(qIndex, tag)}
                            className="h-5 w-5 p-0 ml-1 text-gray-500 hover:text-gray-700"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="space-y-3 mt-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">해설</h3>
                    <textarea
                      className="w-full p-3 border rounded-md h-24 bg-gray-50"
                      placeholder="해설을 입력하세요..."
                      value={q.explanation || ''}
                      onChange={(e) => {
                        setParsedQuestions(prev => {
                          const updated = [...prev];
                          updated[qIndex].explanation = e.target.value;
                          return updated;
                        });
                      }}
                      onPaste={handleTextAreaPaste}
                    />
                  </div>
                  
                  {/* 해설 이미지 영역 - 개선된 구조 */}
                  <div className="mb-3">
                    <h4 className="text-sm font-medium mb-2">해설 이미지</h4>
                    
                    {/* 해설 이미지 미리보기 */}
                    {q.explanationImages && q.explanationImages.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        {q.explanationImages.map((img, imgIndex) => (
                          <ImagePreview
                            key={`explanation-image-${qIndex}-${imgIndex}`}
                            image={img}
                            questionIndex={qIndex}
                            imageIndex={imgIndex}
                            isExplanation={true}
                            onRemove={() => {
                              setParsedQuestions(prev => {
                                const updated = [...prev];
                                if (updated[qIndex].explanationImages) {
                                  updated[qIndex].explanationImages = updated[qIndex].explanationImages!.filter((_, idx) => idx !== imgIndex);
                                }
                                return updated;
                              });
                            }}
                          />
                        ))}
                      </div>
                    )}
                    
                    {/* 해설 이미지 붙여넣기 영역 */}
                    <ImageArea 
                      index={qIndex} 
                      type="explanation" 
                      onAddImage={addExplanationImageToQuestion}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 이미지 확대 모달 */}
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
    </div>
  )
} 