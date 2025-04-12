// types.ts
import { ChangeEvent } from "react"
import { z } from "zod"

export interface IOption {
  id: string;
  content: string;
}

export interface IParsedQuestion {
  id: string;
  number: number;
  content: string;
  options: IOption[];
  answer: number | null;
  tags: ITag[];
  images: string[];
  explanationImages: string[];
  examples?: string[];
  explanation?: string;
  created_at?: string;
  updated_at?: string;
}

export interface IResponseData {
  success: boolean;
  message: string;
  questions?: IParsedQuestion[];
}

export interface ITag {
  id: string;
  name: string;
  color: string;
}

export interface IFormState {
  title: string;
  description: string;
  tags: ITag[];
  isPublic: boolean;
}

export interface ITagManagerProps {
  year: string;
  subject: string;
  session: string;
  setYear: (value: string) => void;
  setSubject: (value: string) => void;
  setSession: (value: string) => void;
  onApplyBasicTags: () => void;
  globalTags: string[];
  globalTagInput: string;
  setGlobalTagInput: (value: string) => void;
  onAddGlobalTag: () => void;
  onRemoveGlobalTag: (tag: string) => void;
}

export interface IPasteInputProps {
  pasteValue: string;
  setPasteValue: (value: string) => void;
  onPaste: (e: React.ClipboardEvent) => void;
  isPasteAreaFocused: boolean;
  setIsPasteAreaFocused: (value: boolean) => void;
  clipboardImage: string | null;
  setClipboardImage: (value: string | null) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  pasteExample: string;
}

export interface IQuestionItemProps {
  index: number;
  question: IParsedQuestion;
  isSelected: boolean;
  questionTagInput: string;
  setQuestionTagInput: (value: string) => void;
  explanationText: string;
  setExplanationText: (value: string) => void;
  onSetAnswer: (questionIndex: number, answerIndex: number) => void;
  onAddOption: (questionIndex: number) => void;
  onUpdateOption: (questionIndex: number, optionIndex: number, value: string) => void;
  onRemoveOption: (questionIndex: number, optionIndex: number) => void;
  onAddQuestionTag: () => void;
  onRemoveQuestionTag: (questionIndex: number, tag: string) => void;
  onAddImage: () => void;
  onAddExplanationImage: () => void;
  onAddExplanationText: () => void;
}

export interface IImageUploadProps {
  onUpload: (imageUrl: string) => void;
}

export interface IQuestionListProps {
  questions: IParsedQuestion[];
  selectedQuestionIndex: number;
  setSelectedQuestionIndex: (index: number) => void;
  questionTagInput: string;
  setQuestionTagInput: (value: string) => void;
  explanationText: string;
  setExplanationText: (value: string) => void;
  onSetAnswer: (questionIndex: number, answerIndex: number) => void;
  onAddOption: (questionIndex: number) => void;
  onUpdateOption: (questionIndex: number, optionIndex: number, value: string) => void;
  onRemoveOption: (questionIndex: number, optionIndex: number) => void;
  onAddQuestionTag: (questionIndex: number) => void;
  onRemoveQuestionTag: (questionIndex: number, tag: string) => void;
  onAddImage: (questionIndex: number) => void;
  onAddExplanationImage: (questionIndex: number) => void;
  onAddExplanationText: (questionIndex: number, text?: string) => void;
}

export interface IImageManagerProps {
  clipboardImage: string | null;
  setClipboardImage: (image: string | null) => void;
  onHandleImageUpload: (e: React.ChangeEvent<HTMLInputElement>, type: 'question' | 'option' | 'explanation') => void;
}

// Zod 스키마는 필요시 추가
export const TagSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "태그 이름은 필수입니다"),
  color: z.string().default("gray")
});

export const ParsedQuestionSchema = z.object({
  id: z.string(),
  number: z.number().int().positive(),
  content: z.string().min(1, "문제 내용은 필수입니다"),
  options: z.array(z.string()).min(2, "최소 2개 이상의 선택지가 필요합니다"),
  answer: z.number().nullable(),
  tags: z.array(TagSchema),
  images: z.array(z.string()),
  explanationImages: z.array(z.string()),
  examples: z.array(z.string()).optional(),
  explanation: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
}); 