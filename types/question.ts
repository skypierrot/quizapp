// types/question.ts
// 문제 관련 타입 정의

/**
 * 질문 옵션 인터페이스
 */
export interface IOption {
  id: string;
  content: string;
  images?: { url: string; hash: string }[];
}

/**
 * 태그 인터페이스
 */
export interface ITag {
  id: string;
  name: string;
  color: string;
}

/**
 * 이미지 타입 정의
 * 'question': 문제 이미지
 * 'explanation': 설명 이미지
 * 'option': 선택지 이미지
 */
export type ImageType = 'question' | 'explanation' | 'option';

/**
 * 문제 이미지 인터페이스
 */
export interface IQuestionImage {
  id: number;
  path: string;
  type: ImageType;
}

/**
 * 파싱된 문제 인터페이스
 * 문제 붙여넣기 기능에서 사용
 */
export interface IParsedQuestion {
  id?: string; // 선택적 필드로 변경
  number?: number; // 선택적 필드로 변경
  content: string; // text -> content로 통일
  options: IOption[];
  answer: number | null;
  tags: ITag[];
  images: { url: string; hash: string }[];
  explanationImages: { url: string; hash: string }[];
  examples?: string[];
  explanation?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * 이미지 업로드 함수의 결과 인터페이스
 */
export interface IImageUploadResult {
  success: boolean;
  message: string;
  imageUrl?: string;
}

/**
 * 이미지 업로드 유틸리티 함수의 파라미터 인터페이스
 */
export interface IImageUploadParams {
  file: File;
  maxSize?: number; // MB 단위
  type?: ImageType;
} 