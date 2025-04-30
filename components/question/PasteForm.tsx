'use client';
import React, { useState, useRef, useEffect } from "react";
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

const MAX_IMAGE_COUNT = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export default function PasteForm() {
  const { toast } = useToast();
  const [pasteText, setPasteText] = useState("");
  const [questions, setQuestions] = useState<IManualQuestion[]>([]);
  const [examName, setExamName] = useState("");
  const [year, setYear] = useState("");
  const [isYearValid, setIsYearValid] = useState(true);
  const [session, setSession] = useState("");
  const [subject, setSubject] = useState("");
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

  const imageZoom = useImageZoom();

  const handleYearChange = (value: string) => {
    setYear(value);
    setIsYearValid(/^\d{4}$/.test(value) || value === "");
  };

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
    const response = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!response.ok) throw new Error('이미지 업로드 실패');
    const result = await response.json();
    if (!result.success || !result.url) {
        throw new Error(result.error || '이미지 URL 받기 실패');
    }
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return { url: result.url, hash: hashHex };
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
         const hash = await getFileHash(file);
         const qIdx = currentImageIdx;
         const targetQuestion = questions[qIdx];
         if (!targetQuestion) {
             toast({ title: "오류", description: "대상 문제를 찾을 수 없습니다.", variant: "error" });
             return;
         }
         const existingImages = isExplanation ? (targetQuestion.explanationImages || []) : (targetQuestion.images || []);
         const isDuplicate = existingImages.some(img => img.hash === hash);

         if (isDuplicate) {
             toast({ title: "이미지 중복", description: "이미 동일한 내용의 이미지가 추가되어 있습니다.", variant: "warning" });
             return;
         }

         const { url } = await uploadImage(file);
         setQuestions(prev => prev.map((q, i) => {
            if (i !== qIdx) return q;
            const targetImages = isExplanation ? q.explanationImages : q.images;
            if ((targetImages || []).length >= MAX_IMAGE_COUNT) {
               toast({ title: "이미지 제한", description: `최대 ${MAX_IMAGE_COUNT}장까지 업로드 가능합니다.`, variant: "error" });
               return q;
            }
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
     if (!file || qIdx === null || optIdx === null) return;
     if (!file.type.startsWith('image/')) {
       toast({ title: "이미지 파일만 업로드 가능합니다.", variant: "error" });
       return;
     }
     if (file.size > MAX_IMAGE_SIZE) {
       toast({ title: "5MB 이하 이미지만 업로드 가능합니다.", variant: "error" });
       return;
     }

     try {
       const hash = await getFileHash(file);
       const targetOption = questions[qIdx]?.options[optIdx];
       if (!targetOption) {
           toast({ title: "오류", description: "대상 선택지를 찾을 수 없습니다.", variant: "error" });
           return;
       }
       const existingImages = targetOption.images || [];
       const isDuplicate = existingImages.some(img => img.hash === hash);

       if (isDuplicate) {
           toast({ title: "이미지 중복", description: "선택지에 이미 동일한 내용의 이미지가 추가되어 있습니다.", variant: "warning" });
           return;
       }

       const { url } = await uploadImage(file);

       setQuestions(prev => prev.map((q, i) => {
          if (i !== qIdx) return q;
          return {
            ...q,
            options: q.options.map((opt, j) => {
              if (j !== optIdx) return opt;
              const targetImages = opt.images || [];
              if (targetImages.length >= MAX_IMAGE_COUNT) {
                 toast({ title: `선택지 ${optIdx+1} 이미지 제한`, description: `최대 ${MAX_IMAGE_COUNT}장까지 업로드 가능합니다.`, variant: "error" });
                 return opt;
              }
              return { ...opt, images: [...targetImages, { url, hash }] };
            })
          };
       }));
     } catch (error) {
       console.error("선택지 이미지 처리/업로드 오류:", error);
       toast({ title: "오류", description: error instanceof Error ? error.message : "선택지 이미지 처리 중 오류", variant: "error" });
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
    setQuestions(parsed.map(q => ({
      id: q.id || `parsed-${Date.now()}-${Math.random()}`,
      content: q.content,
      options: (q.options || []).map((opt: { number: number; text: string }): IOption => ({
        number: opt.number,
        text: opt.text,
        images: [],
      })),
      answer: typeof q.answer === 'number' ? q.answer - 1 : -1,
      explanation: q.explanation ?? "",
      images: [], 
      explanationImages: [], 
      tags: [], 
    })));
    setQuestionTags(parsed.map(() => []));
    setQuestionTagInputs({});
    setPasteText("");
    toast({ title: `${parsed.length}개 문제 파싱 완료`, variant: "success" });
  };

  function validateQuestions(questionsToValidate: IManualQuestion[]): { valid: boolean; message?: string; focusIdx?: number } {
    if (!examName.trim()) return { valid: false, message: '기본 태그: 시험명을 입력하세요.' };
    if (!year.trim()) return { valid: false, message: '기본 태그: 년도를 입력하세요.' };
    if (!isYearValid) return { valid: false, message: '기본 태그: 년도를 올바른 형식(4자리 숫자)으로 입력하세요.' };
    if (!session.trim()) return { valid: false, message: '기본 태그: 회차를 입력하세요.' };

    for (let i = 0; i < questionsToValidate.length; i++) {
      const q = questionsToValidate[i];
      if (!q.content.trim()) {
        return { valid: false, message: `문제 ${i + 1}: 본문을 입력하세요.`, focusIdx: i };
      }
      if (!q.options || q.options.length < 2) {
        return { valid: false, message: `문제 ${i + 1}: 선택지는 최소 2개 이상이어야 합니다.`, focusIdx: i };
      }
      for (let j = 0; j < q.options.length; j++) {
        const opt = q.options[j];
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
       // 이미지 URL 추출 함수 (현재 ManualForm 기준: string[] 반환, 외부 URL 필터링 없음)
       const mapImageUrls = (images?: { url: string; hash: string }[]): string[] => {
         if (!images) return [];
         return images.map(img => img.url).filter(Boolean); // url 문자열 배열 추출
       };

       // FormData 생성
       const formData = new FormData();

       // 문제별 데이터를 FormData에 추가 (batch API는 JSON 배열을 받을 것으로 예상)
       const questionsPayload = questions.map((q, idx) => ({
         content: q.content,
         options: q.options.map(opt => ({
           number: opt.number,
           text: opt.text,
           images: mapImageUrls(opt.images) // string[] 추출
         })),
         answer: q.answer,
         explanation: q.explanation || "",
         images: mapImageUrls(q.images), // string[] 추출
         explanationImages: mapImageUrls(q.explanationImages), // string[] 추출
         tags: [
           `시험명:${examName.trim()}`,
           `년도:${year.trim()}`,
           `회차:${session.trim()}`,
           ...(subject.trim() ? [`과목:${subject.trim()}`] : []),
           ...commonTags,
           ...(questionTags[idx] || [])
         ],
       }));

       // 일반적으로 batch API는 JSON 배열 형태의 데이터를 받을 것으로 예상되므로,
       // 전체 문제 배열을 JSON 문자열로 변환하여 FormData에 추가합니다.
       // (만약 서버 API가 다른 형식을 요구한다면 이 부분을 수정해야 합니다.)
       formData.append('questions', JSON.stringify(questionsPayload));

       console.log('최종 저장 FormData Payload (questions):', questionsPayload);

       // API 호출 (POST /api/questions/batch)
       const response = await fetch("/api/questions/batch", {
         method: "POST",
         body: formData
         // Content-Type은 FormData 사용 시 브라우저가 자동 설정
       });

      if (!response.ok) {
         const errorData = await response.json().catch(() => ({ error: '문제 저장 중 알 수 없는 오류' }));
         throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('저장 결과:', result);

      toast({ title: `${result.length}개 문제 저장 완료`, variant: "success" });
      setQuestions([]);
      setQuestionTags([]);
      setQuestionTagInputs({});
      setExamName("");
      setYear("");
      setSession("");
      setSubject("");
      setCommonTags([]);
      setCommonTagInput("");

    } catch (e: any) {
      console.error("저장 실패:", e);
      toast({ title: "저장 실패", description: e.message, variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
         <h3 className="text-lg font-medium">공통 태그 설정 (모든 문제에 적용)</h3>
        <BasicTagSettings
          examName={examName}
          year={year}
          isYearValid={isYearValid}
          session={session}
          subject={subject}
          onExamNameChange={setExamName}
          onYearChange={handleYearChange}
          onSessionChange={setSession}
          onSubjectChange={setSubject}
        />
        <AdditionalTagInput
          tagInput={commonTagInput}
          tags={commonTags}
          onTagInputChange={setCommonTagInput}
          onAddTag={handleAddCommonTag}
          onRemoveTag={handleRemoveCommonTag}
        />
      </div>

      <div className="space-y-2">
         <h3 className="text-lg font-medium">문제 텍스트 붙여넣기</h3>
        <Textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder="여기에 문제 텍스트를 붙여넣으세요 (문제 번호, 내용, 선택지, 정답, 해설 포함)..."
          rows={10}
          className="text-sm leading-relaxed"
        />
        <Button type="button" onClick={handleParse} disabled={!pasteText.trim()}>
          문제 파싱하기
        </Button>
      </div>

      <input
          type="file"
          ref={questionImageInputRef}
          onChange={(e) => handleImageFileSelected(e.target.files?.[0] ?? null, false)}
          accept="image/*"
          style={{ display: 'none' }}
          multiple={false}
      />
      <input
          type="file"
          ref={explanationImageInputRef}
          onChange={(e) => handleImageFileSelected(e.target.files?.[0] ?? null, true)}
          accept="image/*"
          style={{ display: 'none' }}
          multiple={false}
      />

      {questions.length > 0 && (
        <div className="space-y-6">
           <h3 className="text-lg font-medium">파싱된 문제 목록 ({questions.length}개)</h3>
          {questions.map((q, idx) => (
            <div key={q.id || idx} ref={el => { questionRefs.current[idx] = el; }} className="border rounded-lg p-4 space-y-4 shadow-sm">
               <h4 className="font-semibold text-md text-gray-800">문제 {idx + 1}</h4>
              <QuestionContent
                value={q.content}
                onChange={(e) => handleQuestionChange(idx, 'content', e.target.value)}
              />
              <ImageGroup
                questionImages={q.images}
                explanationImages={[]}
                onRemoveImage={(imgIdx) => handleRemoveImageWrapper(idx, imgIdx, false)}
                onZoomImage={imageZoom.showZoom}
                onImageAreaClick={() => handleImageAreaClick(idx, 'question')}
                onImageAreaMouseEnter={() => { setActiveImageType('question'); setIsImageAreaActive(true); setCurrentImageIdx(idx); }}
                onImageAreaMouseLeave={() => setIsImageAreaActive(false)}
                questionImageInputRef={questionImageInputRef}
                explanationImageInputRef={explanationImageInputRef}
                activeImageType={currentImageIdx === idx ? activeImageType : null}
                isImageAreaActive={currentImageIdx === idx && isImageAreaActive}
                type="question"
                handleImageUpload={(e, isExplanation) => handleImageFileSelected(e.target.files?.[0] ?? null, isExplanation)}
              />
              <Options
                options={q.options}
                answer={q.answer}
                onAddOption={() => handleAddOption(idx)}
                onRemoveOption={(optIdx) => handleRemoveOption(idx, optIdx)}
                onUpdateOption={(optIdx, value) => handleUpdateOption(idx, optIdx, value)}
                onSetAnswer={(ansIdx) => handleSetAnswer(idx, ansIdx)}
                onOptionImageUpload={(file, optIdx) => handleOptionImageUpload(idx, optIdx, file)}
                onOptionImageRemove={(optIdx, imgIdx) => handleOptionImageRemove(idx, optIdx, imgIdx)}
                onOptionImageZoom={imageZoom.showZoom}
              />
              <Explanation
                value={q.explanation || ""}
                onChange={(e) => handleQuestionChange(idx, 'explanation', e.target.value)}
              />
              <ImageGroup
                questionImages={[]}
                explanationImages={q.explanationImages}
                onRemoveImage={(imgIdx) => handleRemoveImageWrapper(idx, imgIdx, true)}
                onZoomImage={imageZoom.showZoom}
                onImageAreaClick={() => handleImageAreaClick(idx, 'explanation')}
                onImageAreaMouseEnter={() => { setActiveImageType('explanation'); setIsImageAreaActive(true); setCurrentImageIdx(idx); }}
                onImageAreaMouseLeave={() => setIsImageAreaActive(false)}
                questionImageInputRef={questionImageInputRef}
                explanationImageInputRef={explanationImageInputRef}
                activeImageType={currentImageIdx === idx ? activeImageType : null}
                isImageAreaActive={currentImageIdx === idx && isImageAreaActive}
                type="explanation"
                handleImageUpload={(e, isExplanation) => handleImageFileSelected(e.target.files?.[0] ?? null, isExplanation)}
              />
              <AdditionalTagInput
                tagInput={questionTagInputs[idx] || ""}
                tags={questionTags[idx] || []}
                onTagInputChange={(v) => handleQuestionTagInputChange(idx, v)}
                onAddTag={(tag) => handleAddQuestionTag(idx, tag)}
                onRemoveTag={(tag) => handleRemoveQuestionTag(idx, tag)}
              />
            </div>
          ))}
        </div>
      )}

      {questions.length > 0 && (
        <SubmitSection
          isSubmitting={isSubmitting}
          isEditMode={false}
        />
      )}

      <ImageZoomModal src={imageZoom.zoomedImage} onClose={imageZoom.closeZoom} />
    </form>
  );
} 