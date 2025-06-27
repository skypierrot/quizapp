"use client";

import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { z } from 'zod';

// Option 타입 정의
interface Option {
  value: string;
  label: string;
}

// POST /api/exams 요청 본문 타입 정의 (API 라우트와 일치해야 함)
const createExamSchema = z.object({
  name: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "날짜는 YYYY-MM-DD 형식이어야 합니다." }),
  subject: z.string().min(1)
});
type CreateExamPayload = z.infer<typeof createExamSchema>;

interface UseCascadingTagsProps {
  initialExamName?: string;
  initialDate?: string;
  initialSubject?: string;
}

export function useCascadingTags({
  initialExamName = "",
  initialDate = "",
  initialSubject = ""
}: UseCascadingTagsProps = {}) {
  const { toast } = useToast();

  // --- 상태 변수 ---
  const [examName, setExamName] = useState<string>(initialExamName);
  const [date, setDate] = useState<string>(initialDate);
  const [subject, setSubject] = useState<string>(initialSubject);
  const [isDateValid, setIsDateValid] = useState<boolean>(true);

  const [examNameOptions, setExamNameOptions] = useState<Option[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<Option[]>([]);

  const [isLoadingExamNames, setIsLoadingExamNames] = useState<boolean>(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState<boolean>(false);

  // --- 유효성 검사 ---
  const validateDate = useCallback((value: string): boolean => {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
  }, []);

  // fetchSubjectsForExam 정의를 fetchExamNames 위로 이동
  const fetchSubjectsForExam = useCallback(async (selectedExamName: string, initialSubj?: string) => {
    if (!selectedExamName) { 
      setSubjectOptions([]);
      return;
    }
    setIsLoadingSubjects(true);
    setSubjectOptions([]); 
    try {
      const response = await fetch(`/api/subjects?examName=${encodeURIComponent(selectedExamName)}`);
      if (!response.ok) throw new Error('과목 목록을 불러오는데 실패했습니다.');
      const data = await response.json();
      const options = data.subjects.map((subj: string) => ({ value: subj, label: subj }));
      setSubjectOptions(options);
      
      if (initialSubj && options.some((opt: Option) => opt.value === initialSubj)) {
          setSubject(initialSubj);
      } // else setSubject(""); // 과목이 없는 경우 초기화는 다른 곳에서 처리

    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast({ title: "오류", description: error instanceof Error ? error.message : "과목 목록 로딩 중 오류 발생", variant: "error" });
      setSubjectOptions([]);
    } finally {
      setIsLoadingSubjects(false);
    }
  }, [toast, setSubjectOptions, setSubject, setIsLoadingSubjects]);

  // --- API 호출 함수 ---
  const fetchExamNames = useCallback(async () => {
    setIsLoadingExamNames(true);
    try {
      const response = await fetch('/api/exams/names');
      if (!response.ok) throw new Error('시험명 목록을 불러오는데 실패했습니다.');
      const data = await response.json();
      const options = data.names.map((name: string) => ({ value: name, label: name }));
      setExamNameOptions(options);
      
      if (initialExamName && options.some((opt: Option) => opt.value === initialExamName)) {
        // examName 상태는 이미 초기화 되어 있으므로, fetchSubjectsForExam 호출
        fetchSubjectsForExam(initialExamName, initialSubject);
      }
    } catch (error) {
      console.error("Error fetching exam names:", error);
      toast({ title: "오류", description: error instanceof Error ? error.message : "시험명 목록 로딩 중 오류 발생", variant: "error" });
      setExamNameOptions([]);
    } finally {
      setIsLoadingExamNames(false);
    }
  // fetchSubjectsForExam이 이 함수의 스코프 외부에서 정의되었으므로, 의존성 배열에서 제거해도 Linter는 통과할 수 있음.
  // 하지만 실제로는 fetchSubjectsForExam의 내용이 바뀌면 이 함수도 재실행 되어야 하므로, 이상적으로는 의존성에 포함되어야 함.
  // 더 나은 패턴은 useEffect를 사용하는 것.
  }, [toast, initialExamName, initialSubject, setExamNameOptions, setIsLoadingExamNames, fetchSubjectsForExam]); // fetchSubjectsForExam을 다시 추가하여 정확한 의존성 명시

  // --- 초기 데이터 로딩 ---
  useEffect(() => {
    fetchExamNames();
    if (initialDate) {
      setIsDateValid(validateDate(initialDate));
    }
  // fetchExamNames의 의존성이 변경되었으므로, 이 useEffect는 fetchExamNames가 변경될 때마다 실행됨.
  // fetchExamNames는 fetchSubjectsForExam에 의존하므로, 간접적으로 의존성이 연결됨.
  }, [fetchExamNames, initialDate, validateDate]);

  // --- 생성 로직 헬퍼 ---
  const handleCreateExamInfo = useCallback(async (
    value: string,
    type: 'name' | 'subject'
  ) => {
    let payload: CreateExamPayload;
    let newLabel = '';

    try {
      if (type === 'name') {
        const dateForPayload = date && validateDate(date) ? date : new Date().toISOString().split('T')[0];
        const subjectForPayload = subject || '미지정';
        payload = { name: value, date: dateForPayload, subject: subjectForPayload };
        newLabel = value;
      } else {
        if (!examName) throw new Error("시험명을 먼저 선택해주세요.");
        if (!date || !validateDate(date)) throw new Error("유효한 날짜를 먼저 선택해주세요.");
        payload = { name: examName, date: date, subject: value };
        newLabel = value;
      }

      if (type === 'name') setIsLoadingExamNames(true);
      else if (type === 'subject') setIsLoadingSubjects(true);

      const response = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const responseData = await response.json();

      if (!response.ok) {
        const errorMessage = responseData.details ? JSON.stringify(responseData.details) : responseData.error || '시험 정보 생성 중 오류가 발생했습니다.';
        throw new Error(errorMessage);
      }

      const createdExam = responseData.exam || responseData;
      
      if (type === 'name') {
        const newOption: Option = { value: createdExam.name, label: createdExam.name };
        setExamNameOptions(prev => [...prev, newOption].sort((a,b) => a.label.localeCompare(b.label)));
        setExamName(createdExam.name);
        setDate("");
        setSubject("");
        setIsDateValid(true);
        setSubjectOptions([]);
      } else {
        const newOption: Option = { value: createdExam.subject, label: createdExam.subject };
        setSubjectOptions(prev => [...prev, newOption].sort((a,b) => a.label.localeCompare(b.label)));
        setSubject(createdExam.subject);
      }

      toast({ title: "성공", description: `${newLabel} 정보가 생성/연결되었습니다.`, variant: "success" });

    } catch (error) {
      console.error("Error creating exam info:", error);
      toast({ title: "생성 실패", description: error instanceof Error ? error.message : "알 수 없는 오류 발생", variant: "error" });
    } finally {
       if (type === 'name') setIsLoadingExamNames(false);
       else if (type === 'subject') setIsLoadingSubjects(false);
    }
  }, [examName, date, subject, validateDate, fetchSubjectsForExam, toast]);


  // --- 핸들러 ---
  const handleExamNameChange = useCallback((value: string) => {
    setExamName(value);
    setDate("");
    setSubject("");
    setIsDateValid(true);
    setSubjectOptions([]);
    if (value) {
      fetchSubjectsForExam(value, initialSubject);
    }
  }, [fetchSubjectsForExam, setExamName, setDate, setSubject, setIsDateValid, setSubjectOptions, initialSubject]);

  const handleDateChange = useCallback((value: string) => {
    let processedValue = value;
    if (/^\d{8}$/.test(value)) {
      processedValue = `${value.substring(0, 4)}-${value.substring(4, 6)}-${value.substring(6, 8)}`;
    }
    const isValid = validateDate(processedValue);
    setDate(processedValue);
    setIsDateValid(isValid);
  }, [validateDate, setDate, setIsDateValid]);

  const handleSubjectChange = useCallback((value: string) => {
    setSubject(value);
  }, []);

  const handleExamNameCreate = useCallback((value: string) => {
    if (!value.trim()) { toast({ title: "오류", description: "시험명을 입력해주세요.", variant: "error" }); return; }
    handleCreateExamInfo(value.trim(), 'name');
  }, [handleCreateExamInfo, toast]);

  const handleSubjectCreate = useCallback((value: string) => {
    if (!examName) { toast({ title: "오류", description: "시험명을 먼저 선택해주세요.", variant: "error" }); return; }
    if (!date || !validateDate(date)) { toast({ title: "오류", description: "유효한 날짜를 먼저 선택해주세요.", variant: "error" }); return; }
    if (!value.trim()) { toast({ title: "오류", description: "과목명을 입력해주세요.", variant: "error" }); return; }
    handleCreateExamInfo(value.trim(), 'subject');
  }, [examName, date, validateDate, handleCreateExamInfo, toast]);

  return {
    examName,
    setExamName,
    examNameOptions,
    isLoadingExamNames,
    handleExamNameChange,
    handleExamNameCreate,

    date,
    setDate,
    isDateValid,
    handleDateChange,

    subject,
    setSubject,
    subjectOptions,
    isLoadingSubjects,
    isDateDisabled: !examName,
    isSubjectDisabled: !examName || !date || !isDateValid,
    handleSubjectChange,
    handleSubjectCreate,

    validateDate,
  };
} 