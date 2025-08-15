'use client';
import React, { useState, useRef, useEffect, ClipboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BasicTagSettings } from "./common/BasicTagSettings";
import { AdditionalTagInput } from "./common/AdditionalTagInput";
import { QuestionContent } from "./common/QuestionContent";
import { Options } from "./common/Options";
import { Explanation } from "./common/Explanation";
import { ImageGroup } from "./common/ImageGroup";
import { useToast } from "@/components/ui/use-toast";
import { parseQuestionsImproved } from "@/utils/questionParser";
import { IManualQuestion, IOption } from "@/types";
import { SubmitSection } from "./common/SubmitSection";
import { useImageZoom } from '@/hooks/useImageZoom';
import { ImageZoomModal } from '@/components/common/ImageZoomModal';
import { getFileHash } from "@/utils/image";
import { useCascadingTags } from '@/hooks/question/useCascadingTags';

const MAX_IMAGE_COUNT = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

// 추가: 붙여넣기된 이미지 정보를 저장할 타입 정의
interface IPastedImageInfo {
  url: string;
  hash: string;
}

export default function PasteForm() {
  const { toast } = useToast();
  const [pasteText, setPasteText] = useState("");
  const [questions, setQuestions] = useState<IManualQuestion[]>([]);
  const [commonTags, setCommonTags] = useState<string[]>([]);
  const [commonTagInput, setCommonTagInput] = useState("");
  const [questionTags, setQuestionTags] = useState<string[][]>([]);
  const [questionTagInputs, setQuestionTagInputs] = useState<{ [idx: number]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentImageIdx, setCurrentImageIdx] = useState<number | null>(null);
  const [activeImageType, setActiveImageType] = useState<'question' | 'explanation' | null>(null);
  const [isImageAreaActive, setIsImageAreaActive] = useState(false);
  const questionImageInputRef = useRef<HTMLInputElement>(null);
  const explanationImageInputRef = useRef<HTMLInputElement>(null);
  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Textarea 참조 추가
  const [pastedImageInfos, setPastedImageInfos] = useState<IPastedImageInfo[]>([]); // 붙여넣기된 이미지 정보 상태 추가
  const [isPasting, setIsPasting] = useState(false); // 붙여넣기 진행 중 상태 추가

  const imageZoom = useImageZoom();

  const {
    examName,
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
    date,
    setDate,
  } = useCascadingTags();

  const handleAddCommonTag = (tag: string) => {
    if (tag.trim() && !commonTags.includes(tag.trim())) {
      setCommonTags([...commonTags, tag.trim()]);
    }
    setCommonTagInput("");
  };
  const handleRemoveCommonTag = (tagToRemove: string) => {
    setCommonTags(commonTags.filter(tag => tag !== tagToRemove));
  };

  const handleQuestionTagInputChange = (idx: number, value: string) => {
    setQuestionTagInputs(prev => ({ ...prev, [idx]: value }));
  };

  const handleAddQuestionTag = (idx: number, tag: string) => {
    if (!tag.trim()) return;
    const trimmedTag = tag.trim();
    setQuestionTags(prev => {
      const updatedTags = [...prev];
      if (!updatedTags[idx]) updatedTags[idx] = [];
      if (!updatedTags[idx].includes(trimmedTag)) {
        updatedTags[idx] = [...updatedTags[idx], trimmedTag];
      }
      return updatedTags;
    });
    setQuestionTagInputs(prev => ({ ...prev, [idx]: "" }));
  };
  const handleRemoveQuestionTag = (idx: number, tagToRemove: string) => {
    setQuestionTags(prev => {
      const updatedTags = [...prev];
      if (updatedTags[idx]) {
        updatedTags[idx] = updatedTags[idx].filter(tag => tag !== tagToRemove);
      }
      return updatedTags;
    });
  };

  const handleQuestionChange = (idx: number, field: keyof IManualQuestion, value: any) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const handleAddOption = (qIdx: number) => {
    setQuestions(prev => prev.map((q, i) =>
      i === qIdx
        ? { ...q, options: [...q.options, { number: q.options.length + 1, text: "", images: [] }] }
        : q
    ));
  };
  const handleRemoveOption = (qIdx: number, optIdx: number) => {
     setQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const newOptions = q.options.filter((_, i2) => i2 !== optIdx);
      let newAnswer = q.answer;
      if (q.answer === optIdx) {
        newAnswer = -1;
      } else if (q.answer > optIdx) {
        newAnswer = q.answer - 1;
      }
      const renumberedOptions = newOptions.map((opt, index) => ({ ...opt, number: index + 1 }));
      return { ...q, options: renumberedOptions, answer: newAnswer };
    }));
  };
  const handleUpdateOption = (qIdx: number, optIdx: number, value: string) => {
    setQuestions(prev => prev.map((q, i) =>
      i === qIdx
        ? { ...q, options: q.options.map((opt, i2) => i2 === optIdx ? { ...opt, text: value } : opt) }
        : q
    ));
  };
   const handleSetAnswer = (qIdx: number, ansIdx: number) => {
     handleQuestionChange(qIdx, 'answer', ansIdx);
   };

  const uploadImage = async (file: File): Promise<{ url: string; hash: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/api/images/upload', { method: 'POST', body: formData });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: '이미지 업로드 실패 (응답 파싱 불가)'}));
      throw new Error(errorData.error || '이미지 업로드 실패');
    }
    const result = await response.json();
    if (!result.success || !result.url || !result.hash) {
        throw new Error(result.error || 'API 응답 데이터 오류 (url 또는 hash 없음)');
    }
    return { url: result.url, hash: result.hash };
  };

  const handleImageFileSelected = async (file: File | null, isExplanation = false) => {
      if (!file || currentImageIdx === null) return;
      if (!file.type.startsWith('image/')) {
         toast({ title: "이미지 파일만 업로드 가능합니다.", variant: "error" });
         return;
      }
      if (file.size > MAX_IMAGE_SIZE) {
         toast({ title: "5MB 이하 이미지만 업로드 가능합니다.", variant: "error" });
         return;
      }

      try {
         // 1. uploadImage 호출하여 url과 backend hash 얻기
         const { url, hash } = await uploadImage(file);
         const qIdx = currentImageIdx; // currentImageIdx 사용 확인

         // 2. 중복 체크 (백엔드 hash 사용)
         const targetQuestion = questions[qIdx];
         if (!targetQuestion) {
             toast({ title: "오류", description: "대상 문제를 찾을 수 없습니다.", variant: "error" });
             return;
         }
         const existingImages = isExplanation ? (targetQuestion.explanationImages || []) : (targetQuestion.images || []);
         const isDuplicate = existingImages.some(img => img.hash === hash); // 백엔드 hash로 비교

         if (isDuplicate) {
             toast({ title: "이미지 중복", description: "이미 동일한 내용의 이미지가 추가되어 있습니다.", variant: "warning" });
             return; // 중복이면 여기서 중단
         }

         // 3. 상태 업데이트 (백엔드 url, hash 사용)
         setQuestions(prev => prev.map((q, i) => {
            if (i !== qIdx) return q;
            const targetImages = isExplanation ? q.explanationImages : q.images;
            if ((targetImages || []).length >= MAX_IMAGE_COUNT) {
               toast({ title: "이미지 제한", description: `최대 ${MAX_IMAGE_COUNT}장까지 업로드 가능합니다.`, variant: "error" });
               return q;
            }
            // 백엔드에서 받은 url과 hash 사용
            return isExplanation
               ? { ...q, explanationImages: [...(targetImages || []), { url, hash }] }
               : { ...q, images: [...(targetImages || []), { url, hash }] };
         }));
      } catch (error) {
         console.error("이미지 처리/업로드 오류:", error);
         toast({ title: "오류", description: error instanceof Error ? error.message : "이미지 처리 중 오류", variant: "error" });
      }
   };

  const handleRemoveImageWrapper = (qIdx: number, imgIdx: number, isExplanation?: boolean) => {
    setQuestions(prev => prev.map((q, i) =>
      i === qIdx
        ? isExplanation
          ? { ...q, explanationImages: (q.explanationImages || []).filter((_, j) => j !== imgIdx) }
          : { ...q, images: (q.images || []).filter((_, j) => j !== imgIdx) }
        : q
    ));
  };

  const handleOptionImageUpload = async (qIdx: number, optIdx: number, file: File) => {
    if (!file) return;
     if (!file.type.startsWith('image/')) {
       toast({ title: "이미지 파일만 업로드 가능합니다.", variant: "error" });
       return;
     }
     if (file.size > MAX_IMAGE_SIZE) {
       toast({ title: "5MB 이하 이미지만 업로드 가능합니다.", variant: "error" });
       return;
     }

     try {
      // 1. uploadImage 호출하여 url과 backend hash 얻기
      const { url, hash } = await uploadImage(file);

      // 2. 중복 체크 (백엔드 hash 사용)
       const targetOption = questions[qIdx]?.options[optIdx];
       if (!targetOption) {
           toast({ title: "오류", description: "대상 선택지를 찾을 수 없습니다.", variant: "error" });
           return;
       }
       const existingImages = targetOption.images || [];
      const isDuplicate = existingImages.some(img => img.hash === hash); // 백엔드 hash로 비교

       if (isDuplicate) {
           toast({ title: "이미지 중복", description: "선택지에 이미 동일한 내용의 이미지가 추가되어 있습니다.", variant: "warning" });
          return; // 중복이면 여기서 중단
       }

      // 3. 상태 업데이트 (백엔드 url, hash 사용)
       setQuestions(prev => prev.map((q, i) => {
          if (i !== qIdx) return q;
          return {
            ...q,
          options: q.options.map((opt, i2) => {
            if (i2 !== optIdx) return opt;
              const targetImages = opt.images || [];
              if (targetImages.length >= MAX_IMAGE_COUNT) {
              toast({ title: "이미지 제한", description: `최대 ${MAX_IMAGE_COUNT}장까지 업로드 가능합니다.`, variant: "error" });
                 return opt;
              }
            // 백엔드에서 받은 url과 hash 사용
              return { ...opt, images: [...targetImages, { url, hash }] };
            })
          };
       }));
     } catch (error) {
      console.error("옵션 이미지 처리/업로드 오류:", error);
      toast({ title: "오류", description: error instanceof Error ? error.message : "옵션 이미지 처리 중 오류", variant: "error" });
     }
   };

   const handleOptionImageRemove = (qIdx: number, optIdx: number, imgIdx: number) => {
     setQuestions(prev => prev.map((q, i) =>
       i === qIdx
         ? {
             ...q,
             options: q.options.map((opt, j) =>
               j === optIdx
                 ? { ...opt, images: (opt.images || []).filter((_, k) => k !== imgIdx) }
                 : opt
             ),
           }
         : q
     ));
   };

   const handleImageAreaClick = (qIdx: number, type: 'question' | 'explanation') => {
     console.log(`Setting active image area: index=${qIdx}, type=${type}`);
     setActiveImageType(type);
     setIsImageAreaActive(true);
     setCurrentImageIdx(qIdx);
   };

  const handleParse = () => {
    const { questions: parsed, errors } = parseQuestionsImproved(pasteText);
    if (parsed.length === 0) {
      toast({ title: "문제 파싱 실패", description: errors.join("\n"), variant: "error" });
      return;
    }

    // 이미지 URL 추출 정규식
    const imageUrlRegex = /\!\[[^\]]*\]\((\/images\/uploaded\/[^\)]+)\)/g;

    // pastedImageInfos를 URL 기준으로 쉽게 찾기 위한 Map 생성
    const pastedImageMap = new Map(pastedImageInfos.map(info => [info.url, info]));

    const processedQuestions = parsed.map(q => {
      const finalImages: { url: string; hash: string }[] = [];
      const finalExplanationImages: { url: string; hash: string }[] = [];

      // 1. content에서 이미지 정보 추출 및 연결
      let match;
      while ((match = imageUrlRegex.exec(q.content || '')) !== null) {
        const url = match[1];
        if (url) {
          const imageInfo = pastedImageMap.get(url);
          if (imageInfo) {
            finalImages.push(imageInfo);
          }
        }
      }

      // 2. explanation에서 이미지 정보 추출 및 연결
      imageUrlRegex.lastIndex = 0; // Reset regex index
      while ((match = imageUrlRegex.exec(q.explanation || '')) !== null) {
        const url = match[1];
        if (url) {
          const imageInfo = pastedImageMap.get(url);
          if (imageInfo) {
            finalExplanationImages.push(imageInfo);
          }
        }
      }

      // 3. options에서 이미지 정보 추출 및 연결
      const finalOptions = (q.options || []).map((opt: { number: number; text: string }): IOption => {
        const optionImages: { url: string; hash: string }[] = [];
        imageUrlRegex.lastIndex = 0; // Reset regex index
        while ((match = imageUrlRegex.exec(opt.text || '')) !== null) {
          const url = match[1];
          if (url) {
            const imageInfo = pastedImageMap.get(url);
            if (imageInfo) {
              optionImages.push(imageInfo);
            }
          }
        }
        return {
          number: opt.number,
          text: opt.text,
          images: optionImages, // 연결된 이미지 정보 사용
        };
      });

      // 최종 질문 객체 구성
      return {
        id: q.id ? String(q.id) : `parsed-${Date.now()}-${Math.random()}`,
        content: q.content || '',
        options: finalOptions,
        answer: typeof q.answer === 'number' ? q.answer - 1 : -1,
        explanation: q.explanation ?? "",
        images: finalImages, // 연결된 이미지 정보 사용
        explanationImages: finalExplanationImages, // 연결된 이미지 정보 사용
        tags: [], 
        // examId는 BasicTagSettings에서 관리되므로 여기서는 설정 안 함
      };
    });

    setQuestions(processedQuestions);
    setQuestionTags(processedQuestions.map(() => []));
    setQuestionTagInputs({});
    setPasteText(""); // 파싱 후 텍스트 영역 비우기
    setPastedImageInfos([]); // 사용된 붙여넣기 이미지 정보 초기화
    toast({ title: `${processedQuestions.length}개 문제 파싱 완료`, variant: "success" });
  };

  function validateQuestions(questionsToValidate: IManualQuestion[]): { valid: boolean; message?: string; focusIdx?: number } {
    if (!examName.trim()) return { valid: false, message: '기본 태그: 시험명을 입력하세요.' };
    if (!subject.trim()) return { valid: false, message: '기본 태그: 과목을 입력하세요.' };
    if (!isDateValid) return { valid: false, message: '기본 태그: 날짜를 올바른 형식(YYYY-MM-DD)으로 입력하세요.' };

    for (let i = 0; i < questionsToValidate.length; i++) {
      const q = questionsToValidate[i];
      if (!q) continue;
      
      if (!q.content.trim()) {
        return { valid: false, message: `문제 ${i + 1}: 본문을 입력하세요.`, focusIdx: i };
      }
      if (!q.options || q.options.length < 2) {
        return { valid: false, message: `문제 ${i + 1}: 선택지는 최소 2개 이상이어야 합니다.`, focusIdx: i };
      }
      for (let j = 0; j < q.options.length; j++) {
        const opt = q.options[j];
        if (!opt) continue;
        
        if (!opt.text.trim() && (!opt.images || opt.images.length === 0)) {
          return { valid: false, message: `문제 ${i + 1}, 선택지 ${j + 1}: 내용 또는 이미지를 입력하세요.`, focusIdx: i };
        }
      }
      if (typeof q.answer !== 'number' || q.answer < 0 || q.answer >= q.options.length) {
        return { valid: false, message: `문제 ${i + 1}: 정답을 선택하세요.`, focusIdx: i };
      }
    }
    return { valid: true };
  }

  const handleSave = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const validation = validateQuestions(questions);
    if (!validation.valid) {
      toast({ title: "입력값 오류", description: validation.message, variant: "error" });
      if (typeof validation.focusIdx === "number" && questionRefs.current[validation.focusIdx]) {
        questionRefs.current[validation.focusIdx]?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    setIsSubmitting(true);
    try {
       const trimmedExamName = examName.trim();
       const trimmedDate = date.trim();
       const trimmedSubject = subject.trim();

       if (!trimmedExamName || !trimmedDate || !trimmedSubject || !isDateValid) { 
         toast({ title: "필수 태그 오류", description: "시험명, 날짜(YYYY-MM-DD 형식), 과목은 필수 입력 항목입니다.", variant: "error" });
         setIsSubmitting(false);
         return;
       }
       
       const questionsPayload = questions.map((q, idx) => {
         const questionImages = q.images || []; 
         const explanationImagesData = q.explanationImages || [];
         const optionsData = q.options.map(opt => ({
           number: opt.number,
           text: opt.text,
           images: opt.images || [],
         }));

         const pureAdditionalTags = (
           commonTags.concat(questionTags[idx] || [])
         ).filter(tag => 
           !tag.startsWith('시험명:') && 
           !tag.startsWith('날짜:') && 
           !tag.startsWith('과목:')
         );

         return {
           content: q.content,
           options: optionsData,
           answer: q.answer,
           explanation: q.explanation || "",
           images: questionImages,
           explanationImages: explanationImagesData,
           examName: trimmedExamName,
           examDate: trimmedDate,
           examSubject: trimmedSubject,
           tags: pureAdditionalTags,
         };
       });

       const formData = new FormData();
       formData.append('questions', JSON.stringify(questionsPayload));

       console.log('Sending FormData with questions field:', JSON.stringify(questionsPayload, null, 2));

       const response = await fetch("/api/questions/batch", {
         method: "POST",
         body: formData,
       });

      if (!response.ok) {
         const errorData = await response.json().catch(() => ({ error: '문제 저장 중 알 수 없는 오류' }));
         throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('저장 결과:', result);

      let successCount = 0;
      let errorCount = 0;

      if (result && Array.isArray(result.result)) {
        for (const res of result.result) {
          if (res?.success) {
            successCount++;
          } else {
            errorCount++;
          }
        }
      } else {
        console.error("Unexpected API response format for batch save:", result);
        if (result?.ok) {
            successCount = questions.length;
        } else {
            errorCount = questions.length;
        }
      }

      if (successCount > 0 && errorCount === 0) {
        toast({ title: "저장 완료", description: `${successCount}개의 문제가 성공적으로 저장되었습니다.`, variant: "success" });
        window.location.reload();
        return;
      } else if (successCount > 0 && errorCount > 0) {
        toast({ title: "부분 성공", description: `${successCount}개 성공, ${errorCount}개 실패했습니다.`, variant: "warning" });
      } else if (successCount === 0 && errorCount > 0) {
        toast({ title: "저장 실패", description: "모든 문제 저장에 실패했습니다.", variant: "error" });
      }

    } catch (e: any) {
      console.error("저장 실패:", e);
      toast({ title: "저장 실패", description: e.message, variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const normalizeImages = (imgs: any) => {
    if (!imgs) return [];
    if (Array.isArray(imgs) && imgs.length > 0 && typeof imgs[0] === 'string') {
        return imgs.map((url: string) => ({ url, hash: '' })); // string[] -> {url, hash}[]
    } else if (Array.isArray(imgs)) {
        // 이미 {url, hash} 형태이면 그대로 반환 (null/undefined 필터링 추가 가능)
        return imgs.filter(img => img && img.url);
    }
    return []; // 그 외의 경우 빈 배열
  };

  // 새로운 onPaste 핸들러 함수
  const handlePaste = async (event: ClipboardEvent<HTMLTextAreaElement>) => {
    event.preventDefault(); // 기본 붙여넣기 동작 방지
    setIsPasting(true);
    const clipboardData = event.clipboardData;
    if (!clipboardData) {
      setIsPasting(false);
      return;
    }

    let pastedTextContent = pasteText; // 현재 텍스트 내용 가져오기
    const items = Array.from(clipboardData.items);
    const imageUploadPromises: Promise<IPastedImageInfo | null>[] = [];

    // 1. 텍스트 데이터 처리 (우선 찾아서 적용)
    const textItem = items.find(item => item.kind === 'string' && item.type.match(/^text\/plain/i));
    if (textItem) {
      pastedTextContent = await new Promise<string>((resolve) => {
        textItem.getAsString(text => resolve(text || ''));
      });
      // 텍스트가 붙여넣기되면 기존 질문 목록은 초기화할지 여부 결정 필요
      // 여기서는 Textarea 내용만 업데이트하고 파싱은 별도 버튼으로 진행
      setPasteText(pastedTextContent);
    }

    // 2. 이미지 데이터 처리
    for (const item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          if (file.size > MAX_IMAGE_SIZE) {
            toast({ title: "용량 초과", description: `5MB 이하 이미지만 붙여넣기 가능합니다. (${(file.size / 1024 / 1024).toFixed(1)}MB)`, variant: "warning" });
            continue; // 다음 항목 처리
          }
          // 이미지 업로드 프로미스 생성
          imageUploadPromises.push(
            uploadImage(file)
              .then(imageInfo => {
                // 성공 시 정보 저장
                setPastedImageInfos(prev => [...prev, imageInfo]); 
                return imageInfo;
              })
              .catch(error => {
                console.error("붙여넣기 이미지 업로드 오류:", error);
                toast({ title: "업로드 실패", description: error instanceof Error ? error.message : "이미지 업로드 중 오류", variant: "error" });
                return null; // 실패 시 null 반환
              })
          );
        }
      }
    }

    // 3. 모든 이미지 업로드 완료 기다리기
    const uploadedImages = (await Promise.all(imageUploadPromises)).filter((info): info is IPastedImageInfo => info !== null);

    // 4. Textarea에 이미지 마크다운 삽입 (커서 위치에)
    if (uploadedImages.length > 0 && textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentText = textarea.value;
      let textToInsert = '';
      uploadedImages.forEach(imgInfo => {
        textToInsert += `\n![pasted_image](${imgInfo.url})\n`; // 마크다운 형식으로 삽입
      });

      const newText = currentText.substring(0, start) + textToInsert + currentText.substring(end);
      setPasteText(newText);

      // 커서 위치를 삽입된 텍스트 뒤로 이동 (선택사항)
      // requestAnimationFrame 사용으로 상태 업데이트 후 커서 위치 조절
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + textToInsert.length;
      });
    }

    setIsPasting(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">문제 붙여넣기</h2>
      <Textarea
        ref={textareaRef} // ref 연결
        placeholder="여기에 문제 텍스트나 이미지를 붙여넣으세요..."
        value={pasteText}
        onChange={(e) => setPasteText(e.target.value)}
        onPaste={handlePaste} // onPaste 핸들러 연결
        rows={10}
        className="mb-4"
        disabled={isPasting} // 붙여넣기 중 비활성화
      />
      <Button onClick={handleParse} disabled={!pasteText || isPasting}>
        {isPasting ? "붙여넣기 처리 중..." : "문제 파싱"}
      </Button>

      {questions.length > 0 && (
        <form onSubmit={handleSave} className="space-y-8 mt-6">
        <BasicTagSettings
          examName={examName}
          examNameOptions={examNameOptions}
          onExamNameChange={handleExamNameChange}
          onExamNameCreate={handleExamNameCreate}
          isLoadingExamNames={isLoadingExamNames}

          date={date}
          onDateChange={handleDateChange}
          isDateDisabled={isDateDisabled}
          isDateValid={isDateValid}

          subject={subject}
          subjectOptions={subjectOptions}
          onSubjectChange={handleSubjectChange}
          onSubjectCreate={handleSubjectCreate}
          isLoadingSubjects={isLoadingSubjects}
          isSubjectDisabled={isSubjectDisabled}
        />
          {!isDateValid && date && (
            <p className="text-xs text-red-500 -mt-4 mb-4 ml-1">날짜는 YYYY-MM-DD 형식으로 입력해주세요.</p>
          )}
        <AdditionalTagInput
             tags={commonTags}
          tagInput={commonTagInput}
          onTagInputChange={setCommonTagInput}
          onAddTag={handleAddCommonTag}
          onRemoveTag={handleRemoveCommonTag}
        />
          
          {questions.map((q, index) => (
            <div key={q.id || index} ref={(el) => { questionRefs.current[index] = el; }} className="p-4 border rounded-md shadow-sm bg-white">
              <h3 className="text-lg font-medium mb-3">문제 {q.number || index + 1}</h3>
              <QuestionContent
                value={q.content}
                 onChange={e => handleQuestionChange(index, 'content', e.target.value)}
              />
              <ImageGroup
                  questionImages={normalizeImages(q.images)}
                explanationImages={[]}
                  onRemoveImage={(imgIdx) => handleRemoveImageWrapper(index, imgIdx)}
                onZoomImage={imageZoom.showZoom}
                  onImageAreaClick={() => handleImageAreaClick(index, 'question')}
                  onImageAreaMouseEnter={() => setIsImageAreaActive(true)}
                onImageAreaMouseLeave={() => setIsImageAreaActive(false)}
                questionImageInputRef={questionImageInputRef}
                explanationImageInputRef={explanationImageInputRef}
                  activeImageType={activeImageType}
                  isImageAreaActive={isImageAreaActive && currentImageIdx === index}
                  handleImageUpload={(file) => handleImageFileSelected(file, false)}
                type="question"
              />
              <Options
                  options={q.options.map(opt => ({ ...opt, images: normalizeImages(opt.images) }))}
                answer={q.answer}
                  onAddOption={() => handleAddOption(index)}
                  onRemoveOption={(optIdx) => handleRemoveOption(index, optIdx)}
                  onUpdateOption={(optIdx, value) => handleUpdateOption(index, optIdx, value)}
                  onSetAnswer={(ansIdx) => handleSetAnswer(index, ansIdx)}
                  onOptionImageUpload={(file, optIdx) => handleOptionImageUpload(index, optIdx, file)}
                  onOptionImageRemove={(optIdx, imgIdx) => handleOptionImageRemove(index, optIdx, imgIdx)}
                onOptionImageZoom={imageZoom.showZoom}
              />
              <Explanation
                 value={q.explanation || ''}
                 onChange={e => handleQuestionChange(index, 'explanation', e.target.value)}
              />
              <ImageGroup
                questionImages={[]}
                  explanationImages={normalizeImages(q.explanationImages)}
                  onRemoveImage={(imgIdx) => handleRemoveImageWrapper(index, imgIdx, true)}
                onZoomImage={imageZoom.showZoom}
                  onImageAreaClick={() => handleImageAreaClick(index, 'explanation')}
                  onImageAreaMouseEnter={() => setIsImageAreaActive(true)}
                onImageAreaMouseLeave={() => setIsImageAreaActive(false)}
                questionImageInputRef={questionImageInputRef}
                explanationImageInputRef={explanationImageInputRef}
                  activeImageType={activeImageType}
                  isImageAreaActive={isImageAreaActive && currentImageIdx === index}
                  handleImageUpload={(file) => handleImageFileSelected(file, true)}
                type="explanation"
              />
              <AdditionalTagInput
                 tags={questionTags[index] || []}
                 tagInput={questionTagInputs[index] || ""}
                 onTagInputChange={value => handleQuestionTagInputChange(index, value)}
                 onAddTag={tag => handleAddQuestionTag(index, tag)}
                 onRemoveTag={tag => handleRemoveQuestionTag(index, tag)}
              />
            </div>
          ))}
          <SubmitSection isSubmitting={isSubmitting} buttonText="모든 문제 저장" />
        </form>
      )}
      <ImageZoomModal imageUrl={imageZoom.zoomedImage} onClose={imageZoom.closeZoom} />
    </div>
  );
}