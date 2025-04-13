// 사용자 인터페이스
export interface IUser {
  id: string;
  name: string;
  email: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 시험 인터페이스
export interface IExam {
  id: string;
  title: string;
  year: number;
  subject: string;
  type: string;
  session: number;
  createdAt: Date;
  updatedAt: Date;
}

// 문제 인터페이스
export interface IQuestion {
  id: string | number;
  number: number;
  content: string;
  options: IOption[] | string[];
  answer: number;
  examples?: string[];
  explanation?: string;
  images: string[];
  explanationImages: string[];
  created_at?: Date;
  updated_at?: Date;
  tags?: string[];
}

export interface IOption {
  number: number;
  text: string;
  images?: string[];
}

export interface IQuestionImage {
  id?: number;
  path: string;
  type: 'question' | 'option' | 'explanation';
}

// 시험 결과 인터페이스
export interface IExamResult {
  id: string;
  userId: string;
  examId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number[];
  completedAt: Date;
  createdAt: Date;
}

// 확장된 Toast 타입 정의
export type ToastType = "default" | "destructive" | "success" | "warning";