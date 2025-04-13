import { useState } from 'react';
import { IParsedQuestion, ITag } from '../types';

export function useTagState(
  parsedQuestions: IParsedQuestion[], 
  setParsedQuestions: React.Dispatch<React.SetStateAction<IParsedQuestion[]>>
) {
  const [globalTags, setGlobalTags] = useState<string[]>([]);
  const [globalTagInput, setGlobalTagInput] = useState("");
  const [questionTagInput, setQuestionTagInput] = useState("");
  const [examName, setExamName] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [session, setSession] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(-1);
  
  // 문자열을 ITag 객체로 변환하는 헬퍼 함수
  const createTagObject = (tagName: string): ITag => ({
    id: `tag-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: tagName,
    color: 'gray'
  });
  
  // 글로벌 태그 추가 함수
  const addGlobalTag = () => {
    const trimmedInput = globalTagInput.trim();
    if (trimmedInput === '') return;
    
    // 중복 태그 확인
    if (!globalTags.includes(trimmedInput)) {
      const newTags = [...globalTags, trimmedInput];
      setGlobalTags(newTags);
      
      // 이미 파싱된 문제에도 글로벌 태그 추가
      if (parsedQuestions.length > 0) {
        setParsedQuestions(prev => prev.map(q => {
          // 기존 문제에 같은 태그가 있는지 확인
          const tagExists = q.tags.some(tag => tag.name === trimmedInput);
          if (tagExists) return q;
          
          const tagObject = createTagObject(trimmedInput);
          return {
            ...q,
            tags: [...q.tags, tagObject]
          };
        }));
      }
    }
    
    // 입력 필드 초기화 (한글 중복 입력 방지)
    setGlobalTagInput('');
  };
  
  // 글로벌 태그 삭제 함수
  const removeGlobalTag = (tagToRemove: string) => {
    const newTags = globalTags.filter(tag => tag !== tagToRemove);
    setGlobalTags(newTags);
    
    // 이미 파싱된 문제에서도 해당 태그 제거
    if (parsedQuestions.length > 0) {
      setParsedQuestions(prev => prev.map(q => ({
        ...q,
        tags: q.tags.filter(tag => tag.name !== tagToRemove)
      })));
    }
  };
  
  // 문제별 태그 추가 함수
  const addQuestionTag = (questionIndex: number) => {
    const trimmedInput = questionTagInput.trim();
    if (trimmedInput === '') return;
    
    setParsedQuestions(prev => {
      const updated = [...prev];
      const currentTags = updated[questionIndex].tags;
      const tagExists = currentTags.some(tag => tag.name === trimmedInput);
      
      if (!tagExists) {
        const newTag = createTagObject(trimmedInput);
        updated[questionIndex].tags = [...currentTags, newTag];
      }
      
      return updated;
    });
    
    // 입력 필드 초기화 (한글 중복 입력 방지)
    setQuestionTagInput('');
  };
  
  // 문제별 태그 삭제 함수
  const removeQuestionTag = (questionIndex: number, tagToRemove: string) => {
    setParsedQuestions(prev => {
      const updated = [...prev];
      updated[questionIndex].tags = updated[questionIndex].tags.filter(
        tag => tag.name !== tagToRemove
      );
      return updated;
    });
  };
  
  // 기본 태그(시험명, 년도, 회차, 과목) 적용 함수
  const applyBasicTags = () => {
    // 필수 태그 유효성 검사
    const isExamNameValid = !!examName.trim();
    const isYearValid = !!year.trim();
    const isSessionValid = !!session.trim();
    
    // 필수 태그 부족한 경우 처리
    if (!isExamNameValid || !isYearValid || !isSessionValid) {
      // 알림창 표시
      alert("필수 태그를 모두 입력해주세요.\n시험명, 년도, 회차는 필수 입력 항목입니다.");
      return false; // 필수 태그가 비어있으면 적용하지 않음
    }
    
    const tagsToAdd: string[] = [];
    
    // 필수 태그 추가
    tagsToAdd.push(`시험명:${examName.trim()}`);
    tagsToAdd.push(`년도:${year.trim()}`);
    tagsToAdd.push(`회차:${session.trim()}`);
    
    // 과목은 선택 사항 - 입력된 경우에만 추가
    if (subject.trim()) {
      tagsToAdd.push(`과목:${subject.trim()}`);
    }
    
    // 새 태그 추가 (기존 태그 중 기본 태그가 아닌 것만 유지)
    const newGlobalTags = [
      ...globalTags.filter(tag => !tag.startsWith('시험명:') && !tag.startsWith('년도:') && 
                            !tag.startsWith('회차:') && !tag.startsWith('과목:')),
      ...tagsToAdd
    ];
    
    setGlobalTags(newGlobalTags);
    
    // 이미 파싱된 문제에도 적용
    if (parsedQuestions.length > 0) {
      setParsedQuestions(prev => prev.map(q => {
        // 기존 태그에서 기본 태그(시험명, 년도, 회차, 과목) 제거
        const filteredTags = q.tags.filter(tag => 
          !(tag.name.startsWith('시험명:') || tag.name.startsWith('년도:') || 
            tag.name.startsWith('회차:') || tag.name.startsWith('과목:'))
        );
        
        // 새 기본 태그를 ITag 객체로 변환
        const newTagObjects = tagsToAdd.map(createTagObject);
        
        return {
          ...q,
          tags: [...filteredTags, ...newTagObjects]
        };
      }));
    }
    
    console.log("기본 태그 적용 완료:", tagsToAdd);
    return true;
  };
  
  return {
    globalTags,
    globalTagInput,
    setGlobalTagInput,
    questionTagInput,
    setQuestionTagInput,
    examName,
    setExamName,
    year,
    setYear,
    session,
    setSession,
    subject,
    setSubject,
    selectedQuestionIndex,
    setSelectedQuestionIndex,
    addGlobalTag,
    removeGlobalTag,
    addQuestionTag,
    removeQuestionTag,
    applyBasicTags
  };
} 