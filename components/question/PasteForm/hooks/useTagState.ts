import { useState } from 'react';
import { IParsedQuestion } from '../types';

export function useTagState(
  parsedQuestions: IParsedQuestion[], 
  setParsedQuestions: React.Dispatch<React.SetStateAction<IParsedQuestion[]>>
) {
  const [globalTags, setGlobalTags] = useState<string[]>([]);
  const [globalTagInput, setGlobalTagInput] = useState("");
  const [questionTagInput, setQuestionTagInput] = useState("");
  const [year, setYear] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [session, setSession] = useState<string>("");
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(-1);
  
  // 글로벌 태그 추가 함수
  const addGlobalTag = () => {
    if (globalTagInput.trim() === '') return;
    
    if (!globalTags.includes(globalTagInput.trim())) {
      const newTags = [...globalTags, globalTagInput.trim()];
      setGlobalTags(newTags);
      
      // 이미 파싱된 문제에도 글로벌 태그 추가
      if (parsedQuestions.length > 0) {
        setParsedQuestions(prev => prev.map(q => ({
          ...q,
          tags: [...(q.tags || []), globalTagInput.trim()]
        })));
      }
    }
    
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
        tags: (q.tags || []).filter(tag => tag !== tagToRemove)
      })));
    }
  };
  
  // 문제별 태그 추가 함수
  const addQuestionTag = (questionIndex: number) => {
    if (questionTagInput.trim() === '') return;
    
    setParsedQuestions(prev => {
      const updated = [...prev];
      const currentTags = updated[questionIndex].tags || [];
      
      if (!currentTags.includes(questionTagInput.trim())) {
        updated[questionIndex].tags = [...currentTags, questionTagInput.trim()];
      }
      
      return updated;
    });
    
    setQuestionTagInput('');
  };
  
  // 문제별 태그 삭제 함수
  const removeQuestionTag = (questionIndex: number, tagToRemove: string) => {
    setParsedQuestions(prev => {
      const updated = [...prev];
      const currentTags = updated[questionIndex].tags || [];
      updated[questionIndex].tags = currentTags.filter(tag => tag !== tagToRemove);
      return updated;
    });
  };
  
  // 기본 태그(년도, 과목, 회차) 적용 함수
  const applyBasicTags = () => {
    const tagsToAdd: string[] = [];
    
    if (year.trim()) tagsToAdd.push(`년도:${year.trim()}`);
    if (subject.trim()) tagsToAdd.push(`과목:${subject.trim()}`);
    if (session.trim()) tagsToAdd.push(`회차:${session.trim()}`);
    
    if (tagsToAdd.length === 0) return;
    
    // 새 태그 추가
    const newGlobalTags = [
      ...globalTags.filter(tag => !tag.startsWith('년도:') && !tag.startsWith('과목:') && !tag.startsWith('회차:')),
      ...tagsToAdd
    ];
    
    setGlobalTags(newGlobalTags);
    
    // 이미 파싱된 문제에도 적용
    if (parsedQuestions.length > 0) {
      setParsedQuestions(prev => prev.map(q => {
        const currentTags = q.tags || [];
        const filteredTags = currentTags.filter(tag => 
          !tag.startsWith('년도:') && !tag.startsWith('과목:') && !tag.startsWith('회차:')
        );
        
        return {
          ...q,
          tags: [...filteredTags, ...tagsToAdd]
        };
      }));
    }
  };
  
  return {
    globalTags,
    globalTagInput,
    setGlobalTagInput,
    questionTagInput,
    setQuestionTagInput,
    year,
    setYear,
    subject,
    setSubject,
    session,
    setSession,
    selectedQuestionIndex,
    setSelectedQuestionIndex,
    addGlobalTag,
    removeGlobalTag,
    addQuestionTag,
    removeQuestionTag,
    applyBasicTags
  };
} 