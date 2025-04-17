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
  id?: string;
  content: string;
  options: string[];
  answer: number;
  explanation?: string | null;
  images?: string[];
  explanationImages?: string[];
  tags?: string[];
  userId?: string;
  createdAt?: Date;
  updatedAt?: Date;
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

// 시험 인스턴스 인터페이스 (API 응답용)
export interface IExamInstance {
  examName: string;
  year: string;
  session: string;
  questionCount: number;
}

// 확장된 Toast 타입 정의
export type ToastType = "default" | "destructive" | "success" | "warning";