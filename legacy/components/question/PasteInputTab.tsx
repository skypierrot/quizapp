'use client';
import React, { useState, useRef, ChangeEvent, LegacyRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { QuestionContent } from "./common/QuestionContent";
import { Options } from "./common/Options";
import { Explanation } from "./common/Explanation";
import { useToast } from "@/components/ui/use-toast";
import { parseQuestionsImproved } from "@/utils/questionParser";
import { IManualQuestion, IOption, IQuestion, IImage } from "@/types";
import { SubmitSection } from "./common/SubmitSection";
import { useImageZoom } from '@/hooks/useImageZoom';
import { ImageZoomModal } from '@/components/common/ImageZoomModal';
import { useUniversalImageUpload } from '@/hooks/useUniversalImageUpload';
import { generateTempId } from "@/utils/tempId";

interface PasteInputTabProps {
  selectedExamId?: string;
  onSubmit: (data: IManualQuestion[]) => void;
  isSubmitting: boolean;
}

export function PasteInputTab({
  selectedExamId,
  onSubmit,
  isSubmitting,
}: PasteInputTabProps) {
  const { toast } = useToast();
  const [pasteText, setPasteText] = useState("");
  const [questions, setQuestions] = useState<IManualQuestion[]>([]);
  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const imageZoom = useImageZoom();

  const imageUploadHook = useUniversalImageUpload();

  const handleQuestionChange = (idx: number, field: keyof IManualQuestion, value: any) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const handleImageUpload = async (
    event: ChangeEvent<HTMLInputElement> | File,
    qIdx: number, 
    target: 'question' | 'option' | 'explanation', 
    optIdx?: number
  ): Promise<void> => {
    let currentImages: IImage[] = [];
    const question = questions[qIdx];
    if (!question) return;
    if (target === 'question') {
        currentImages = question.images || [];
    } else if (target === 'explanation') {
        currentImages = question.explanationImages || [];
    } else if (target === 'option' && optIdx !== undefined) {
        currentImages = question.options[optIdx]?.images || [];
    }

    await imageUploadHook.handleImageUpload(event, currentImages, (newImage) => {
        setQuestions(prev => prev.map((q, i) => {
            if (i !== qIdx) return q;
            if (target === 'question') {
                return { ...q, images: [...(q.images || []), newImage] };
            } else if (target === 'explanation') {
                return { ...q, explanationImages: [...(q.explanationImages || []), newImage] };
            } else if (target === 'option' && optIdx !== undefined) {
                return {
                    ...q,
                    options: q.options.map((opt, oi) =>
                        oi === optIdx ? { ...opt, images: [...(opt.images || []), newImage] } : opt
                    ),
                };
            }
            return q;
        }));
    });
  };

  const handleImageRemove = (
    qIdx: number,
    target: 'question' | 'option' | 'explanation',
    imageHash: string,
    optIdx?: number
  ) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      if (target === 'question') {
        const updatedImages = (q.images || []).filter(img => img.hash !== imageHash);
        return { ...q, images: updatedImages };
      } else if (target === 'explanation') {
        const updatedImages = (q.explanationImages || []).filter(img => img.hash !== imageHash);
        return { ...q, explanationImages: updatedImages };
      } else if (target === 'option' && optIdx !== undefined) {
        return {
          ...q,
          options: q.options.map((opt, oi) => {
            if (oi !== optIdx) return opt;
            const updatedImages = (opt.images || []).filter(img => img.hash !== imageHash);
            return { ...opt, images: updatedImages };
          })
        };
      }
      return q;
    }));
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

  const handleParse = () => {
    if (!pasteText.trim()) {
      toast({ title: "내용 없음", description: "붙여넣을 텍스트를 입력하세요." });
      return;
    }
    try {
      const parsedResult = parseQuestionsImproved(pasteText);
      if (parsedResult.errors.length > 0) {
        console.warn("Parsing errors:", parsedResult.errors);
        toast({ title: "파싱 경고", description: "일부 내용을 문제 형식으로 변환하지 못했습니다. 확인 후 수정해주세요." });
      }
      if (parsedResult.questions.length === 0 && parsedResult.errors.length > 0) {
        toast({ title: "파싱 실패", description: "텍스트에서 유효한 문제 형식을 찾지 못했습니다." });
        setQuestions([]);
        return;
      }

      const formattedQuestions: IManualQuestion[] = parsedResult.questions.map((p: IQuestion, index: number): IManualQuestion => {
          const mapParsedImages = (parsedImgs: any): IImage[] => {
              if (!parsedImgs || !Array.isArray(parsedImgs)) return [];
              return parsedImgs
                  .filter((imgUrl): imgUrl is string => typeof imgUrl === 'string' && imgUrl.startsWith('http'))
                  .map((imgUrl: string): IImage => ({ url: imgUrl, hash: generateTempId() }));
          };
          
          const mapParsedOptions = (parsedOpts: any): IOption[] => {
              if (!parsedOpts || !Array.isArray(parsedOpts)) return [];
              return parsedOpts.map((opt: any, idx: number) => ({
                  number: opt.number ?? idx + 1,
                  text: opt.text ?? '',
                  images: mapParsedImages(opt.images)
              }));
          };

          return {
              id: `parsed-${generateTempId()}-${index}`,
              number: index + 1,
              content: p.content ?? '',
              options: mapParsedOptions(p.options),
              answer: p.answer ?? -1,
              images: mapParsedImages(p.images),
              explanation: p.explanation ?? undefined,
              explanationImages: mapParsedImages(p.explanationImages),
          };
      });

      setQuestions(formattedQuestions);
      questionRefs.current = Array(formattedQuestions.length).fill(null);
      toast({ title: "파싱 완료", description: `${formattedQuestions.length}개의 문제가 성공적으로 파싱되었습니다.` });
    } catch (error: any) {
      console.error("Parsing error:", error);
      toast({ title: "파싱 오류", description: error.message || "텍스트를 문제 형식으로 변환하는 중 오류가 발생했습니다." });
    }
  };

  function validateQuestions(questionsToValidate: IManualQuestion[]): { valid: boolean; message?: string; focusIdx?: number } {
    for (let i = 0; i < questionsToValidate.length; i++) {
      const q = questionsToValidate[i];
      if (!q.content) return { valid: false, message: `문제 ${i + 1}: 내용이 비어있습니다.`, focusIdx: i };
      if (!q.options || q.options.length === 0) return { valid: false, message: `문제 ${i + 1}: 선택지가 없습니다.`, focusIdx: i };
      if (q.options.some(opt => !opt.text && (!opt.images || opt.images.length === 0))) return { valid: false, message: `문제 ${i + 1}: 모든 선택지는 텍스트나 이미지를 포함해야 합니다.`, focusIdx: i };
      if (q.answer === undefined || q.answer < 0 || q.answer >= q.options.length) return { valid: false, message: `문제 ${i + 1}: 유효한 정답이 선택되지 않았습니다.`, focusIdx: i };
    }
    return { valid: true };
  }

  const handleSave = (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const validation = validateQuestions(questions);
    if (!validation.valid) {
      toast({ title: "입력 오류", description: validation.message });
      if (validation.focusIdx !== undefined && questionRefs.current[validation.focusIdx]) {
        questionRefs.current[validation.focusIdx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    onSubmit(questions);

    setPasteText("");
    setQuestions([]);
  };

  return (
    <div className="space-y-6 border rounded-md shadow-sm p-4 mt-4">
      <Textarea
        value={pasteText}
        onChange={(e) => setPasteText(e.target.value)}
        placeholder="여기에 문제 텍스트를 붙여넣으세요...\n문제 시작은 번호와 점(예: 1.) 선택지는 번호와 괄호(예: 1))로 구분됩니다."
        rows={10}
        className="w-full p-2 border rounded"
      />
      <Button onClick={handleParse} disabled={!pasteText.trim()}>텍스트 파싱</Button>

      {questions.length > 0 && (
        <form onSubmit={handleSave} className="space-y-6">
          {questions.map((q, index) => (
            <div key={q.id} ref={(el: HTMLDivElement | null) => { questionRefs.current[index] = el; }} className="p-4 border rounded-lg shadow-sm bg-white">
              <h3 className="text-lg font-semibold mb-3">문제 {index + 1}</h3>
              <QuestionContent
                 value={q.content}
                 images={q.images || []}
                 onChange={(e) => handleQuestionChange(index, 'content', e.target.value)}
                 onImageUpload={(event) => handleImageUpload(event, index, 'question')}
                 onImageRemove={(hash: string) => handleImageRemove(index, 'question', hash)}
                 onImageZoom={imageZoom.showZoom}
              />

              <Options
                 options={q.options}
                 answer={q.answer}
                 onSetAnswer={(ansIdx: number) => handleSetAnswer(index, ansIdx)}
                 onUpdateOption={(optIdx: number, text: string) => handleUpdateOption(index, optIdx, text)}
                 onAddOption={() => handleAddOption(index)}
                 onRemoveOption={(optIdx: number) => handleRemoveOption(index, optIdx)}
                 onOptionImageUpload={(file: File, optIdx: number) => {
                    handleImageUpload(file, index, 'option', optIdx); 
                 }}
                 onOptionImageRemove={(optIdx: number, imgIdx: number) => {
                   const imageHash = q.options[optIdx]?.images?.[imgIdx]?.hash;
                   if (imageHash) {
                     handleImageRemove(index, 'option', imageHash, optIdx);
                   }
                 }}
                 onOptionImageZoom={imageZoom.showZoom}
              />

              <Explanation
                 value={q.explanation || ''}
                 images={q.explanationImages || []}
                 onChange={(e) => handleQuestionChange(index, 'explanation', e.target.value)}
                 onImageUpload={(event) => handleImageUpload(event, index, 'explanation')}
                 onImageRemove={(hash: string) => handleImageRemove(index, 'explanation', hash)}
                 onImageZoom={imageZoom.showZoom}
              />
            </div>
          ))}
          <SubmitSection isSubmitting={isSubmitting} isEditMode={false} />
        </form>
      )}

      <ImageZoomModal 
        src={imageZoom.zoomedImage}
        onClose={imageZoom.closeZoom}
      />
    </div>
  );
} 