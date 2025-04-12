import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { IParsedQuestion } from "../types";
import { ITag } from "./tagUtils";

/**
 * 새로운 빈 질문 객체 생성
 * @returns 기본값이 설정된 질문 객체
 */
export const createEmptyQuestion = (): IParsedQuestion => {
  return {
    id: uuidv4(),
    number: 0,
    content: "",
    options: ["", "", "", ""],
    answer: null,
    tags: [],
    images: [],
    explanationImages: [],
    explanation: "",
  };
};

/**
 * 질문 목록에 새 질문 추가
 * @param questions 현재 질문 목록
 * @returns 업데이트된 질문 목록
 */
export const addQuestion = (questions: IParsedQuestion[]): IParsedQuestion[] => {
  const newQuestion = createEmptyQuestion();
  // 질문 번호 자동 설정
  newQuestion.number = questions.length + 1;
  return [...questions, newQuestion];
};

/**
 * 질문 삭제 및 번호 재정렬
 * @param questions 질문 목록
 * @param questionId 삭제할 질문 ID
 * @returns 업데이트된 질문 목록
 */
export const removeQuestion = (questions: IParsedQuestion[], questionId: string): IParsedQuestion[] => {
  const updatedQuestions = questions.filter(q => q.id !== questionId);
  
  // 번호 재정렬
  return updatedQuestions.map((q, index) => ({
    ...q,
    number: index + 1
  }));
};

/**
 * 질문 업데이트
 * @param questions 질문 목록
 * @param updatedQuestion 업데이트된 질문
 * @returns 업데이트된 질문 목록
 */
export const updateQuestion = (
  questions: IParsedQuestion[],
  updatedQuestion: IParsedQuestion
): IParsedQuestion[] => {
  return questions.map(q => 
    q.id === updatedQuestion.id ? updatedQuestion : q
  );
};

/**
 * 질문에 옵션 추가
 * @param question 현재 질문
 * @returns 옵션이 추가된 질문
 */
export const addOptionToQuestion = (question: IParsedQuestion): IParsedQuestion => {
  return {
    ...question,
    options: [...question.options, ""]
  };
};

/**
 * 질문에서 옵션 제거
 * @param question 현재 질문
 * @param optionIndex 제거할 옵션 인덱스
 * @returns 옵션이 제거된 질문
 */
export const removeOptionFromQuestion = (
  question: IParsedQuestion,
  optionIndex: number
): IParsedQuestion => {
  // 옵션이 4개 이하면 제거하지 않음
  if (question.options.length <= 4) {
    toast.error("최소 4개의 옵션이 필요합니다");
    return question;
  }

  const newOptions = question.options.filter((_, idx) => idx !== optionIndex);
  let newAnswer = question.answer;

  // 삭제한 옵션이 정답인 경우 정답을 null로 설정
  if (question.answer === optionIndex) {
    newAnswer = null;
    toast.warning("삭제한 옵션이 정답이었습니다. 새로운 정답을 선택해주세요.");
  } 
  // 삭제한 옵션보다 인덱스가 큰 정답인 경우 인덱스 조정
  else if (question.answer !== null && question.answer > optionIndex) {
    newAnswer = question.answer - 1;
  }

  return {
    ...question,
    options: newOptions,
    answer: newAnswer
  };
};

/**
 * 옵션 내용 업데이트
 * @param question 현재 질문
 * @param optionIndex 업데이트할 옵션 인덱스
 * @param content 새 옵션 내용
 * @returns 업데이트된 질문
 */
export const updateOptionContent = (
  question: IParsedQuestion,
  optionIndex: number,
  content: string
): IParsedQuestion => {
  const newOptions = [...question.options];
  newOptions[optionIndex] = content;

  return {
    ...question,
    options: newOptions
  };
};

/**
 * 질문에 태그 추가
 * @param question 현재 질문
 * @param tag 추가할 태그
 * @returns 태그가 추가된 질문
 */
export const addTagToQuestion = (
  question: IParsedQuestion,
  tag: ITag
): IParsedQuestion => {
  // 이미 같은 태그가 있는지 확인
  const exists = question.tags.some(t => t.text.toLowerCase() === tag.text.toLowerCase());
  if (exists) return question;

  return {
    ...question,
    tags: [...question.tags, tag]
  };
};

/**
 * 질문에서 태그 제거
 * @param question 현재 질문
 * @param tagId 제거할 태그 ID
 * @returns 태그가 제거된 질문
 */
export const removeTagFromQuestion = (
  question: IParsedQuestion,
  tagId: string
): IParsedQuestion => {
  return {
    ...question,
    tags: question.tags.filter(t => t.id !== tagId)
  };
};

/**
 * 질문의 정답 설정
 * @param question 현재 질문
 * @param answerIndex 정답 인덱스 (null인 경우 정답 취소)
 * @returns 정답이 설정된 질문
 */
export const setQuestionAnswer = (
  question: IParsedQuestion,
  answerIndex: number | null
): IParsedQuestion => {
  if (answerIndex !== null && (answerIndex < 0 || answerIndex >= question.options.length)) {
    toast.error("유효하지 않은 정답 인덱스입니다");
    return question;
  }

  if (answerIndex === question.answer) {
    // 같은 정답을 다시 클릭하면 정답 취소
    toast.info("정답 선택이 취소되었습니다");
    return {
      ...question,
      answer: null
    };
  }

  if (answerIndex !== null) {
    toast.success(`${String.fromCharCode(65 + answerIndex)}번이 정답으로 선택되었습니다`);
  }

  return {
    ...question,
    answer: answerIndex
  };
};

/**
 * 질문에 이미지 추가
 * @param question 현재 질문
 * @param imageUrl 이미지 URL
 * @param isExplanation 설명 이미지 여부
 * @returns 이미지가 추가된 질문
 */
export const addImageToQuestion = (
  question: IParsedQuestion,
  imageUrl: string,
  isExplanation: boolean = false
): IParsedQuestion => {
  if (isExplanation) {
    return {
      ...question,
      explanationImages: [...question.explanationImages, imageUrl]
    };
  }
  return {
    ...question,
    images: [...question.images, imageUrl]
  };
};

/**
 * 질문에서 이미지 제거
 * @param question 현재 질문
 * @param imageUrl 제거할 이미지 URL
 * @param isExplanation 설명 이미지 여부
 * @returns 이미지가 제거된 질문
 */
export const removeImageFromQuestion = (
  question: IParsedQuestion,
  imageUrl: string,
  isExplanation: boolean = false
): IParsedQuestion => {
  if (isExplanation) {
    return {
      ...question,
      explanationImages: question.explanationImages.filter(url => url !== imageUrl)
    };
  }
  return {
    ...question,
    images: question.images.filter(url => url !== imageUrl)
  };
}; 