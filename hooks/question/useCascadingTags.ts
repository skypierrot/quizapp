"use client";

import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { z } from 'zod';

// Option 타입 정의
interface Option {
  value: string;
  label: string;
}

// POST /api/exams 요청 본문 타입 정의 (API 라우트와 일치)
const createExamSchema = z.object({
  name: z.string().min(1),
  year: z.number().int().min(1900),
  subject: z.string().min(1)
});
type CreateExamPayload = z.infer<typeof createExamSchema>;

interface UseCascadingTagsProps {
  initialExamName?: string;
  initialYear?: string;
  initialSubject?: string;
}

export function useCascadingTags({
  initialExamName = "",
  initialYear = "",
  initialSubject = ""
}: UseCascadingTagsProps = {}) {
  const { toast } = useToast();

  // --- 상태 변수 ---
  const [examName, setExamName] = useState<string>(initialExamName);
  const [year, setYear] = useState<string>(initialYear);
  const [subject, setSubject] = useState<string>(initialSubject);
  const [isYearValid, setIsYearValid] = useState<boolean>(true);

  const [examNameOptions, setExamNameOptions] = useState<Option[]>([]);
  const [yearOptions, setYearOptions] = useState<Option[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<Option[]>([]);

  const [isLoadingExamNames, setIsLoadingExamNames] = useState<boolean>(false);
  const [isLoadingYears, setIsLoadingYears] = useState<boolean>(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState<boolean>(false);

  // --- 유효성 검사 ---
  const validateYear = useCallback((value: string): boolean => {
    return /^\d{4}$/.test(value);
  }, []);

  // --- API 호출 함수 ---
  const fetchExamNames = useCallback(async () => {
    setIsLoadingExamNames(true);
    try {
      const response = await fetch('/api/exams/names');
      if (!response.ok) {
        throw new Error('시험명 목록을 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      const options = data.names.map((name: string) => ({ value: name, label: name }));
      setExamNameOptions(options);
      
      // 초기값이 있고 로드된 옵션에 포함되어 있으면, 년도/회차도 로드 시도
      if (initialExamName && options.some((opt: Option) => opt.value === initialExamName)) {
          fetchYearsForExam(initialExamName, initialYear); // 초기 년도값 전달
      }

    } catch (error) {
      console.error("Error fetching exam names:", error);
      toast({
        title: "오류",
        description: error instanceof Error ? error.message : "시험명 목록 로딩 중 오류 발생",
        variant: "error",
      });
      setExamNameOptions([]);
    } finally {
      setIsLoadingExamNames(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast, initialExamName, initialYear]); // 초기값 로직 위해 initialExamName, initialYear 추가

   const fetchYearsForExam = useCallback(async (selectedExamName: string, initialYr?: string) => {
    if (!selectedExamName) {
      setYearOptions([]);
      return;
    }
    setIsLoadingYears(true);
    setYearOptions([]);
    try {
      const response = await fetch(`/api/exams/years?name=${encodeURIComponent(selectedExamName)}`);
      if (!response.ok) {
        throw new Error('년도 목록을 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      const options = data.years.map((yr: string) => ({ value: yr, label: `${yr}년` }));
      setYearOptions(options);

       // 초기 년도값이 있고 로드된 옵션에 포함되어 있으면, 과목 로드 시도
       if (initialYr && options.some((opt: Option) => opt.value === initialYr)) {
            fetchSubjectsForExam(selectedExamName, initialYr, initialSubject);
       }

    } catch (error) {
      console.error("Error fetching years:", error);
      toast({
        title: "오류",
        description: error instanceof Error ? error.message : "년도 목록 로딩 중 오류 발생",
        variant: "error",
      });
      setYearOptions([]);
    } finally {
      setIsLoadingYears(false);
    }
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [toast, initialSubject]); // 초기값 로직 위해 initialSubject 추가

  const fetchSubjectsForExam = useCallback(async (selectedExamName: string, selectedYear: string, initialSubj?: string) => {
    if (!selectedExamName || !selectedYear || !validateYear(selectedYear)) {
      setSubjectOptions([]);
      return;
    }
    setIsLoadingSubjects(true);
    setSubjectOptions([]);
    try {
      const response = await fetch(`/api/subjects?name=${encodeURIComponent(selectedExamName)}&year=${encodeURIComponent(selectedYear)}`);
      if (!response.ok) {
        throw new Error('과목 목록을 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      const options = data.subjects.map((subj: string) => ({ value: subj, label: subj }));
      setSubjectOptions(options);
      
      if (initialSubj && options.some((opt: Option) => opt.value === initialSubj)) {
          setSubject(initialSubj);
      }

    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast({
        title: "오류",
        description: error instanceof Error ? error.message : "과목 목록 로딩 중 오류 발생",
        variant: "error",
      });
      setSubjectOptions([]);
    } finally {
      setIsLoadingSubjects(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast, validateYear]);

  // --- 초기 데이터 로딩 ---
  useEffect(() => {
    fetchExamNames();
  }, [fetchExamNames]);

  // --- 생성 로직 헬퍼 ---
 const handleCreateExamInfo = useCallback(async (
    value: string,
    type: 'name' | 'year' | 'subject'
  ) => {
    let payload: CreateExamPayload;
    let newLabel = '';

    try {
      if (type === 'name') {
        const currentYear = new Date().getFullYear();
        payload = { name: value, year: currentYear, subject: '기본과목' };
        newLabel = value;
      } else if (type === 'year') {
        if (!examName) throw new Error("시험명을 먼저 선택해주세요.");
        const yearNum = parseInt(value, 10);
        if (isNaN(yearNum) || !validateYear(value)) throw new Error("유효한 년도(YYYY)를 입력해주세요.");
        payload = { name: examName, year: yearNum, subject: '기본과목' };
        newLabel = `${value}년`;
      } else {
        if (!examName) throw new Error("시험명을 먼저 선택해주세요.");
        if (!year || !validateYear(year)) throw new Error("유효한 년도를 먼저 선택해주세요.");
        const yearNum = parseInt(year, 10);
        payload = { name: examName, year: yearNum, subject: value };
        newLabel = value;
      }

      if (type === 'name') setIsLoadingExamNames(true);
      else if (type === 'year') setIsLoadingYears(true);
      else setIsLoadingSubjects(true);

      const response = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const responseData = await response.json();
      if (!response.ok) {
        const errorMessage = responseData.details ? Object.values(responseData.details).flat().join(', ') : responseData.error || '시험 정보 생성 중 오류가 발생했습니다.';
        throw new Error(errorMessage);
      }

      const createdExam = responseData.exam;
      const newOption: Option = { value: String(createdExam[type === 'year' ? 'year' : type]), label: newLabel };

      if (type === 'name') {
        setExamNameOptions(prev => [...prev, newOption]);
        setExamName(newOption.value);
        setYear(''); setYearOptions([]);
        setSubject(''); setSubjectOptions([]);
        fetchYearsForExam(newOption.value);
      } else if (type === 'year') {
        setYearOptions(prev => [...prev, newOption].sort((a, b) => a.label.localeCompare(b.label)));
        setYear(newOption.value);
        setSubject(''); setSubjectOptions([]);
        fetchSubjectsForExam(examName, newOption.value);
      } else {
        setSubjectOptions(prev => [...prev, newOption].sort((a, b) => a.label.localeCompare(b.label)));
        setSubject(newOption.value);
      }

      toast({ title: "성공", description: `${newLabel} 정보가 생성되었습니다.`, variant: "success" });

    } catch (error) {
      console.error("Error creating exam info:", error);
      toast({ title: "생성 실패", description: error instanceof Error ? error.message : "알 수 없는 오류 발생", variant: "error" });
    } finally {
       if (type === 'name') setIsLoadingExamNames(false);
       else if (type === 'year') setIsLoadingYears(false);
       else setIsLoadingSubjects(false);
    }
  }, [examName, year, validateYear, fetchYearsForExam, fetchSubjectsForExam, toast]);


  // --- 핸들러 ---
  const handleExamNameChange = useCallback((value: string) => {
    setExamName(value);
    setYear('');
    setYearOptions([]);
    setSubject('');
    setSubjectOptions([]);
    setIsYearValid(true);
    if (value) {
      fetchYearsForExam(value);
    }
  }, [fetchYearsForExam]);

  const handleYearChange = useCallback((value: string) => {
    const isValid = validateYear(value);
    setYear(value);
    setIsYearValid(isValid);
    setSubject('');
    setSubjectOptions([]);
    if (value && examName && isValid) {
      fetchSubjectsForExam(examName, value);
    }
  }, [examName, validateYear, fetchSubjectsForExam]);

  const handleSubjectChange = useCallback((value: string) => {
    setSubject(value);
  }, []);

  const handleExamNameCreate = useCallback(async (value: string) => {
    if (!value.trim()) { toast({ title: "오류", description: "시험명을 입력해주세요.", variant: "error" }); return; }
    await handleCreateExamInfo(value.trim(), 'name');
  }, [handleCreateExamInfo, toast]);

  const handleYearCreate = useCallback(async (value: string) => {
    if (!examName) { toast({ title: "오류", description: "시험명을 먼저 선택해주세요.", variant: "error" }); return; }
    if (!value.trim() || !validateYear(value.trim())) { toast({ title: "오류", description: "유효한 년도(YYYY)를 입력해주세요.", variant: "error" }); return; }
    await handleCreateExamInfo(value.trim(), 'year');
  }, [examName, validateYear, handleCreateExamInfo, toast]);

  const handleSubjectCreate = useCallback(async (value: string) => {
    if (!examName || !year || !validateYear(year)) { toast({ title: "오류", description: "시험명과 유효한 년도를 먼저 선택해주세요.", variant: "error" }); return; }
    if (!value.trim()) { toast({ title: "오류", description: "과목명을 입력해주세요.", variant: "error" }); return; }
    await handleCreateExamInfo(value.trim(), 'subject');
  }, [examName, year, validateYear, handleCreateExamInfo, toast]);

  // --- 초기값 설정 useEffect ---
  // 컴포넌트 마운트 시 또는 초기값 변경 시 상태 업데이트
  useEffect(() => {
      setExamName(initialExamName);
      setYear(initialYear);
      setSubject(initialSubject);
      setIsYearValid(initialYear ? validateYear(initialYear) : true);

  }, [initialExamName, initialYear, initialSubject, validateYear]);


  return {
    // 상태 값
    examName,
    year,
    subject,
    examNameOptions,
    yearOptions,
    subjectOptions,
    isLoadingExamNames,
    isLoadingYears,
    isLoadingSubjects,
    isYearValid,
    // 계산된 값
    isYearDisabled: !examName || isLoadingExamNames,
    isSubjectDisabled: !year || isLoadingYears || !isYearValid,
    // 핸들러 함수
    handleExamNameChange,
    handleYearChange,
    handleSubjectChange,
    handleExamNameCreate,
    handleYearCreate,
    handleSubjectCreate,
  };
} 