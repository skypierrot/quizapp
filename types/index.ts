// 사용자 인터페이스
export interface IUser {
  id: string;
  name: string;
  email: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 시험 인터페이스 (스키마와 일치하도록 수정)
export interface IExam {
  id: string;
  name: string;
  date: string;
  round: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// 문제 인터페이스 - 스키마와 일치하도록 수정
export interface IQuestion {
  id: string; // 필수 필드로 변경
  content: string; // text -> content로 통일
  options: IOption[];
  answer: number;
  explanation?: string | null;
  images: { url: string; hash: string }[];
  explanationImages: { url: string; hash: string }[];
  tags: string[];
  userId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  examId?: string | null; // uuid 타입을 string으로 통일
  examName?: string | null;
  examDate?: string | null;
  examSubject?: string | null;
  questionNumber?: number | null;
}

export interface IOption {
  number: number;
  text: string;
  images: { url: string; hash: string }[];
}

export interface IManualQuestion {
  id?: string;
  number?: number;
  content: string; // text -> content로 통일
  options: IOption[];
  answer: number;
  images: { url: string; hash: string }[];
  explanation?: string;
  explanationImages: { url: string; hash: string }[];
  tags: string[];
  examId?: string;
  userId?: string;
  examName?: string;
  examDate?: string;
  examSubject?: string;
}

export interface IQuestionImage {
  id?: number;
  path: string;
  type: 'question' | 'option' | 'explanation';
}

// 시험 인스턴스 인터페이스 (API 응답용)
export interface IExamInstance {
  examName: string;
  year: string;
  date: string;
  subject: string;
  questionCount: number;
}

// 시험 즐겨찾기 인터페이스
export interface IExamFavorite {
  userId: string;
  examName: string;
  isFavorite: boolean;
  updatedAt: Date;
}

// 확장된 Toast 타입 정의
export type ToastType = "default" | "destructive" | "success" | "warning";

export * from './question';

// Exam Results Types
export interface IAnswerDetail {
  questionId: string;
  selectedOptionIndex: number | null;
  isCorrect: boolean;
}

export type INewExamResult = {
  userId: string;
  examName: string;
  examYear: number;
  examDate: string;
  examSubject: string;
  answers: IAnswerDetail[];
  score: number;
  correctCount: number;
  totalQuestions: number;
  elapsedTime: number;
  limitTime?: number;
  subjectStats?: Record<string, { correct: number; total: number }>;
};

export type IExamResult = INewExamResult & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

// 새로운 GroupedExamData 인터페이스 추가
export interface GroupedExamData {
  instances: IExamInstance[];
  uniqueDateCount: number;
}

// GroupedExams 인터페이스 수정
export interface GroupedExams {
  [examName: string]: GroupedExamData; // IExamInstance[] 대신 GroupedExamData 사용
}