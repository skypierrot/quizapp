'use client'

import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { ToastVariant } from '@/types/toast';

// 태그 타입을 정의할 수 있습니다 (예: 기본 태그, 일반 태그 구분 등)
export type Tag = string; // 우선 간단하게 문자열로 정의

export interface TagManagementState {
  examName: string;
  year: string;
  session: string;
  subject: string;
  tags: Tag[];
}

export interface UseTagManagementReturn extends TagManagementState {
  setExamName: (value: string) => void;
  setYear: (value: string) => void;
  setSession: (value: string) => void;
  setSubject: (value: string) => void;
  addTag: (tag: Tag) => void;
  removeTag: (tagToRemove: Tag) => void;
  getAllTags: () => Tag[]; // 기본 태그와 일반 태그를 합쳐서 반환하는 함수
  isYearValid: boolean; // 년도 유효성 상태 추가
  validateYear: (value: string) => boolean; // 년도 유효성 검사 함수 추가
}

// 초기 상태 정의
const initialTagState: TagManagementState = {
  examName: '',
  year: '',
  session: '',
  subject: '',
  tags: [],
};

export function useTagManagement(initialState: Partial<TagManagementState> = {}): UseTagManagementReturn {
  const { toast } = useToast();
  const [examName, setExamName] = useState(initialState.examName || initialTagState.examName);
  const [year, setYear] = useState(initialState.year || initialTagState.year);
  const [session, setSession] = useState(initialState.session || initialTagState.session);
  const [subject, setSubject] = useState(initialState.subject || initialTagState.subject);
  const [tags, setTags] = useState<Tag[]>(initialState.tags || initialTagState.tags);
  const [isYearValid, setIsYearValid] = useState<boolean>(true);

  const validateYear = useCallback((value: string): boolean => {
    const yearNum = parseInt(value, 10);
    const currentYear = new Date().getFullYear();
    // 년도는 4자리 숫자이고, 너무 과거(예: 1900년 이전)나 미래(현재 년도 + 5년 초과)가 아니어야 함
    const isValid = /^\d{4}$/.test(value) && yearNum >= 1900 && yearNum <= currentYear + 5;
    setIsYearValid(isValid);
    return isValid;
  }, []);

  // 년도 상태 변경 시 유효성 검사 수행
  const handleSetYear = useCallback((value: string) => {
    setYear(value);
    validateYear(value);
  }, [validateYear]);


  const addTag = useCallback((tag: Tag) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag) return;

    if (/^(시험명|년도|회차|과목):/.test(trimmedTag)) {
       toast({
         title: '잘못된 태그 형식',
         description: '기본 태그(시험명, 년도, 회차, 과목)는 지정된 입력 필드를 사용해주세요.',
         variant: 'destructive',
       });
       return;
    }

    setTags((prevTags) => {
      const lowerCaseTrimmedTag = trimmedTag.toLowerCase();
      const isDuplicate = prevTags.some(
        (existingTag) => existingTag.trim().toLowerCase() === lowerCaseTrimmedTag
      );
      if (isDuplicate) {
        toast({
          title: '중복된 태그',
          description: `"${trimmedTag}" 태그는 이미 존재합니다.`,
          variant: 'warning',
        });
        return prevTags;
      }
      return [...prevTags, trimmedTag];
    });
  }, [toast]);

  const removeTag = useCallback((tagToRemove: Tag) => {
    setTags((prevTags) => prevTags.filter((tag) => tag !== tagToRemove));
  }, []);

  // 기본 태그와 일반 태그를 합쳐서 반환하는 함수
  const getAllTags = useCallback((): Tag[] => {
    const basicTags: Tag[] = [];
    if (examName.trim()) basicTags.push(`시험명:${examName.trim()}`);
    if (year.trim()) basicTags.push(`년도:${year.trim()}`);
    if (session.trim()) basicTags.push(`회차:${session.trim()}`);
    if (subject.trim()) basicTags.push(`과목:${subject.trim()}`);

    // 년도 유효성 검사 추가: 제출 시점에 유효하지 않으면 에러 토스트
    if (year.trim() && !isYearValid) {
       toast({
        title: '유효하지 않은 년도',
        description: '년도를 올바른 형식(4자리 숫자)으로 입력해주세요.',
        variant: 'destructive',
       });
       throw new Error("유효하지 않은 년도입니다.");
    }

    return [...basicTags, ...tags];
  }, [examName, year, session, subject, tags, isYearValid, toast]);


  return {
    examName,
    year,
    session,
    subject,
    tags,
    setExamName,
    setYear: handleSetYear, // 유효성 검사가 포함된 함수로 교체
    setSession,
    setSubject,
    addTag,
    removeTag,
    getAllTags,
    isYearValid,
    validateYear,
  };
} 