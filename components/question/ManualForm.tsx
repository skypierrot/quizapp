"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Loader2, X, Image as ImageIcon, Plus, Trash2 } from "lucide-react";

// 단일 문제를 위한 인터페이스
interface IManualQuestion {
  content: string;
  options: string[];
  answer: number;
  images: string[];
  explanation?: string;
  explanationImages: string[];
  tags: string[];
}

export function ManualForm() {
  // 단일 문제 상태 관리
  const [question, setQuestion] = useState<IManualQuestion>({
    content: "",
    options: ["", "", "", ""],
    answer: -1, // -1은 선택되지 않음을 의미
    images: [],
    explanation: "",
    explanationImages: [],
    tags: []
  });
  
  // 폼 상태 관리
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const explanationRef = useRef<HTMLTextAreaElement>(null);
  
  // 이미지 업로드 참조
  const questionImageInputRef = useRef<HTMLInputElement>(null);
  const explanationImageInputRef = useRef<HTMLInputElement>(null);

  // toast 훅 사용
  const { toast } = useToast();

  // 클립보드 이미지 붙여넣기 처리
  const handlePaste = (e: React.ClipboardEvent, isExplanation = false) => {
    // 이미 처리된 붙여넣기 이벤트라면 건너뛰기
    if ((e as any)._handledPaste) return;
    
    const items = e.clipboardData.items;
    let imageFound = false;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') === 0) {
        imageFound = true;
        (e as any)._handledPaste = true;
        
        // 이미지인 경우 기본 동작 중지 (텍스트 영역에 내용이 추가되는 것 방지)
        e.preventDefault();
        
        const blob = items[i].getAsFile();
        
        if (blob) {
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
                description: "해설에 이미지가 추가되었습니다."
              });
            } else {
              // 질문 이미지 업데이트
              setQuestion(prev => ({
                ...prev,
                images: [...prev.images, base64Url]
              }));
              toast({
                title: "이미지 추가 완료",
                description: "문제에 이미지가 추가되었습니다."
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

  // 이미지 업로드 처리
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isExplanation = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 파일 유형 확인
    if (!file.type.startsWith('image/')) {
      toast({
        title: "이미지 추가 실패",
        description: "이미지 파일만 업로드할 수 있습니다.",
        variant: "error"
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
          description: "해설에 이미지가 추가되었습니다."
        });
      } else {
        // 질문 이미지 업데이트
        setQuestion(prev => ({
          ...prev,
          images: [...prev.images, base64Url]
        }));
        toast({
          title: "이미지 추가 완료",
          description: "문제에 이미지가 추가되었습니다."
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
    
    reader.readAsDataURL(file);
    
    // 파일 입력 초기화 (동일한 파일 다시 선택할 수 있도록)
    e.target.value = '';
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
      options: [...prev.options, ""]
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
      options: prev.options.map((opt, i) => i === index ? value : opt)
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

  // 태그 관리
  const addTag = (tag: string) => {
    if (!tag.trim()) return;
    
    setQuestion(prev => {
      if (prev.tags.includes(tag.trim())) return prev;
      return {
        ...prev,
        tags: [...prev.tags, tag.trim()]
      };
    });
    
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setQuestion(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // 유효성 검사
      if (!question.content.trim()) {
        toast({
          title: "유효성 검사 실패",
          description: "문제 내용을 입력해주세요.",
          variant: "error"
        });
        return;
      }
      
      // 빈 선택지가 있는지 확인
      if (question.options.some(opt => !opt.trim())) {
        toast({
          title: "유효성 검사 실패",
          description: "모든 선택지를 입력해주세요.",
          variant: "error"
        });
        return;
      }
      
      // 정답을 선택했는지 확인
      if (question.answer < 0) {
        toast({
          title: "유효성 검사 실패",
          description: "정답을 선택해주세요.",
          variant: "error"
        });
        return;
      }
      
      console.log("문제 등록 데이터:", question);
      
      // 실제 API 호출
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(question),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "문제 등록에 실패했습니다.");
      }
      
      const data = await response.json();
      
      // 성공 메시지 표시
      toast({
        title: "문제 등록 성공",
        description: data.message || "문제가 성공적으로 등록되었습니다."
      });
      
      // 폼 초기화
      setQuestion({
        content: "",
        options: ["", "", "", ""],
        answer: -1,
        images: [],
        explanation: "",
        explanationImages: [],
        tags: []
      });
      
    } catch (error) {
      console.error("문제 등록 중 오류 발생:", error);
      toast({
        title: "문제 등록 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 문제 내용 */}
      <div>
        <label className="block mb-2 font-medium">문제 내용</label>
        <div className="flex gap-2 mb-2">
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            className="text-xs"
            onClick={() => questionImageInputRef.current?.click()}
          >
            <ImageIcon className="h-4 w-4 mr-1" /> 문제 이미지 업로드
          </Button>
          <input 
            ref={questionImageInputRef}
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={(e) => handleImageUpload(e, false)}
          />
          <p className="text-xs text-gray-500 flex items-center">
            또는 Ctrl+V로 클립보드 이미지 붙여넣기
          </p>
        </div>
        
        {/* 문제 이미지 갤러리 */}
        {question.images.length > 0 && (
          <div className="mb-4 grid grid-cols-2 md:grid-cols-3 gap-2">
            {question.images.map((img, idx) => (
              <div key={`img-${idx}`} className="relative border rounded overflow-hidden">
                <Button 
                  type="button" 
                  size="sm" 
                  variant="destructive"
                  onClick={() => removeImage(idx, false)}
                  className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
                <img 
                  src={img} 
                  alt={`문제 이미지 ${idx+1}`} 
                  className="max-h-40 object-contain w-full" 
                />
              </div>
            ))}
          </div>
        )}
        
        <div className="relative border border-dashed border-blue-300 rounded-md transition-all hover:border-blue-500">
          <Textarea
            ref={contentRef}
            value={question.content}
            onChange={(e) => setQuestion({...question, content: e.target.value})}
            onPaste={(e) => handlePaste(e, false)}
            className="min-h-[100px]"
            placeholder="문제 내용을 입력하세요."
          />
          <div className="absolute bottom-2 right-2 pointer-events-none flex items-center">
            <div className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm flex items-center gap-1 border border-blue-200">
              <ImageIcon className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-gray-600">
                Ctrl+V로 이미지 붙여넣기 가능 ({question.images.length}개)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 선택지 */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">선택지</h3>
          <div className="text-sm text-gray-500">
            {question.answer >= 0 ? `정답: ${question.answer + 1}번` : "정답을 선택해주세요"}
          </div>
        </div>
        
        {/* 정답 선택 버튼 */}
        <div className="flex flex-wrap gap-2 mb-3">
          {question.options.map((_, index) => (
            <Button 
              key={index}
              type="button"
              size="sm"
              variant={question.answer === index ? "default" : "outline"}
              onClick={() => setQuestionAnswer(index)}
              className={`w-10 h-10 p-0 flex items-center justify-center transition-all duration-200 ${
                question.answer === index 
                  ? "bg-black text-white hover:bg-gray-800 ring-2 ring-gray-300 font-bold transform scale-110 shadow-md border-2 border-gray-400" 
                  : "border-2 border-gray-300 hover:bg-gray-100 text-gray-700"
              }`}
            >
              <span className="text-lg font-semibold">{index + 1}</span>
            </Button>
          ))}
        </div>
        
        {question.options.map((option, index) => (
          <div key={`option-${index}`} className="flex gap-2 items-center">
            <div className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-bold transition-all duration-200 ${
              question.answer === index 
                ? 'bg-black text-white border-2 border-gray-300 shadow-md transform scale-110' 
                : 'bg-gray-100 text-gray-700 border border-gray-300'
            }`}>
              {index + 1}
            </div>
            <Input
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
              placeholder={`선택지 ${index + 1}의 내용`}
              className="flex-1 text-sm"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => removeOption(index, e)}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addOption}
            className="text-xs"
          >
            <Plus className="h-4 w-4 mr-1" /> 선택지 추가
          </Button>
        </div>
      </div>

      {/* 해설 */}
      <div>
        <label className="block mb-2 font-medium">해설 (선택사항)</label>
        <div className="flex gap-2 mb-2">
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            className="text-xs"
            onClick={() => explanationImageInputRef.current?.click()}
          >
            <ImageIcon className="h-4 w-4 mr-1" /> 해설 이미지 업로드
          </Button>
          <input 
            ref={explanationImageInputRef}
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={(e) => handleImageUpload(e, true)}
          />
        </div>
        
        {/* 해설 이미지 갤러리 */}
        {question.explanationImages.length > 0 && (
          <div className="mb-4 grid grid-cols-2 md:grid-cols-3 gap-2">
            {question.explanationImages.map((img, idx) => (
              <div key={`exp-img-${idx}`} className="relative border rounded overflow-hidden">
                <Button 
                  type="button" 
                  size="sm" 
                  variant="destructive"
                  onClick={() => removeImage(idx, true)}
                  className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
                <img 
                  src={img} 
                  alt={`해설 이미지 ${idx+1}`} 
                  className="max-h-40 object-contain w-full" 
                />
              </div>
            ))}
          </div>
        )}
        
        <div className="relative border border-dashed border-blue-300 rounded-md transition-all hover:border-blue-500">
          <Textarea
            ref={explanationRef}
            value={question.explanation || ""}
            onChange={(e) => setQuestion({...question, explanation: e.target.value})}
            onPaste={(e) => handlePaste(e, true)}
            className="min-h-[100px]"
            placeholder="해설 내용을 입력하세요. (선택사항)"
          />
          <div className="absolute bottom-2 right-2 pointer-events-none flex items-center">
            <div className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm flex items-center gap-1 border border-blue-200">
              <ImageIcon className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-gray-600">
                Ctrl+V로 해설 이미지 붙여넣기 가능 ({question.explanationImages.length}개)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 태그 */}
      <div>
        <label className="block mb-2 font-medium">태그 (선택사항)</label>
        <div className="flex gap-2 mb-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="태그 입력 후 Enter"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag(tagInput);
              }
            }}
          />
          <Button 
            type="button" 
            variant="outline"
            onClick={() => addTag(tagInput)}
          >
            추가
          </Button>
        </div>
        
        {/* 태그 목록 */}
        {question.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {question.tags.map((tag, idx) => (
              <div 
                key={`tag-${idx}`} 
                className="bg-gray-100 text-gray-800 rounded-full px-3 py-1 text-sm flex items-center"
              >
                {tag}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTag(tag)}
                  className="h-5 w-5 p-0 ml-1"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 제출 버튼 */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full md:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              제출 중...
            </>
          ) : (
            "문제 저장하기"
          )}
        </Button>
      </div>
    </form>
  );
} 