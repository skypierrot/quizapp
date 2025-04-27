'use client';
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TagGroup } from "./common/TagGroup";
import { QuestionContent } from "./common/QuestionContent";
import { Options } from "./common/Options";
import { Explanation } from "./common/Explanation";
import { ImageGroup } from "./common/ImageGroup";
import { useToast } from "@/components/ui/use-toast";
import { parseQuestionsImproved } from "@/utils/questionParser";
import { IManualQuestion, ToastType } from "@/types";
import { useImageUpload } from "@/hooks/useImageUpload";
import { SubmitSection } from "./common/SubmitSection";

// images 객체 배열을 string[]로 변환하는 유틸 함수
const mapAndFilterImageUrls = (images: { url: string; hash: string }[] = []) => images.map(img => img.url).filter(Boolean);

const MAX_IMAGE_COUNT = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export default function PasteForm() {
  const { toast } = useToast();
  const [pasteText, setPasteText] = useState("");
  const [questions, setQuestions] = useState<IManualQuestion[]>([]);
  const [examName, setExamName] = useState("");
  const [year, setYear] = useState("");
  const [session, setSession] = useState("");
  const [subject, setSubject] = useState("");
  const [commonTags, setCommonTags] = useState<string[]>([]);
  const [commonTagInput, setCommonTagInput] = useState("");
  const [questionTags, setQuestionTags] = useState<string[][]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [currentImageIdx, setCurrentImageIdx] = useState<number | null>(null);
  const [activeImageType, setActiveImageType] = useState<'question' | 'explanation' | null>(null);
  const [isImageAreaActive, setIsImageAreaActive] = useState(false);
  const questionImageInputRef = useRef<HTMLInputElement>(null);
  const explanationImageInputRef = useRef<HTMLInputElement>(null);
  const [questionTagInputs, setQuestionTagInputs] = useState<{ [idx: number]: string }>({});
  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 문제 이미지 업로드 훅
  const questionImageUpload = useImageUpload((file, url) => {
    if (currentImageIdx !== null) {
      setQuestions(prev => prev.map((q, i) =>
        i === currentImageIdx ? { ...q, images: [...q.images, { url, hash: "" }] } : q
      ));
    }
  });
  // 해설 이미지 업로드 훅
  const explanationImageUpload = useImageUpload((file, url) => {
    if (currentImageIdx !== null) {
      setQuestions(prev => prev.map((q, i) =>
        i === currentImageIdx ? { ...q, explanationImages: [...q.explanationImages, { url, hash: "" }] } : q
      ));
    }
  });
  // 선택지 이미지 업로드 훅 (선택지별로 구현 필요)
  // ... (생략: 필요시 추가 구현)

  // 이미지 업로드 핸들러 (문제/해설 구분, 유효성 검사 포함)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isExplanation = false) => {
    const file = e.target.files?.[0];
    if (!file || currentImageIdx === null) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: "이미지 파일만 업로드 가능합니다.", variant: "error" });
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast({ title: "5MB 이하 이미지만 업로드 가능합니다.", variant: "error" });
      return;
    }
    setQuestions(prev => prev.map((q, i) => {
      if (i !== currentImageIdx) return q;
      const targetImages = isExplanation ? q.explanationImages : q.images;
      if (targetImages.length >= MAX_IMAGE_COUNT) {
        toast({ title: "최대 5장까지 업로드 가능합니다.", variant: "error" });
        return q;
      }
      const url = URL.createObjectURL(file);
      return isExplanation
        ? { ...q, explanationImages: [...q.explanationImages, { url, hash: "" }] }
        : { ...q, images: [...q.images, { url, hash: "" }] };
    }));
  };

  // 이미지 삭제
  const handleRemoveImage = (qIdx: number, imgIdx: number, isExplanation?: boolean) => {
    setQuestions(prev => prev.map((q, i) =>
      i === qIdx
        ? isExplanation
          ? { ...q, explanationImages: q.explanationImages.filter((_, j) => j !== imgIdx) }
          : { ...q, images: q.images.filter((_, j) => j !== imgIdx) }
        : q
    ));
  };

  // 이미지 확대(미리보기)
  const handleZoomImage = (url: string) => {
    window.open(url, "_blank");
  };

  // 붙여넣기 → 파싱
  const handleParse = () => {
    const { questions: parsed, errors } = parseQuestionsImproved(pasteText);
    if (parsed.length === 0) {
      toast({ title: "문제 파싱 실패", description: errors.join("\n"), variant: "error" });
      return;
    }
    setQuestions(parsed.map(q => ({
      ...q,
      images: [],
      explanationImages: [],
      tags: [],
      explanation: q.explanation ?? "",
      options: q.options.map((opt: any, idx: number) => ({
        number: typeof opt.number === "number" ? opt.number : idx + 1,
        text: typeof opt.text === "string" ? opt.text : String(opt),
        images: Array.isArray(opt.images) ? opt.images : [],
      })),
    })));
    setQuestionTags(parsed.map(() => []));
    setPasteText("");
  };

  // 저장 버튼 활성화 조건
  const allAnswered = questions.length > 0 && questions.every(q => q.answer >= 0);

  // 유효성 검사 함수
  function validateQuestions(questions: IManualQuestion[]): { valid: boolean; message?: string; focusIdx?: number } {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.content.trim()) {
        return { valid: false, message: `문제 ${i + 1}의 본문을 입력하세요.`, focusIdx: i };
      }
      if (!q.options || q.options.length < 2) {
        return { valid: false, message: `문제 ${i + 1}의 선택지는 최소 2개 이상이어야 합니다.`, focusIdx: i };
      }
      for (let j = 0; j < q.options.length; j++) {
        const opt = q.options[j];
        if (!opt.text.trim() && (!opt.images || opt.images.length === 0)) {
          return { valid: false, message: `문제 ${i + 1}의 선택지 ${j + 1}에 내용 또는 이미지를 입력하세요.`, focusIdx: i };
        }
      }
      if (typeof q.answer !== 'number' || q.answer < 0 || q.answer >= q.options.length) {
        return { valid: false, message: `문제 ${i + 1}의 정답을 선택하세요.`, focusIdx: i };
      }
    }
    return { valid: true };
  }

  // 저장
  const handleSave = async () => {
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
      // 문제별 추가 태그 미입력 상태 로그
      questions.forEach((q, idx) => {
        console.log(`문제 #${idx + 1} 추가 태그:`, questionTags[idx]);
        if (!questionTags[idx] || questionTags[idx].length === 0) {
          console.warn(`문제 #${idx + 1}는 추가 태그가 없습니다.`);
        }
      });
      // 공통 태그, 공통 추가 태그, 문제별 추가 태그 로그
      console.log('공통 태그:', [`시험명:${examName}`, `년도:${year}`, `회차:${session}`, ...(subject ? [`과목:${subject}`] : [])]);
      console.log('공통 추가 태그:', commonTags);
      const payload = questions.map((q, idx) => ({
        content: q.content,
        options: q.options.map(opt => ({
          number: opt.number,
          text: opt.text,
          images: mapAndFilterImageUrls(opt.images)
        })),
        answer: q.answer,
        explanation: q.explanation || "",
        images: mapAndFilterImageUrls(q.images),
        explanationImages: mapAndFilterImageUrls(q.explanationImages),
        tags: [
          `시험명:${examName}`,
          `년도:${year}`,
          `회차:${session}`,
          ...(subject ? [`과목:${subject}`] : []),
          ...commonTags,
          ...(questionTags[idx] || [])
        ],
        updatedAt: new Date()
      }));
      console.log('최종 저장 payload:', payload);
      const response = await fetch("/api/questions/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("문제 저장 중 오류가 발생했습니다.");
      toast({ title: "저장 완료", variant: "success" });
      setQuestions([]);
      setQuestionTags([]);
    } catch (e: any) {
      toast({ title: "저장 실패", description: e.message, variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 공통 태그 추가/삭제 (중복 방지)
  const handleAddCommonTag = (tag: string) => {
    if (!tag.trim() || commonTags.includes(tag.trim())) return;
    setCommonTags(prev => [...prev, tag.trim()]);
    setTagInput("");
  };
  const handleRemoveCommonTag = (tag: string) => {
    setCommonTags(prev => prev.filter(t => t !== tag));
  };

  // 문제별 태그 추가/삭제 (중복 방지)
  const handleAddQuestionTag = (idx: number, tag: string) => {
    setQuestionTags(prev => prev.map((tags, i) =>
      i === idx && !tags.includes(tag.trim())
        ? [...tags, tag.trim()]
        : tags
    ));
    setQuestionTagInputs(inputs => ({ ...inputs, [idx]: "" }));
  };
  const handleRemoveQuestionTag = (idx: number, tag: string) => {
    setQuestionTags(prev => prev.map((tags, i) =>
      i === idx
        ? tags.filter(t => t !== tag)
        : tags
    ));
  };

  // 문제별 추가 태그 입력 UI 컴포넌트 분리
  function TagInput({ value, tags, onChange, onAdd, onRemove }: { value: string; tags: string[]; onChange: (v: string) => void; onAdd: (tag: string) => void; onRemove: (tag: string) => void }) {
    return (
      <div className="mb-4 p-3 border border-gray-200 rounded-md">
        <h4 className="text-sm font-medium mb-2">추가 태그</h4>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="text-sm border rounded px-2 py-1 flex-1"
            placeholder="예: 필기, 핵심개념, 중요문제 등"
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                e.preventDefault();
                if (value.trim()) {
                  onAdd(value.trim());
                  onChange("");
                }
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (value.trim()) {
                onAdd(value.trim());
                onChange("");
              }
            }}
          >
            추가
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag, i) => (
              <span key={i} className="bg-gray-100 border rounded px-2 py-1 text-xs flex items-center gap-1">
                {tag}
                <button type="button" onClick={() => onRemove(tag)} className="ml-1 text-gray-500 hover:text-gray-700">×</button>
              </span>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-500 mt-2">기본 태그 외에 추가로 문제를 분류할 태그를 입력하세요. 입력 후 Enter 또는 추가 버튼을 클릭하세요.</p>
      </div>
    );
  }

  return (
    <form onSubmit={e => { e.preventDefault(); handleSave(); }} className="space-y-8">
      {/* 공통 태그 입력란 */}
      <TagGroup
        examName={examName}
        year={year}
        isYearValid={true}
        session={session}
        subject={subject}
        tagInput={commonTagInput}
        tags={commonTags}
        onExamNameChange={setExamName}
        onYearChange={setYear}
        onSessionChange={setSession}
        onSubjectChange={setSubject}
        onTagInputChange={setCommonTagInput}
        onAddTag={tag => {
          if (!commonTags.includes(tag)) setCommonTags([...commonTags, tag]);
          setCommonTagInput("");
        }}
        onRemoveTag={tag => setCommonTags(commonTags.filter(t => t !== tag))}
      />
      {/* 붙여넣기 입력란 */}
      <div>
        <Textarea
          value={pasteText}
          onChange={e => setPasteText(e.target.value)}
          placeholder="문제와 선택지를 붙여넣으세요."
        />
        <Button onClick={handleParse} disabled={!pasteText.trim()}>문제 자동분류</Button>
      </div>
      {/* 분류된 문제 리스트 */}
      {questions.map((q, idx) => (
        <div
          key={idx}
          ref={el => { questionRefs.current[idx] = el; }}
          className={`border rounded-lg p-4 space-y-4 ${!q.content.trim() ? 'border-red-400' : ''}`}
        >
          <QuestionContent
            value={q.content}
            onChange={e => {
              const value = e.target.value;
              setQuestions(prev => prev.map((qq, i) => i === idx ? { ...qq, content: value } : qq));
            }}
          />
          <ImageGroup
            questionImages={q.images}
            explanationImages={[]}
            onRemoveImage={(imgIdx: number, isExplanation?: boolean) => handleRemoveImage(idx, imgIdx, isExplanation)}
            onZoomImage={handleZoomImage}
            onImageAreaClick={type => {
              setCurrentImageIdx(idx);
              setActiveImageType(type);
              setIsImageAreaActive(true);
              (type === 'question' ? questionImageInputRef : explanationImageInputRef).current?.click();
            }}
            onImageAreaMouseEnter={type => {
              setActiveImageType(type);
              setIsImageAreaActive(true);
            }}
            onImageAreaMouseLeave={() => setIsImageAreaActive(false)}
            questionImageInputRef={questionImageInputRef}
            explanationImageInputRef={explanationImageInputRef}
            activeImageType={activeImageType ?? undefined}
            isImageAreaActive={isImageAreaActive}
            handleImageUpload={handleImageUpload}
            type="question"
          />
          <Options
            options={q.options}
            answer={q.answer}
            onAddOption={() => {
              setQuestions(prev => prev.map((qq, i) =>
                i === idx
                  ? { ...qq, options: [...qq.options, { number: qq.options.length + 1, text: "", images: [] }] }
                  : qq
              ));
            }}
            onRemoveOption={optIdx => {
              setQuestions(prev => prev.map((qq, i) =>
                i === idx
                  ? { ...qq, options: qq.options.filter((_, i2) => i2 !== optIdx) }
                  : qq
              ));
            }}
            onUpdateOption={(optIdx, value) => {
              setQuestions(prev => prev.map((qq, i) =>
                i === idx
                  ? { ...qq, options: qq.options.map((opt, i2) => i2 === optIdx ? { ...opt, text: value } : opt) }
                  : qq
              ));
            }}
            onSetAnswer={ansIdx => {
              setQuestions(prev => prev.map((qq, i) =>
                i === idx
                  ? { ...qq, answer: ansIdx }
                  : qq
              ));
            }}
            onOptionImageUpload={(file, optIdx) => {
              setQuestions(prev => prev.map((qq, i) =>
                i === idx
                  ? {
                      ...qq,
                      options: qq.options.map((opt, j) =>
                        j === optIdx
                          ? { ...opt, images: [...opt.images, { url: URL.createObjectURL(file), hash: "" }] }
                          : opt
                      ),
                    }
                  : qq
              ));
            }}
            onOptionImageRemove={(optIdx, imgIdx) => {
              setQuestions(prev => prev.map((qq, i) =>
                i === idx
                  ? {
                      ...qq,
                      options: qq.options.map((opt, j) =>
                        j === optIdx
                          ? { ...opt, images: opt.images.filter((_, k) => k !== imgIdx) }
                          : opt
                      ),
                    }
                  : qq
              ));
            }}
            onOptionImageZoom={url => {
              window.open(url, "_blank");
            }}
          />
          <Explanation
            value={q.explanation || ""}
            onChange={e => {
              const value = e.target.value;
              setQuestions(prev => prev.map((qq, i) => i === idx ? { ...qq, explanation: value } : qq));
            }}
          />
          <ImageGroup
            questionImages={[]}
            explanationImages={q.explanationImages}
            onRemoveImage={(imgIdx: number, isExplanation?: boolean) => handleRemoveImage(idx, imgIdx, isExplanation)}
            onZoomImage={handleZoomImage}
            onImageAreaClick={type => {
              setCurrentImageIdx(idx);
              setActiveImageType(type);
              setIsImageAreaActive(true);
              (type === 'question' ? questionImageInputRef : explanationImageInputRef).current?.click();
            }}
            onImageAreaMouseEnter={type => {
              setActiveImageType(type);
              setIsImageAreaActive(true);
            }}
            onImageAreaMouseLeave={() => setIsImageAreaActive(false)}
            questionImageInputRef={questionImageInputRef}
            explanationImageInputRef={explanationImageInputRef}
            activeImageType={activeImageType ?? undefined}
            isImageAreaActive={isImageAreaActive}
            handleImageUpload={handleImageUpload}
            type="explanation"
          />
          <TagInput
            value={questionTagInputs[idx] || ""}
            tags={questionTags[idx] || []}
            onChange={v => setQuestionTagInputs(inputs => ({ ...inputs, [idx]: v }))}
            onAdd={tag => {
              handleAddQuestionTag(idx, tag);
              setQuestionTagInputs(inputs => ({ ...inputs, [idx]: "" }));
            }}
            onRemove={tag => handleRemoveQuestionTag(idx, tag)}
          />
        </div>
      ))}
      <SubmitSection isSubmitting={isSubmitting} isEditMode={false} />
    </form>
  );
} 