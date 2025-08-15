import { IQuestion, IOption } from '../types';

// 선택지 번호 변환 (①, ② -> 1, 2)
function getOptionNumber(symbol: string): number {
  const mapping: { [key: string]: number } = {
    '①': 1, '②': 2, '③': 3, '④': 4, '⑤': 5,
    '⑥': 6, '⑦': 7, '⑧': 8, '⑨': 9, '⑩': 10
  };
  return mapping[symbol] || 0;
}

/**
 * 텍스트에서 문제를 분석하는 함수
 * @param text 분석할 텍스트
 * @returns 분석된 문제 배열과 오류 메시지 배열
 */
export function parseQuestions(text: string): { questions: IQuestion[], errors: string[] } {
  // 개선된 문제 파싱 로직으로 대체
  return parseQuestionsImproved(text);
}

/**
 * 개선된 문제 분석 함수 - 더 명확한 문제 구분
 * @param text 분석할 텍스트
 */
export function parseQuestionsImproved(text: string): { questions: IQuestion[], errors: string[] } {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  const questions: IQuestion[] = [];
  const errors: string[] = [];
  
  let currentQuestion: Partial<IQuestion> = {};
  let questionCounter = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    
    // 새로운 문제 시작 (숫자. 으로 시작하는 줄)
    const questionStartMatch = line.match(/^(\d+)\.\s*(.+)/);
    if (questionStartMatch) {
      // 이전 문제가 있으면 저장
      if (Object.keys(currentQuestion).length > 0) {
        if (!currentQuestion.content) {
          errors.push(`문제 ${questionCounter}: 문제 내용이 없습니다.`);
        } else if (!currentQuestion.options || currentQuestion.options.length === 0) {
          errors.push(`문제 ${questionCounter}: 선택지가 없습니다.`);
        } else {
          questions.push(currentQuestion as IQuestion);
        }
      }
      
      // 새 문제 시작
      if (questionStartMatch && questionStartMatch[1]) {
        questionCounter = parseInt(questionStartMatch[1]);
        currentQuestion = {
          content: questionStartMatch[2] || '',
          options: [],
          answer: -1, // 정답 미선택 상태로 초기화
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      continue;
    }
    
    // 보기 섹션 시작 패턴 - examples 속성은 IQuestion에 없으므로 제거
    if (line.match(/^\s*<보기>|^\s*\[보기\]|^\s*\(보기\)|^\s*보\s*기/)) {
      // examples 속성은 사용하지 않음
      continue;
    }
    
    // 보기 항목 처리 - examples 속성 사용 제거
    // 선택지 확인 - 원형 숫자만 인식
    const optionMatch = line.match(/^\s*([①-⑩])\s*(.*)/);
    
    if (optionMatch) {
      const optionSymbol = optionMatch[1]; // ①, ②, ③ 등
      const optionText = optionMatch[2]?.trim() || '';
      
      currentQuestion.options = currentQuestion.options || [];
      if (optionSymbol) {
        currentQuestion.options.push({
          number: getOptionNumber(optionSymbol),
          text: optionText,
          images: []
        });
      }
      
      continue;
    }
    
    // 선택지가 이미 있으면 마지막 선택지에 내용 추가
    if (currentQuestion.options && currentQuestion.options.length > 0) {
      const lastOptionIndex = currentQuestion.options.length - 1;
      const lastOption = currentQuestion.options[lastOptionIndex];
      if (lastOption) {
        lastOption.text += ' ' + line;
      }
    } else {
      // 문제 내용에 추가
      currentQuestion.content = (currentQuestion.content || '') + ' ' + line;
    }
  }
  
  // 마지막 문제 처리
  if (Object.keys(currentQuestion).length > 0) {
    if (!currentQuestion.content) {
      errors.push(`문제 ${questionCounter}: 문제 내용이 없습니다.`);
    } else if (!currentQuestion.options || currentQuestion.options.length === 0) {
      errors.push(`문제 ${questionCounter}: 선택지가 없습니다.`);
    } else {
      questions.push(currentQuestion as IQuestion);
    }
  }
  
  return { questions, errors };
}

/**
 * 한글 옵션(ㄱ, ㄴ, ㄷ, ㄹ)이 포함된 문제 파싱
 * 원형 숫자(①, ②, ③ 등)로 표시된 선택지만 인식
 */
export function parseQuestionsWithKoreanOptions(text: string): { questions: IQuestion[], errors: string[] } {
  const lines = text.split('\n');
  const questions: IQuestion[] = [];
  const errors: string[] = [];
  
  // 현재 처리 중인 문제 객체
  let currentQuestion: IQuestion | null = null;
  
  // 문제 번호 패턴: 숫자로 시작하고 마침표 또는 콜론이 올 수 있음
  const questionPattern = /^\s*(\d+)[\.\:]?\s*(.*)/;
  
  // 선택지 패턴 - 원형 숫자만 인식
  const optionPattern = /^\s*([①-⑩])\s*(.*)/;
  
  // 보기 패턴 - ㄱ, ㄴ, ㄷ, ㄹ
  const examplePattern = /^\s*(ㄱ|ㄴ|ㄷ|ㄹ)\s*[\.:]?\s*(.*)/;
  
  // 보기 섹션 시작 패턴
  const exampleSectionPattern = /^\s*<보기>|^\s*\[보기\]|^\s*\(보기\)|^\s*보\s*기/;
  
  let examples: string[] = [];
  let isInExampleSection = false;
  let currentExampleLabel = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim();
    if (!line) continue;
    
    // 문제 시작 여부 확인
    const questionMatch = line.match(questionPattern);
    
    if (questionMatch) {
      // 이전 문제가 있으면 추가
      if (currentQuestion) {
        questions.push(currentQuestion);
      }
      
      // 새 문제 시작
      const questionNumber = parseInt(questionMatch[1] || '0');
      const questionContent = questionMatch[2];
      
      currentQuestion = {
        id: (Date.now() + questionNumber).toString(), // 임시 ID 생성 - string으로 변환
        questionNumber: questionNumber,
        content: questionContent?.trim() || '',
        options: [],
        answer: -1, // 기본값 설정
        images: [], // 기본값 설정
        explanationImages: [], // 기본값 설정
        tags: [], // 기본값 설정
      };
      
      // 보기 섹션 초기화
      examples = [];
      isInExampleSection = false;
      currentExampleLabel = '';
      
      continue;
    }
    
    if (!currentQuestion) continue;
    
    // 보기 섹션 시작 여부 확인
    if (exampleSectionPattern.test(line)) {
      isInExampleSection = true;
      examples = ['', '', '', '']; // ㄱ, ㄴ, ㄷ, ㄹ에 해당하는 보기 내용
      continue;
    }
    
    // 보기 항목 처리
    if (isInExampleSection) {
      const exampleMatch = line.match(examplePattern);
      
      if (exampleMatch && exampleMatch[1] && exampleMatch[2]) {
        currentExampleLabel = exampleMatch[1];
        const exampleContent = exampleMatch[2].trim();
        
        let index = -1;
        switch (currentExampleLabel) {
          case 'ㄱ': index = 0; break;
          case 'ㄴ': index = 1; break;
          case 'ㄷ': index = 2; break;
          case 'ㄹ': index = 3; break;
        }
        
        if (index >= 0 && index < examples.length) {
          examples[index] = exampleContent;
        }
        
        continue;
      }
      
      // 보기 라벨이 있으면 해당 보기 내용에 추가
      let index = -1;
      switch (currentExampleLabel) {
        case 'ㄱ': index = 0; break;
        case 'ㄴ': index = 1; break;
        case 'ㄷ': index = 2; break;
        case 'ㄹ': index = 3; break;
      }
      
      if (index >= 0 && index < examples.length) {
        examples[index] += ' ' + line;
      } else if (index === -1) {
        // 일반 문제 내용에 추가
        if (currentQuestion.content) {
          currentQuestion.content += ' ' + line;
        }
      }
    } else {
      // 선택지 확인 - 원형 숫자만 인식
      const optionMatch = line.match(optionPattern);
      
      if (optionMatch) {
        const optionSymbol = optionMatch[1]; // ①, ②, ③ 등
        const optionText = optionMatch[2]?.trim() || '';
        
        if (optionSymbol) {
          currentQuestion.options.push({
            number: getOptionNumber(optionSymbol),
            text: optionText,
            images: []
          });
        }
        
        continue;
      }
      
      // 선택지가 이미 있으면 마지막 선택지에 내용 추가
      if (currentQuestion.options && currentQuestion.options.length > 0) {
        const lastOptionIndex = currentQuestion.options.length - 1;
        const lastOption = currentQuestion.options[lastOptionIndex];
        if (lastOption) {
          lastOption.text += ' ' + line;
        }
      } else {
        // 문제 내용에 추가
        if (currentQuestion.content) {
          currentQuestion.content += ' ' + line;
        }
      }
    }
  }
  
  // 마지막 문제 추가
  if (currentQuestion) {
    questions.push(currentQuestion);
  }
  
  // 검증
  questions.forEach((q, i) => {
    if (q.options && q.options.length === 0) {
      errors.push(`문제 ${q.questionNumber || i + 1}: 선택지가 없습니다.`);
    }
  });
  
  return { questions, errors };
}

/**
 * 전체 텍스트를 개별 문제 블록으로 분리
 * 개선된 문제 경계 인식 알고리즘 적용
 */
function separateQuestionBlocks(text: string): string[] {
  const lines = text.split('\n');
  const blocks: string[] = [];
  
  let currentBlock: string[] = [];
  // 문제 번호 패턴: 숫자로 시작하고 마침표 또는 콜론이 올 수 있음
  const questionNumberPattern = /^\s*(\d+)[\.\:]?\s*(.*)/;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim();
    
    // 빈 줄 여러 개 건너뛰기
    if (!line && currentBlock.length === 0) {
      continue;
    }
    
    const isNewQuestion = line && questionNumberPattern.test(line) && 
                        // 숫자로 시작하지만 내용이 짧으면 문제로 간주하지 않음 (예: "1.")
                        line.replace(questionNumberPattern, '$2').length > 0;
    
    // 새 문제 시작이고 이전 내용이 있으면 블록 저장
    if (isNewQuestion && currentBlock.length > 0) {
      blocks.push(currentBlock.join('\n'));
      currentBlock = [];
    }
    
        const currentLine = lines[i];
        if (currentLine && typeof currentLine === 'string') {
          currentBlock.push(currentLine);
        }
  }
  
  // 마지막 블록 추가
  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join('\n'));
  }
  
  return blocks;
}

/**
 * 단일 문제 블록 분석
 * 원형 숫자(①, ②, ③ 등)로 표시된 선택지만 인식
 */
function parseQuestionBlock(block: string, expectedNumber: number): { 
  question: IQuestion | null, 
  errors: string[] 
} {
  const lines = block.split('\n');
  const errors: string[] = [];
  
  // 문제 번호와 내용 파싱
  const questionPattern = /^\s*(\d+)[\.\:]?\s*(.*)/;
  const questionMatch = lines[0]?.trim().match(questionPattern);
  
  if (!questionMatch) {
    errors.push(`문제 ${expectedNumber}: 올바른 문제 형식이 아닙니다.`);
    return { question: null, errors };
  }
  
  const questionNumber = parseInt(questionMatch[1] || '0');
  let questionContent = questionMatch[2] || '';
  
  // 선택지 패턴 - 원형 숫자만 인식
  const optionPattern = /^\s*([①-⑩])\s*(.*)/;
  const options: IOption[] = [];
  let currentLine = 1;
  
  // 문제 내용 수집 (선택지 전까지)
  while (currentLine < lines.length) {
    const line = lines[currentLine]?.trim();
    if (!line) {
      currentLine++;
      continue;
    }
    
    if (optionPattern.test(line)) {
      break;
    }
    
    questionContent += '\n' + line;
    currentLine++;
  }
  
  // 선택지 파싱 - 원형 숫자만 인식
  let currentOption: IOption | null = null;
  
  while (currentLine < lines.length) {
    const line = lines[currentLine]?.trim();
    currentLine++;
    
    if (!line) continue;
    
    const optionMatch = line.match(optionPattern);
    if (optionMatch) {
      if (currentOption) {
        options.push(currentOption);
      }
      
      const optionSymbol = optionMatch[1]; // ①, ②, ③ 등
      const optionText = optionMatch[2];
      
      if (optionSymbol && optionText) {
        const optionNumber = getOptionNumber(optionSymbol);
        
        currentOption = {
          number: optionNumber,
          text: optionText,
          images: []
        };
      }
    } else if (currentOption) {
      // 선택지 내용 추가
      currentOption.text += '\n' + line;
    }
  }
  
  // 마지막 선택지 추가
  if (currentOption) {
    options.push(currentOption);
  }
  
  // 검증
  if (options.length === 0) {
    errors.push(`문제 ${questionNumber}: 선택지가 없습니다.`);
  }
  
  const question: IQuestion = {
    id: (Date.now() + expectedNumber).toString(),
    questionNumber: questionNumber,
    content: questionContent?.trim() || '',
    options,
    answer: -1, // 기본값 설정
    images: [], // 기본값 설정
    explanationImages: [], // 기본값 설정
    tags: [], // 기본값 설정
  };
  
  return { question, errors };
} 