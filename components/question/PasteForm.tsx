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
import { useCascadingTags } from '@/hooks/question/useCascadingTags';

const MAX_IMAGE_COUNT = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

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

  const imageZoom = useImageZoom();

  const {
    examName,
    year,
    session,
    subject,
    examNameOptions,
    yearOptions,
    sessionOptions,
    isLoadingExamNames,
    isLoadingYears,
    isLoadingSessions,
    isYearValid,
    isYearDisabled,
    isSessionDisabled,
    handleExamNameChange,
    handleYearChange,
    handleSessionChange,
    handleExamNameCreate,
    handleYearCreate,
    handleSessionCreate,
    setSubject,
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
       const trimmedExamName = examName.trim();
       const trimmedYear = year.trim();
       const trimmedSession = session.trim();

       if (!trimmedExamName || !trimmedYear || !trimmedSession || !isYearValid) { 
         toast({ title: "필수 태그 오류", description: "시험명, 년도(YYYY 형식), 회차는 필수 입력 항목입니다.", variant: "error" });
         return;
       }
       
       const trimmedSubject = subject.trim();
       const basicTags: string[] = [
         `시험명:${trimmedExamName}`,
         `년도:${trimmedYear}`,
         `회차:${trimmedSession}`,
         ...(trimmedSubject ? [`과목:${trimmedSubject}`] : []),
       ];

       const questionsPayload = questions.map((q, idx) => ({
         content: q.content,
         options: q.options.map(opt => ({
           number: opt.number,
           text: opt.text,
           images: q.images.map(img => img.url).filter(Boolean),
         })),
         answer: q.answer,
         explanation: q.explanation || "",
         images: q.images.map(img => img.url).filter(Boolean),
         explanationImages: q.explanationImages.map(img => img.url).filter(Boolean),
         tags: [
           ...basicTags,
           ...commonTags,
           ...(questionTags[idx] || []).filter(tag =>
             !(tag.startsWith('시험명:') || tag.startsWith('년도:') || 
               tag.startsWith('회차:') || tag.startsWith('과목:')) 
           )
         ],
       }));

       const formData = new FormData();
       questionsPayload.forEach((q, idx) => {
         Object.entries(q).forEach(([key, value]) => {
           if (key === 'options' || key === 'tags' || key === 'images' || key === 'explanationImages') {
             formData.append(key, JSON.stringify(value));
           } else {
             formData.append(key, String(value));
           }
         });
       });

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

      for (const res of result) {
        if (res.success) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      if (successCount > 0 && errorCount === 0) {
        toast({ title: "저장 완료", description: `${successCount}개의 문제가 성공적으로 저장되었습니다.`, variant: "success" });
        setPasteText("");
        setQuestions([]);
        setCommonTags([]);
        setCommonTagInput("");
        setQuestionTags([]);
        setQuestionTagInputs({});
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

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">문제 붙여넣기</h2>
      <Textarea
        placeholder="여기에 문제 텍스트를 붙여넣으세요..."
        value={pasteText}
        onChange={(e) => setPasteText(e.target.value)}
        rows={10}
        className="mb-4"
      />
      <Button onClick={handleParse} disabled={!pasteText}>문제 파싱</Button>

      {questions.length > 0 && (
        <form onSubmit={handleSave} className="space-y-8 mt-6">
          <BasicTagSettings
             examName={examName}
             year={year}
             session={session}
             subject={subject}
             examNameOptions={examNameOptions}
             yearOptions={yearOptions}
             sessionOptions={sessionOptions}
             isLoadingExamNames={isLoadingExamNames}
             isLoadingYears={isLoadingYears}
             isLoadingSessions={isLoadingSessions}
             isYearDisabled={isYearDisabled}
             isSessionDisabled={isSessionDisabled}
             onExamNameChange={handleExamNameChange}
             onYearChange={handleYearChange}
             onSessionChange={handleSessionChange}
             onExamNameCreate={handleExamNameCreate}
             onYearCreate={handleYearCreate}
             onSessionCreate={handleSessionCreate}
             onSubjectChange={setSubject}
          />
           {!isYearValid && year && (
              <p className="text-xs text-red-500 -mt-4 mb-4 ml-1">년도는 4자리 숫자로 입력해주세요.</p>
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
       <ImageZoomModal src={imageZoom.zoomedImage} onClose={imageZoom.closeZoom} />
    </div>
  );
} 