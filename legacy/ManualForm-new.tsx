"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useCallback, useEffect } from "react"; // Added useEffect
import { useToast } from "@/components/ui/use-toast";
import { cn, generateId } from "@/lib/utils";
import { Loader2, X, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useForm, useFieldArray, FieldPath, Control } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { QuestionForm } from "./QuestionForm";

// Helper schema for image objects
const ImageObjectSchema = z.object({
  url: z.string().min(1, { message: "이미지 URL은 비어 있을 수 없습니다." }),
  hash: z.string().optional(),
});

// Schema Definition
export const ManualFormSchema = z.object({
  examInfo: z.object({
    examName: z.string().min(1, "시험명을 입력하세요."),
    year: z.string().regex(/^\d{4}$/, "년도는 4자리 숫자로 입력하세요."),
    session: z.string().min(1, "회차를 입력하세요."),
    subject: z.string().optional(),
  }),
  questions: z.array(
    z.object({
      id: z.string().optional(),
      content: z.string().min(2, "문제 내용은 2글자 이상이어야 합니다."),
      options: z.array(
        z.object({
          id: z.string().optional(),
          content: z.string().optional(),
          images: z.array(ImageObjectSchema).optional(),
        })
      ).min(2, "최소 2개의 선택지가 필요합니다").max(10, "선택지는 최대 10개까지 가능합니다."),
      answer: z.number().min(-1, "정답을 선택하거나 -1이어야 합니다."),
      explanation: z.string().optional(),
      images: z.array(ImageObjectSchema).optional(),
      explanationImages: z.array(ImageObjectSchema).optional(),
      customTags: z.array(z.string()).max(10, "태그는 최대 10개까지 가능합니다.").optional(),
    })
  ).min(1, "최소 1개의 문제가 필요합니다.").max(20, "한 번에 최대 20개의 문제만 추가 가능합니다."),
});

// Define the type for the image object based on the schema
type ImageObject = z.infer<typeof ImageObjectSchema>;

// Form Data Type
type ManualFormData = z.infer<typeof ManualFormSchema>;

// Initial Data Types
type InitialOptionData = { id?: string; content?: string; images?: ImageObject[] };
type InitialQuestionData = {
  id?: string;
    content?: string;
    options?: Array<InitialOptionData>;
    answer?: number;
  explanation?: string;
    images?: ImageObject[];
    explanationImages?: ImageObject[];
    customTags?: string[];
};
interface InitialManualData {
  examInfo?: {
    examName?: string;
    year?: string;
    session?: string;
    subject?: string;
  };
  questions?: Array<InitialQuestionData>;
}

// Component Props
export interface ManualFormProps {
  initialData?: InitialManualData;
  isEditMode?: boolean;
  onSuccess?: () => void;
  apiMethod?: "POST" | "PUT" | "PATCH";
  apiUrl?: string;
}

// --- Hash Calculation Utility ---
async function calculateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// --- Component ---
export function ManualForm({
  initialData,
  isEditMode = false,
  onSuccess,
  apiMethod,
  apiUrl
}: ManualFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tagInputQuestionIndex, setTagInputQuestionIndex] = useState<number | null>(null);

  const createDefaultQuestion = () => ({
      id: generateId(),
      content: "",
    options: Array(4).fill(null).map(() => ({ id: generateId(), content: '', images: [] })),
    answer: -1,
      explanation: "",
      images: [],
      explanationImages: [],
    customTags: []
  });

  const form = useForm<ManualFormData>({
    resolver: zodResolver(ManualFormSchema),
    defaultValues: {
      examInfo: {
        examName: initialData?.examInfo?.examName || "",
        year: initialData?.examInfo?.year || "",
        session: initialData?.examInfo?.session || "",
        subject: initialData?.examInfo?.subject || "",
      },
      questions: initialData?.questions && initialData.questions.length > 0
        ? initialData.questions.map((q: InitialQuestionData): ManualFormData['questions'][number] => ({
            id: q.id || generateId(),
            content: q.content || "",
            options: (q.options && q.options.length > 0 ? q.options : Array(4).fill(null))
              .map(opt => ({
                id: opt?.id || generateId(),
                content: opt?.content || '',
                images: (opt?.images || []).map((img: ImageObject) => ({ url: img.url, hash: img.hash }))
              }))
              .slice(0, 10),
            answer: q.answer ?? -1,
            explanation: q.explanation || "",
            images: (q.images || []).map((img: ImageObject) => ({ url: img.url, hash: img.hash })),
            explanationImages: (q.explanationImages || []).map((img: ImageObject) => ({ url: img.url, hash: img.hash })),
            customTags: (q.customTags || []).slice(0, 10),
          }))
        : [createDefaultQuestion()]
    },
  });

    // Debug Log for Validation
    const { formState: { errors, isValid } } = form;
    useEffect(() => {
      console.log("[DEBUG Form Validation]", { isValid, errors });
    }, [isValid, errors]);


  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({
    control: form.control,
    name: "questions"
  });

  const getFieldName = (
    imageType: 'question' | 'explanation' | 'option',
    questionIndex: number,
    optionIndex?: number
  ): FieldPath<ManualFormData> | null => {
    if (imageType === 'question') return `questions.${questionIndex}.images`;
    if (imageType === 'explanation') return `questions.${questionIndex}.explanationImages`;
    if (imageType === 'option' && optionIndex !== undefined) return `questions.${questionIndex}.options.${optionIndex}.images`;
    return null;
  };

  const handleImageUpload = async (
    file: File,
    imageType: 'question' | 'explanation' | 'option',
    questionIndex: number,
    optionIndex?: number
  ) => {
    console.log(`[ManualForm DEBUG] handleImageUpload called for ${imageType}, qIdx: ${questionIndex}, optIdx: ${optionIndex}, File:`, file.name);
    const fieldName = getFieldName(imageType, questionIndex, optionIndex);
    if (!fieldName) return;

    // --- File Validation & Hash Calculation ---
    let calculatedHash = '';
    try {
        if (file.size > 5 * 1024 * 1024) throw new Error("이미지 파일은 5MB를 초과할 수 없습니다.");
        if (!file.type.startsWith('image/')) throw new Error("이미지 파일만 업로드할 수 있습니다.");

        console.log("[ManualForm DEBUG] Calculating file hash...");
        calculatedHash = await calculateFileHash(file);
        console.log(`[ManualForm DEBUG] Calculated Hash: ${calculatedHash}`);

        // --- Check for Duplicate Hash ---
        const existingImageObjects = form.getValues(fieldName as any) as ImageObject[] || [];
        const duplicateHashExists = existingImageObjects.some(img => img.hash === calculatedHash);

        if (duplicateHashExists) {
            console.log(`[ManualForm DEBUG] Duplicate Hash detected: ${calculatedHash}. Aborting upload.`);
            toast({ title: "이미지 중복", description: "이미 동일한 내용의 이미지가 추가되어 있습니다 (해시 비교).", variant: "warning" });
            throw new Error("Duplicate image content (hash match)."); // Throw error to stop QuestionForm loading state
        }
        console.log("[ManualForm DEBUG] Hash is unique. Proceeding with upload.");
        // --- End Hash Check ---

    } catch (error: any) {
        toast({ title: "이미지 처리 오류", description: error.message, variant: "destructive" });
        throw error; // Re-throw to ensure QuestionForm handles loading state
    }
    // --- End Validation & Hash ---

    const formData = new FormData();
    formData.append('file', file);

    try {
      // --- API Upload ---
      console.log("[ManualForm DEBUG] Uploading file to API...");
      const response = await fetch("/api/images/upload", { method: "POST", body: formData });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `이미지 업로드 실패 (${response.status})`);
      }
      const result = await response.json();
      console.log("[ManualForm DEBUG] Upload success, URL:", result.url);

      const newImage: ImageObject = { url: result.url, hash: calculatedHash }; // Use the calculated hash

      const currentImages = form.getValues(fieldName) || [];
      form.setValue(fieldName, [...currentImages, newImage], { shouldValidate: true, shouldDirty: true });
      console.log(`[ManualForm DEBUG] Image object added to field ${fieldName}:`, newImage);

      // --- Clear content error if option image was added and content is empty ---
      if (imageType === 'option' && optionIndex !== undefined) {
        const contentFieldName = `questions.${questionIndex}.options.${optionIndex}.content` as const;
        const contentValue = form.getValues(contentFieldName);
        if (!contentValue || String(contentValue).trim() === '') {
          console.log(`[ManualForm DEBUG] Clearing error for empty content field: ${contentFieldName}`);
          form.clearErrors(contentFieldName);
        }
      }
      // --- End of error clearing logic ---

    } catch (error: any) {
      console.error("[ManualForm DEBUG] Upload failed:", error);
      toast({ title: "이미지 업로드 실패", description: error.message, variant: "destructive" });
       throw error; // Re-throw for QuestionForm
    }
  };


  const handleImageUrlAdd = (
    url: string,
    imageType: 'question' | 'explanation' | 'option',
    questionIndex: number,
    optionIndex?: number
  ) => {
     console.log(`[ManualForm DEBUG] handleImageUrlAdd called for ${imageType}, URL: ${url}`);
      if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
           toast({ title: "유효하지 않은 URL", description: "유효한 이미지 URL을 입력하세요.", variant: "warning" });
           return;
      }

      const newImage: ImageObject = { url }; // No hash for external URLs initially

       const fieldName = getFieldName(imageType, questionIndex, optionIndex);
      if (fieldName) {
          const currentImages = form.getValues(fieldName) || [];
          if (currentImages.some(img => img.url === url)) {
              toast({ title: "중복 URL", description: "이미 동일한 이미지 URL이 존재합니다.", variant: "warning" });
              return;
          }
          form.setValue(fieldName, [...currentImages, newImage], { shouldValidate: true, shouldDirty: true });
          console.log(`[ManualForm DEBUG] Image URL object added to field ${fieldName}:`, newImage);

          // --- Clear content error if option image URL was added and content is empty ---
          if (imageType === 'option' && optionIndex !== undefined) {
              const contentFieldName = `questions.${questionIndex}.options.${optionIndex}.content` as const;
              const contentValue = form.getValues(contentFieldName);
              if (!contentValue || String(contentValue).trim() === '') {
                  console.log(`[ManualForm DEBUG] Clearing error for empty content field: ${contentFieldName}`);
                  form.clearErrors(contentFieldName);
              }
          }
          // --- End of error clearing logic ---
      }
  };


  const handleImageRemove = (
    imageType: 'question' | 'explanation' | 'option',
    questionIndex: number,
    imageIndex: number,
    optionIndex?: number
  ) => {
    const fieldName = getFieldName(imageType, questionIndex, optionIndex);
    if (!fieldName) return;

    const currentImages = form.getValues(fieldName) || [];
    const updatedImages = currentImages.filter((_, idx) => idx !== imageIndex);
    form.setValue(fieldName, updatedImages, { shouldValidate: true, shouldDirty: true });
    console.log(`[ManualForm DEBUG] Image removed from ${fieldName} at index ${imageIndex}`);
  };


  const handleAddOption = (questionIndex: number) => {
    const optionsPath = `questions.${questionIndex}.options` as const;
    const options = form.getValues(optionsPath) || [];
    form.setValue(optionsPath, [...options, { id: generateId(), content: "", images: [] }], { shouldValidate: true, shouldDirty: true });
  };

  const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
    const optionsPath = `questions.${questionIndex}.options` as const;
    const options = form.getValues(optionsPath);
    if (options && options.length > 2) {
      const newOptions = options.filter((_, i) => i !== optionIndex);
      const currentAnswer = form.getValues(`questions.${questionIndex}.answer`);

      if (currentAnswer === optionIndex) {
        form.setValue(`questions.${questionIndex}.answer`, -1);
      }
      else if (currentAnswer !== undefined && currentAnswer !== -1 && currentAnswer > optionIndex) {
        form.setValue(`questions.${questionIndex}.answer`, currentAnswer - 1);
      }

      form.setValue(optionsPath, newOptions, { shouldValidate: true, shouldDirty: true });
    }
  };

  const handleAnswerChange = (questionIndex: number, value: string) => {
    const answerIndex = parseInt(value, 10);
    if (!isNaN(answerIndex)) {
      form.setValue(`questions.${questionIndex}.answer`, answerIndex, {
        shouldValidate: true,
        shouldDirty: true
      });
      console.log(`[DEBUG Answer Set] Q:${questionIndex}, Ans:${answerIndex}`);
      form.trigger();
    } else {
        console.warn(`[WARN Answer Set] Invalid value received: ${value}`);
    }
  };

    const handleCustomTagChange = (e: React.ChangeEvent<HTMLInputElement>, questionIndex: number) => {
        const newTag = e.target.value;
        setTagInput(newTag);
        setTagInputQuestionIndex(questionIndex);
    };

    const addCustomTag = (questionIndex: number) => {
        const tag = tagInput.trim();
        if (tag && tagInputQuestionIndex === questionIndex) {
            const tagsPath = `questions.${questionIndex}.customTags` as const;
            const currentTags = form.getValues(tagsPath) || [];
            if (currentTags.length < 10 && !currentTags.includes(tag)) {
                form.setValue(tagsPath, [...currentTags, tag], { shouldValidate: true, shouldDirty: true });
                setTagInput(""); // Clear input after adding
                setTagInputQuestionIndex(null);
            } else if (currentTags.includes(tag)) {
                 toast({ title: "중복 태그", variant: "warning" });
            } else {
                 toast({ title: "태그 최대 개수 도달", variant: "warning" });
            }
        }
    };

    const removeCustomTag = (questionIndex: number, tagIndex: number) => {
        const tagsPath = `questions.${questionIndex}.customTags` as const;
        const currentTags = form.getValues(tagsPath) || [];
        form.setValue(tagsPath, currentTags.filter((_, index) => index !== tagIndex), { shouldValidate: true, shouldDirty: true });
    };


  const getOptionImages = (questionIndex: number, optionIndex: number): ImageObject[] => {
      const imagePath = `questions.${questionIndex}.options.${optionIndex}.images` as const;
      return form.watch(imagePath) || [];
  };

  const getQuestionImages = (questionIndex: number): ImageObject[] => {
      const imagePath = `questions.${questionIndex}.images` as const;
      return form.watch(imagePath) || [];
  };

  const getExplanationImages = (questionIndex: number): ImageObject[] => {
      const imagePath = `questions.${questionIndex}.explanationImages` as const;
      return form.watch(imagePath) || [];
  };

  const handleAddNewQuestion = () => {
       if (questionFields.length >= 20) {
           toast({ title: "최대 문제 개수 도달", description: "한 번에 최대 20개의 문제만 추가할 수 있습니다.", variant: "warning" });
           return;
       }
      appendQuestion(createDefaultQuestion());
  };

  const onSubmit = async (data: ManualFormData) => {
    setIsSubmitting(true);
    console.log("Form Data Submitted (Raw):", JSON.stringify(data, null, 2));

    // --- Data Transformation for API ---
    const finalQuestionsData = data.questions.map(q => {
      const basicTags = [
        `시험명:${data.examInfo.examName.trim()}`,
        `년도:${data.examInfo.year.trim()}`,
        `회차:${data.examInfo.session.trim()}`,
        ...(data.examInfo.subject?.trim() ? [`과목:${data.examInfo.subject.trim()}`] : []),
      ];
      const customTagsArray = Array.isArray(q.customTags) ? q.customTags : [];

      const validOptions = (q.options || []).filter(opt =>
        (opt.content && opt.content.trim() !== '') || (opt.images && opt.images.length > 0)
      );

      if (validOptions.length < 2 && q.content.trim() !== '') {
           const qIndex = data.questions.findIndex(item => item.id === q.id);
           throw new Error(`${qIndex + 1}번 문제 ("${q.content.substring(0,20)}...")의 유효한 선택지가 2개 미만입니다.`);
      }

      const mapAndFilterImageUrls = (images?: ImageObject[]): string[] => {
        if (!images) return [];
        return images
          .map(img => img.url)
          .filter(url => !url.startsWith('http://') && !url.startsWith('https://'));
      };

      const questionPayload: any = {
          content: q.content,
          options: validOptions.map(opt => {
              const optionPayload: any = {
                  content: (opt.content && opt.content.trim()) || "",
                  images: mapAndFilterImageUrls(opt.images)
              };
              if (isEditMode && opt.id) {
                  optionPayload.id = opt.id;
              }
              return optionPayload;
          }),
          answer: q.answer === undefined ? null : q.answer,
          images: mapAndFilterImageUrls(q.images),
          explanationImages: mapAndFilterImageUrls(q.explanationImages),
          tags: [...customTagsArray, ...basicTags],
      };

      if (q.explanation && q.explanation.trim()) {
          questionPayload.explanation = q.explanation.trim();
      }

      if (isEditMode && q.id) {
          questionPayload.id = q.id;
      }

      return questionPayload;
    });
    // --- End Data Transformation ---

    const questionsToSend = finalQuestionsData.filter(q => q.content.trim() !== '');
    if (questionsToSend.length === 0) {
         toast({ title: "내용 없음", description: "제출할 문제 내용이 없습니다.", variant: "warning" });
         setIsSubmitting(false);
         return;
    }

    const baseApiPayload = {
      examInfo: {
          examName: data.examInfo.examName.trim(),
          year: data.examInfo.year.trim(),
          session: data.examInfo.session.trim(),
          ...(data.examInfo.subject?.trim() && { subject: data.examInfo.subject.trim() })
      },
      questions: questionsToSend
    };

    try {
      const url = apiUrl || '/api/questions';
      let method = apiMethod;
      const editingSingleQuestionId = isEditMode && initialData?.questions?.length === 1 && initialData.questions[0].id;

      if (!method) {
        method = editingSingleQuestionId ? 'PATCH' : 'POST';
      }

      let finalApiPayload: any = baseApiPayload;

       if ((method === 'PATCH' || method === 'PUT') && editingSingleQuestionId) {
           if (baseApiPayload.questions && baseApiPayload.questions.length > 0) {
              finalApiPayload = baseApiPayload.questions[0];
           } else {
              throw new Error("수정할 질문 데이터를 찾을 수 없습니다.");
           }
       } else if (method === 'POST') {
          finalApiPayload.questions = finalApiPayload.questions.map(({ id: questionId, options, ...restQuestion }: {id?: string, options: any[]}) => ({
              ...restQuestion,
              options: options.map(({ id: optionId, ...restOption }: {id?: string}) => restOption)
          }));
       }

      const body = JSON.stringify(finalApiPayload);
      console.log(`API 요청 (${method} ${url}):`, JSON.parse(body));
      const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body });

      if (!response.ok) {
        let errorData = { error: `HTTP ${response.status} - 응답 본문 파싱 불가` };
        try {
             errorData = await response.json();
        } catch (parseError) {
             console.error("Failed to parse error response body as JSON");
        }
        console.error("Full API Error Response Body:", JSON.stringify(errorData, null, 2));

        const errorMessage = errorData.error || (errorData as any).message || `서버 오류 (${response.status})`;
        throw new Error(errorMessage);
      }

      toast({ title: isEditMode ? "수정 완료" : "등록 완료", description: "문제가 성공적으로 저장되었습니다.", variant: "success" });
      if (onSuccess) onSuccess();
      // router.push("/admin/questions"); // Example navigation
      // form.reset(); // Consider if resetting is desired

    } catch (error) {
      console.error("Submit Error Object:", error);
      toast({ title: isEditMode ? "수정 실패" : "등록 실패", description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Exam Info Section */}
        <div className="space-y-4 p-4 border rounded-md">
            <h3 className="text-lg font-medium">시험 정보</h3>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                control={form.control}
                name="examInfo.examName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>시험명</FormLabel>
                    <FormControl>
                        <Input placeholder="예: 정보처리기사" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="examInfo.year"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>년도</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="예: 2024" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="examInfo.session"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>회차</FormLabel>
                    <FormControl>
                        <Input placeholder="예: 1회" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="examInfo.subject"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>과목 (선택)</FormLabel>
                    <FormControl>
                        <Input placeholder="예: 데이터베이스" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
        </div>


        {/* Questions Section */}
        {questionFields.map((questionField, index) => (
             <div key={questionField.id} className="border rounded-md relative group">
                 {/* Remove Question Button (Top Right) */}
                 {questionFields.length > 1 && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 z-10 text-muted-foreground hover:text-destructive opacity-50 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeQuestion(index)}
                        aria-label={`문제 ${index + 1} 삭제`}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                  )}
          <QuestionForm
            control={form.control}
            index={index}
            questionImages={getQuestionImages(index)}
            explanationImages={getExplanationImages(index)}
            answerValue={form.watch(`questions.${index}.answer`)}
            onAddOption={handleAddOption}
            onRemoveOption={handleRemoveOption}
            onImageUpload={handleImageUpload}
            onImageRemove={handleImageRemove}
            onImageUrlAdd={handleImageUrlAdd}
            onAnswerChange={handleAnswerChange}
            getOptionImages={getOptionImages}
          />
          {/* Custom Tags Section */}
          <div className="p-4 border-t">
              <Label htmlFor={`custom-tags-${index}`} className="text-sm font-medium">사용자 정의 태그 (선택, 최대 10개)</Label>
              <div className="flex items-center gap-2 mt-1">
                   <Input
                      id={`custom-tags-${index}`}
                      placeholder="태그 입력 후 Enter 또는 버튼 클릭"
                      value={tagInputQuestionIndex === index ? tagInput : ""}
                      onChange={(e) => handleCustomTagChange(e, index)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag(index); } }}
                      className="flex-grow"
                  />
                  <Button type="button" size="sm" onClick={() => addCustomTag(index)} disabled={tagInputQuestionIndex !== index || !tagInput.trim()}>
                       태그 추가
                   </Button>
              </div>
               <div className="flex flex-wrap gap-1 mt-2">
                    {(form.watch(`questions.${index}.customTags`) || []).map((tag, tagIndex) => (
                       <Badge key={tagIndex} variant="secondary">
                           {tag}
                           <button type="button" onClick={() => removeCustomTag(index, tagIndex)} className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2" aria-label={`태그 ${tag} 삭제`}>
                               <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                           </button>
                       </Badge>
                   ))}
               </div>
               <FormMessage>{errors.questions?.[index]?.customTags?.message}</FormMessage>
           </div>
          </div>
        ))}

        {/* Add/Remove Question Buttons */}
        <div className="flex justify-between items-center mt-4">
             <Button type="button" variant="outline" onClick={handleAddNewQuestion} disabled={questionFields.length >= 20}>
                  <Plus className="mr-2 h-4 w-4" /> 새 문제 추가하기
             </Button>
             {questionFields.length > 1 && (
                 <Button
                     type="button"
                     variant="ghost"
                     className="text-destructive hover:text-destructive"
                     onClick={() => removeQuestion(questionFields.length - 1)}
                 >
                     <Trash2 className="mr-2 h-4 w-4" /> 마지막 문제 삭제
                 </Button>
              )}
          </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={!isValid || isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? "등록 중..." : (isEditMode ? "수정 완료" : "문제 등록 완료")}
          </Button>
        </div>
      </form>
    </Form>
  );
} 