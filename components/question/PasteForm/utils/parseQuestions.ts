import { v4 as uuidv4 } from "uuid";
import { IOption, IParsedQuestion } from "../types";

/**
 * 텍스트에서 문제를 파싱하는 개선된 함수
 * @param text 파싱할 텍스트
 * @returns 파싱된 문제 배열
 */
export const parseQuestionsImproved = (text: string): IParsedQuestion[] => {
  // 줄바꿈으로 텍스트 분할
  const lines = text.split("\n").map(line => line.trim()).filter(line => line.length > 0);
  
  const questions: IParsedQuestion[] = [];
  let currentQuestion: Partial<IParsedQuestion> | null = null;
  let optionIndex = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 문제 번호 확인 (예: "1.", "1. ", "1 ", "문제 1.", "문제 1 ")
    const questionNumberMatch = line.match(/^(?:문제\s*)?(\d+)[\s\.\)]/) || 
                               line.match(/^(\d+)[.)]?\s+/);
    
    if (questionNumberMatch) {
      // 이전 문제가 있으면 저장
      if (currentQuestion && currentQuestion.content && currentQuestion.options && currentQuestion.options.length > 0) {
        questions.push(currentQuestion as IParsedQuestion);
      }
      
      // 새 문제 초기화
      currentQuestion = {
        id: uuidv4(),
        number: Number(questionNumberMatch[1]),
        content: line.replace(questionNumberMatch[0], "").trim(),
        options: [],
        answer: -1,
        tags: [],
        images: [],
        explanationImages: []
      };
      optionIndex = 0;
      continue;
    }
    
    // 현재 처리 중인 문제가 없으면 건너뜀
    if (!currentQuestion) continue;

    // 문제 내용이 여러 줄인 경우
    if (currentQuestion.content && currentQuestion.options.length === 0) {
      // 선택지 시작 확인
      const optionMatch = line.match(/^(?:①|②|③|④|⑤|\(?[1-5]\)|\(?[ㄱ-ㅎ]\)|\(?[a-e]\)|\(?[A-E]\))/);
      if (!optionMatch) {
        // 선택지가 아닌 경우, 문제 내용에 추가
        currentQuestion.content += "\n" + line;
        continue;
      }
    }
    
    // 선택지 확인
    const optionMatch = line.match(/^(?:①|②|③|④|⑤|\(?[1-5]\)|\(?[ㄱ-ㅎ]\)|\(?[a-e]\)|\(?[A-E]\))/);
    
    if (optionMatch) {
      optionIndex++;
      const optionContent = line.replace(optionMatch[0], "").trim();
      
      if (currentQuestion) {
        if (!currentQuestion.options) {
          currentQuestion.options = [];
        }
        currentQuestion.options.push({
          id: uuidv4(),
          content: optionContent
        });
      }
      continue;
    }
    
    // 정답 확인
    const answerMatch = line.match(/^(?:정답|answer)[:\s]*(?:①|②|③|④|⑤|\(?[1-5]\)|\(?[ㄱ-ㅎ]\)|\(?[a-e]\)|\(?[A-E]\))/i) ||
                       line.match(/^(?:정답|answer)[:\s]*([1-5])/i);
    
    if (answerMatch) {
      const answerText = line.replace(/^(?:정답|answer)[:\s]*/i, "").trim();
      
      // 정답 번호 추출 (①, ②, ... 또는 1, 2, ... 또는 ㄱ, ㄴ, ... 또는 a, b, ... 또는 A, B, ...)
      let answerNumber = -1;
      
      if (answerText.includes("①") || answerText.includes("1") || 
          answerText.includes("ㄱ") || answerText.includes("a") || answerText.includes("A")) {
        answerNumber = 0;
      } else if (answerText.includes("②") || answerText.includes("2") || 
                answerText.includes("ㄴ") || answerText.includes("b") || answerText.includes("B")) {
        answerNumber = 1;
      } else if (answerText.includes("③") || answerText.includes("3") || 
                answerText.includes("ㄷ") || answerText.includes("c") || answerText.includes("C")) {
        answerNumber = 2;
      } else if (answerText.includes("④") || answerText.includes("4") || 
                answerText.includes("ㄹ") || answerText.includes("d") || answerText.includes("D")) {
        answerNumber = 3;
      } else if (answerText.includes("⑤") || answerText.includes("5") || 
                answerText.includes("ㅁ") || answerText.includes("e") || answerText.includes("E")) {
        answerNumber = 4;
      }
      
      if (currentQuestion) {
        currentQuestion.answer = answerNumber;
      }
      continue;
    }
    
    // 해설 확인
    const explanationMatch = line.match(/^(?:해설|설명|explanation)[:\s]*/i);
    
    if (explanationMatch) {
      const explanationContent = line.replace(explanationMatch[0], "").trim();
      
      if (currentQuestion) {
        currentQuestion.explanation = explanationContent;
      }
      continue;
    }
    
    // 해설 내용 추가
    if (currentQuestion && currentQuestion.explanation) {
      currentQuestion.explanation += "\n" + line;
    }
  }
  
  // 마지막 문제 추가
  if (currentQuestion && currentQuestion.content && currentQuestion.options && currentQuestion.options.length > 0) {
    questions.push(currentQuestion as IParsedQuestion);
  }
  
  return questions;
}; 