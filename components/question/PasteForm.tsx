"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useState, useRef, useEffect, ChangeEvent } from "react"
import { parseQuestionsImproved } from "@/utils/questionParser"
import { IQuestion } from "@/types"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Image as ImageIcon } from "lucide-react"
import { useToast, ToastOptions } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { ImagePlus } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { ToastActionElement, ToastVariant } from "@/components/ui/toast"
import TagSelector from "@/components/tags/TagSelector"
import { 
  generateId, 
  parseQuestions, 
  type IOption, 
  type ITag 
} from "@/lib/utils"

interface IParsedQuestion {
  content: string;
  examples?: string[]; // ㄱ,ㄴ,ㄷ,ㄹ 형태의 보기들
  options: string[];
  answer: number;
  images: string[]; // 이미지 URL 배열
  explanation?: string; // 해설 텍스트
  explanationImages?: string[]; // 해설 이미지 URL 배열
  tags?: string[]; // 문제별 태그
}

export function PasteForm() {
  const { toast } = useToast();
  const [pasteValue, setPasteValue] = useState("")
  const [parsedQuestions, setParsedQuestions] = useState<IParsedQuestion[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [clipboardImage, setClipboardImage] = useState<string | null>(null)
  const [hasWarning, setHasWarning] = useState(false)
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(-1)
  const [selectedImageType, setSelectedImageType] = useState<'question' | 'explanation'>('question')
  const [explanationText, setExplanationText] = useState<string>("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isPasteAreaFocused, setIsPasteAreaFocused] = useState(false)
  
  // 글로벌 태그 관련 상태
  const [globalTagInput, setGlobalTagInput] = useState("")
  const [globalTags, setGlobalTags] = useState<string[]>([])
  const [year, setYear] = useState<string>("")
  const [subject, setSubject] = useState<string>("")
  const [session, setSession] = useState<string>("")
  
  // 문제별 태그 관련 상태
  const [questionTagInput, setQuestionTagInput] = useState("")

  // 붙여넣기 형식 예시
  const pasteExample = `1. 산업안전보건법령상 관계수급인 근로자가 도급인의 사업장에서 작업을 하는 경우 도급인의 안전조치 및 보건조치에 관한 설명으로 옳지 않은 것은?
① 도급인은 같은 장소에서 이루어지는 도급인과 관계수급인의 작업에 있어서 관계수급인의 작업시기ㆍ내용, 안전조치 및 보건조치 등을 확인하여야 한다.
② 건설업의 경우에는 도급사업의 정기 안전ㆍ보건 점검을 분기에 1회 이상 실시하여야 한다.
③ 관계수급인의 공사금액을 포함한 해당 공사의 총공사금액이 20억원 이상인 건설업의 경우 도급인은 그 사업장의 안전보건관리책임자를 안전보건총괄책임자로 지정하여야 한다.
④ 도급인은 도급인과 수급인을 구성원으로 하는 안전 및 보건에 관한 협의체를 도급인 및 그의 수급인 전원으로 구성하여야 한다.
⑤ 도급인은 제조업 작업장의 순회점검을 2일에 1회 이상 실시하여야 한다.

2. 산업안전보건법령상 '대여자 등이 안전조치 등을 해야 하는 기계ㆍ기구ㆍ설비 및 건축물 등'에 규정되어 있는 것을 모두 고른 것은? (단, 고용노동부장관이 정하여 고시하는 기계ㆍ기구ㆍ설비 및 건축물 등은 고려하지 않음)
ㄱ. 이동식 크레인
ㄴ. 고소작업대
ㄷ. 리프트
ㄹ. 곤돌라
① ㄱ, ㄴ
② ㄱ, ㄷ
③ ㄴ, ㄹ
④ ㄱ, ㄷ, ㄹ
⑤ ㄴ, ㄷ, ㄹ`;

  const handlePaste = (e: React.ClipboardEvent) => {
    // 이미 처리된 이벤트인지 확인
    if ((e as any)._handledPaste) {
      return;
    }
    
    // 이벤트가 처리됨으로 표시
    (e as any)._handledPaste = true;
    
    const clipboardData = e.clipboardData;
    const items = clipboardData.items;
    let imageFound = false;
    
    // 현재 붙여넣기 위치 확인
    const targetElement = e.target as HTMLElement;
    const container = targetElement.closest('[data-question-index]');
    const questionIndex = container?.getAttribute('data-question-index');
    const imageType = container?.getAttribute('data-image-type');
    
    if (!questionIndex) {
      // 처리 플래그 제거
      delete (e as any)._handledPaste;
      return;
    }
    
    // 이미지 파일 확인
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.type.indexOf('image') === 0) {
        imageFound = true;
        
        // 이미지인 경우 기본 동작 중지 (텍스트 영역에 이미지 URL이 추가되는 것 방지)
        e.preventDefault();
        
        const blob = item.getAsFile();
        
        if (blob) {
          // Base64로 이미지 변환
          const reader = new FileReader();
          
          reader.onload = (readerEvent) => {
            const base64Url = readerEvent.target?.result as string;
            
            if (imageType === 'question') {
              // 질문 이미지 업데이트
              setParsedQuestions(prev => {
                const updated = [...prev];
                const qIndex = parseInt(questionIndex);
                const currentImages = updated[qIndex].images || [];
                updated[qIndex] = {
                  ...updated[qIndex],
                  images: [...currentImages, base64Url]
                };
                return updated;
              });
              toast({
                title: "이미지 추가 완료",
                description: `문제 ${parseInt(questionIndex) + 1}에 이미지가 추가되었습니다.`,
                variant: "success"
              });
            } else if (imageType === 'explanation') {
              // 설명 이미지 업데이트
              setParsedQuestions(prev => {
                const updated = [...prev];
                const qIndex = parseInt(questionIndex);
                const currentExplanationImages = updated[qIndex].explanationImages || [];
                updated[qIndex] = {
                  ...updated[qIndex],
                  explanationImages: [...currentExplanationImages, base64Url]
                };
                return updated;
              });
              toast({
                title: "이미지 추가 완료",
                description: `문제 ${parseInt(questionIndex) + 1}의 해설에 이미지가 추가되었습니다.`,
                variant: "success"
              });
            }
          };
          
          reader.onerror = () => {
            toast({
              title: "이미지 추가 실패",
              description: "이미지를 처리하는 중 오류가 발생했습니다.",
              variant: "error"
            });
          };
          
          reader.readAsDataURL(blob);
          break; // 첫 번째 이미지만 처리
        }
      }
    }
    
    // 이미지가 없으면 플래그 제거 (다음 붙여넣기를 위해)
    if (!imageFound) {
      delete (e as any)._handledPaste;
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file) {
      toast({
        title: "이미지가 선택되지 않았습니다",
        variant: "error"
      });
      return;
    }
    
    // 파일 크기 체크 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "이미지 크기가 너무 큽니다",
        description: "10MB 이하의 이미지만 업로드 가능합니다",
        variant: "error"
      });
      return;
    }
    
    // 이미지 파일인지 확인
    if (!file.type.startsWith('image/')) {
      toast({
        title: "이미지 파일만 업로드 가능합니다",
        variant: "error"
      });
      return;
    }
    
    try {
      const base64 = await convertToBase64(file);
      
      if (selectedQuestionIndex !== -1 && selectedQuestionIndex < parsedQuestions.length) {
        const isExplanation = selectedImageType === 'explanation';
        
        setParsedQuestions(prev => {
          const updated = [...prev];
          const question = updated[selectedQuestionIndex];
          
          if (isExplanation) {
            // 해설 이미지 업데이트
            const explanationImages = question.explanationImages || [];
            updated[selectedQuestionIndex] = {
              ...question,
              explanationImages: [...explanationImages, base64]
            };
          } else {
            // 문제 이미지 업데이트
            const images = question.images || [];
            updated[selectedQuestionIndex] = {
              ...question,
              images: [...images, base64]
            };
          }
          
          return updated;
        });
        
        toast({
          title: "이미지 추가 완료",
          description: `문제 ${selectedQuestionIndex + 1}의 ${isExplanation ? '해설' : '문제'}에 이미지가 추가되었습니다`,
          variant: "success"
        });
      } else {
        toast({
          title: "선택된 문제가 없습니다",
          description: "먼저 문제를 선택해주세요",
          variant: "error"
        });
      }
    } catch (error) {
      console.error('이미지 변환 오류:', error);
      toast({
        title: "이미지 변환 실패",
        description: "이미지를 처리하는 중 오류가 발생했습니다",
        variant: "error"
      });
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
        options: q.options.map(opt => opt.text),
        answer: -1, // 아직 선택되지 않음
        images: [], // 초기에는 모든 문제에 이미지 없음
        explanation: undefined, // 초기에는 해설 없음
        explanationImages: [], // 초기에는 해설 이미지 없음
        tags: [...globalTags], // 글로벌 태그를 기본적으로 추가
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

  // 문제에 이미지 추가
  const addImageToQuestion = (e: React.MouseEvent | React.ChangeEvent<HTMLInputElement>, questionIndex: number) => {
    // 버블링 방지
    e.stopPropagation?.();
    
    // 이벤트가 input 변경 이벤트인 경우
    if ('target' in e && 'files' in e.target && e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedQuestionIndex(questionIndex);
      setSelectedImageType('question');
      handleImageUpload(file);
      return;
    }
    
    // 클릭 이벤트인 경우 파일 선택 다이얼로그 열기
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

  // 문제에 해설 이미지 추가
  const addExplanationImageToQuestion = (e: React.MouseEvent | React.ChangeEvent<HTMLInputElement>, questionIndex: number) => {
    // 버블링 방지
    e.stopPropagation?.();
    
    // 이벤트가 input 변경 이벤트인 경우
    if ('target' in e && 'files' in e.target && e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedQuestionIndex(questionIndex);
      setSelectedImageType('explanation');
      handleImageUpload(file);
      return;
    }
    
    // 클릭 이벤트인 경우 파일 선택 다이얼로그 열기
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

  // 이미지 파일을 Base64로 변환하는 유틸리티 함수
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  // 문제에 해설 텍스트 추가
  const addExplanationTextToQuestion = (questionIndex: number, text: string) => {
    setParsedQuestions(prev => {
      const updated = [...prev];
      updated[questionIndex].explanation = text;
      return updated;
    });
    setExplanationText('');
  };

  const setQuestionAnswer = (questionIndex: number, answerIndex: number) => {
    console.log(`정답 선택: 문제 ${questionIndex}, 답변 ${answerIndex}`);
    
    setParsedQuestions(prevQuestions => 
      prevQuestions.map((q, idx) => {
        if (idx !== questionIndex) return q;
        
        // 토글 방식 - 동일한 답변을 다시 클릭하면 선택 취소
        const newAnswer = q.answer === answerIndex ? -1 : answerIndex;
        
        console.log(`문제 ${questionIndex}의 정답 변경: ${q.answer} -> ${newAnswer}`);
        
        // 토스트 메시지 표시
        if (q.answer !== answerIndex) {
          if (newAnswer >= 0) {
            toast({
              title: "정답이 선택되었습니다",
              description: `${questionIndex + 1}번 문제의 정답: ${newAnswer + 1}번`
            });
          } else {
            toast({
              title: "정답 선택이 취소되었습니다",
              description: `${questionIndex + 1}번 문제`
            });
          }
        }
        
        return { ...q, answer: newAnswer };
      })
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
  const addQuestionTag = (questionIndex: number, e?: React.MouseEvent) => {
    // 버블링 방지 추가
    e?.stopPropagation();
    
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
  const removeQuestionTag = (questionIndex: number, tagToRemove: string, e?: React.MouseEvent) => {
    // 버블링 방지 추가
    e?.stopPropagation();
    
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
          toast({
            title: "알림",
            description: "선택한 정답이 삭제되었습니다."
          });
        } else if (q.answer > optionIndex) {
          // 삭제된 옵션보다 뒤에 있는 옵션이 정답이었다면 인덱스 조정
          newAnswer = q.answer - 1;
        }
        
        return { ...q, options: newOptions, answer: newAnswer };
      })
    );
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
    
    setIsProcessing(true);
    setErrorMessage("");
    
    try {
      // 여러 문제를 순차적으로 API에 저장
      const savedQuestions = [];
      let errors = [];
      
      for (let i = 0; i < parsedQuestions.length; i++) {
        const question = parsedQuestions[i];
        
        try {
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
            throw new Error(errorData.error || `문제 ${i + 1} 등록 실패`);
          }
          
          const data = await response.json();
          savedQuestions.push(data.question);
          
        } catch (error) {
          console.error(`문제 ${i + 1} 등록 중 오류:`, error);
          errors.push(`문제 ${i + 1}: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
        }
      }
      
      // 결과 메시지 표시
      if (errors.length === 0) {
        toast({
          title: "문제 등록 성공",
          description: `${savedQuestions.length}개의 문제가 성공적으로 등록되었습니다.`
        });
        
        // 성공 시 초기화
        setParsedQuestions([]);
        setPasteValue("");
        setGlobalTags([]);
        setGlobalTagInput("");
      } else {
        // 일부 문제만 성공한 경우
        toast({
          title: "일부 문제 등록 성공",
          description: `${savedQuestions.length}개의 문제가 등록되었습니다. ${errors.length}개의 문제에서 오류가 발생했습니다.`,
          variant: "warning"
        });
        
        console.error("문제 등록 실패:", errors);
      }
    } catch (error) {
      console.error("전체 문제 등록 처리 중 오류 발생:", error);
      setErrorMessage(error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.");
      
      toast({
        title: "문제 등록 실패",
        description: "문제 등록 중 오류가 발생했습니다.",
        variant: "error"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // ImageDropZone 컴포넌트 개선
  const ImageDropZone = ({ 
    children, 
    questionIndex, 
    imageType 
  }: { 
    children: React.ReactNode, 
    questionIndex: number, 
    imageType: 'question' | 'explanation' 
  }) => {
    const imagesCount = imageType === 'question' 
      ? parsedQuestions[questionIndex]?.images?.length || 0
      : parsedQuestions[questionIndex]?.explanationImages?.length || 0;

    return (
      <div 
        data-question-index={questionIndex}
        data-image-type={imageType}
        onPaste={handlePaste}
        className="relative border rounded-md p-4 transition-all hover:border-blue-300 mb-4"
      >
        {children}
        <div className="absolute bottom-2 right-2 pointer-events-none flex items-center">
          <div className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm flex items-center gap-1 border border-blue-200">
            <ImageIcon className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-gray-600">
              Ctrl+V로 {imageType === 'question' ? '문제' : '해설'} 이미지 붙여넣기 가능 ({imagesCount}개)
            </span>
          </div>
        </div>
      </div>
    );
  };

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
        
        {/* 기본 태그 설정 (년도, 과목, 회차) */}
        <div className="flex flex-wrap gap-2 mb-4 mt-4 p-3 border border-gray-200 rounded-md bg-gray-50">
          <div className="w-full">
            <h4 className="text-sm font-medium mb-2">기본 태그 설정</h4>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <div className="flex items-center gap-2">
              <label className="text-sm whitespace-nowrap">년도:</label>
              <Input 
                type="text" 
                value={year} 
                onChange={(e) => setYear(e.target.value)} 
                className="w-20 h-8 text-sm" 
                placeholder="2024"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm whitespace-nowrap">과목:</label>
              <Input 
                type="text" 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)} 
                className="w-32 h-8 text-sm" 
                placeholder="산업안전기사"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm whitespace-nowrap">회차:</label>
              <Input 
                type="text" 
                value={session} 
                onChange={(e) => setSession(e.target.value)} 
                className="w-20 h-8 text-sm" 
                placeholder="1회"
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
        
        {/* 글로벌 태그 설정 */}
        <div className="mb-4 p-3 border border-gray-200 rounded-md">
          <h4 className="text-sm font-medium mb-2">공통 태그 설정 (모든 문제에 적용)</h4>
          <div className="flex gap-2 mb-2">
            <Input 
              type="text" 
              value={globalTagInput} 
              onChange={(e) => setGlobalTagInput(e.target.value)} 
              className="text-sm"
              onKeyDown={(e) => e.key === 'Enter' && addGlobalTag()}
              placeholder="태그 입력 후 Enter"
            />
            <Button type="button" variant="outline" size="sm" onClick={addGlobalTag}>추가</Button>
          </div>
          {globalTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {globalTags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                  {tag}
                  <button 
                    type="button" 
                    onClick={() => removeGlobalTag(tag)}
                    className="ml-1 text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
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
        <Button
          type="button"
          variant="outline"
          onClick={handleParseQuestions}
          disabled={isProcessing || !pasteValue.trim()}
        >
          {isProcessing ? "분석 중..." : "문제 분석"}
        </Button>
        
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isProcessing || parsedQuestions.length === 0}
        >
          {isProcessing ? "등록 중..." : `문제 등록 (${parsedQuestions.length}개)`}
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
                
                {/* 문제 이미지 영역 - 이미지 갤러리 디자인 개선 */}
                <ImageDropZone 
                  questionIndex={qIndex}
                  imageType="question"
                >
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-2">
                      {q.images && q.images.length > 0 && q.images.map((imgBase64, imgIndex) => (
                        <div key={`image-${qIndex}-${imgIndex}`} className="relative border rounded overflow-hidden h-24 w-24">
                          <Button 
                            type="button" 
                            size="sm" 
                            variant="destructive"
                            onClick={() => {
                              setParsedQuestions(prev => {
                                const updated = [...prev];
                                updated[qIndex].images.splice(imgIndex, 1);
                                return updated;
                              });
                            }}
                            className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full z-10 opacity-90 hover:opacity-100"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <img 
                            src={imgBase64} 
                            alt={`문제 ${qIndex + 1} 이미지 ${imgIndex + 1}`} 
                            className="h-full w-full object-cover" 
                          />
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        className="h-24 w-24 flex flex-col items-center justify-center gap-1 border-dashed"
                        onClick={(e) => addImageToQuestion(e, qIndex)}
                      >
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                        <span className="text-xs text-gray-500">이미지 추가</span>
                      </Button>
                    </div>
                  </div>
                </ImageDropZone>
                
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
                
                {/* 정답 선택 버튼 - 스타일 수정 */}
                <div className="mb-3">
                  <p className="font-medium text-sm mb-2">정답 선택: {q.answer > -1 ? `${q.answer + 1}번` : "선택 안됨"}</p>
                  <div className="flex flex-wrap gap-2">
                    {q.options.map((_, optIndex) => (
                      <Button 
                        key={optIndex}
                        type="button"
                        size="sm"
                        variant={q.answer === optIndex ? "default" : "outline"}
                        onClick={() => setQuestionAnswer(qIndex, optIndex)}
                        className={`w-10 h-10 p-0 flex items-center justify-center transition-all duration-200 ${
                          q.answer === optIndex 
                            ? "bg-black text-white hover:bg-gray-800 ring-2 ring-gray-300 font-bold transform scale-110 shadow-md border-2 border-gray-400" 
                            : "border-2 border-gray-300 hover:bg-gray-100 text-gray-700"
                        }`}
                      >
                        <span className="text-lg font-semibold">{optIndex + 1}</span>
                      </Button>
                    ))}
                  </div>
                </div>
                
                {/* 선택지 목록 - 편집 가능하도록 수정 */}
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between">
                    <p className="font-medium text-sm">선택지:</p>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => addOption(qIndex)}
                      className="h-7"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      선택지 추가
                    </Button>
                  </div>
                  {q.options.map((option, optIndex) => (
                    <div key={optIndex} className="flex items-center gap-2">
                      <div className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-bold transition-all duration-200 ${
                        q.answer === optIndex 
                          ? 'bg-black text-white border-2 border-gray-300 shadow-md transform scale-110' 
                          : 'bg-gray-100 text-gray-700 border border-gray-300'
                      }`}>
                        {optIndex + 1}
                      </div>
                      <Input
                        value={option}
                        onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                        className="flex-1 text-sm"
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => removeOption(qIndex, optIndex)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                {/* 문제별 태그 섹션 */}
                <div className="mb-3">
                  <div className="flex items-center mb-2">
                    <p className="font-medium text-sm mr-2">태그:</p>
                    <div className="flex flex-wrap gap-1">
                      {q.tags?.map((tag, tIndex) => (
                        <Badge key={tIndex} variant="secondary" className="cursor-pointer" onClick={(e) => removeQuestionTag(qIndex, tag, e)}>
                          {tag} <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex ml-auto">
                      <Input 
                        type="text"
                        value={qIndex === selectedQuestionIndex ? questionTagInput : ''}
                        onChange={(e) => setQuestionTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            addQuestionTag(qIndex);
                          }
                        }}
                        onClick={(e) => setSelectedQuestionIndex(qIndex)}
                        placeholder="태그 추가..."
                        className="text-xs h-7 w-32"
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => addQuestionTag(qIndex, e)}
                        className="h-7 ml-1"
                      >
                        추가
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 border-t pt-3">
                  <div className="flex justify-between mb-2">
                    <p className="font-medium text-sm">해설:</p>
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => addExplanationImageToQuestion(e, qIndex)}
                      >
                        <ImageIcon className="h-4 w-4 mr-1" />
                        해설 이미지
                      </Button>
                    </div>
                  </div>
                  
                  {/* 해설 텍스트 입력 */}
                  <div className="mb-2 relative">
                    <Textarea
                      value={qIndex === selectedQuestionIndex ? explanationText : q.explanation || ''}
                      onChange={(e) => {
                        if (qIndex === selectedQuestionIndex) {
                          setExplanationText(e.target.value);
                        } else {
                          setParsedQuestions(prev => {
                            const updated = [...prev];
                            updated[qIndex].explanation = e.target.value;
                            return updated;
                          });
                        }
                      }}
                      data-question-index={qIndex}
                      data-image-type="explanation"
                      onPaste={handlePaste}
                      placeholder="해설을 입력하세요..."
                      className="text-sm min-h-[80px]"
                    />
                    
                    {qIndex === selectedQuestionIndex && explanationText.trim() !== '' && (
                      <Button 
                        type="button"
                        size="sm"
                        className="absolute bottom-2 right-2"
                        onClick={() => addExplanationTextToQuestion(qIndex, explanationText)}
                      >
                        저장
                      </Button>
                    )}
                  </div>
                  
                  {/* 해설 이미지 영역 - 이미지 갤러리 디자인 개선 */}
                  <ImageDropZone 
                    questionIndex={qIndex}
                    imageType="explanation"
                  >
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-2">
                        {q.explanationImages && q.explanationImages.length > 0 && q.explanationImages.map((imgBase64, imgIndex) => (
                          <div key={`exp-image-${qIndex}-${imgIndex}`} className="relative border rounded overflow-hidden h-24 w-24">
                            <Button 
                              type="button" 
                              size="sm" 
                              variant="destructive"
                              onClick={() => {
                                setParsedQuestions(prev => {
                                  const updated = [...prev];
                                  if (updated[qIndex].explanationImages) {
                                    updated[qIndex].explanationImages.splice(imgIndex, 1);
                                  }
                                  return updated;
                                });
                              }}
                              className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full z-10 opacity-90 hover:opacity-100"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <img 
                              src={imgBase64} 
                              alt={`문제 ${qIndex + 1} 해설 이미지 ${imgIndex + 1}`} 
                              className="h-full w-full object-cover" 
                            />
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          className="h-24 w-24 flex flex-col items-center justify-center gap-1 border-dashed"
                          onClick={(e) => addExplanationImageToQuestion(e, qIndex)}
                        >
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                          <span className="text-xs text-gray-500">이미지 추가</span>
                        </Button>
                      </div>
                    </div>
                    <Textarea 
                      value={q.explanation || ''} 
                      onChange={(e) => {
                        setParsedQuestions(prev => {
                          const updated = [...prev];
                          updated[qIndex].explanation = e.target.value;
                          return updated;
                        });
                      }}
                      placeholder="해설을 입력하세요 (선택사항)"
                      className="min-h-[100px] focus:border-none"
                    />
                  </ImageDropZone>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 