'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { IQuestion, IOption, INewExamResult, IAnswerDetail } from '@/types';
import { useSession } from "next-auth/react";
import { type User as NextAuthUser } from "next-auth";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { AlertCircle, TimerIcon, Info, AlertTriangle } from 'lucide-react';
import { cn } from "@/lib/utils"; 
import { CommonImage } from "@/components/common/CommonImage"; 
import { getImageUrl } from "@/utils/image"; 
import { useImageZoom } from '@/hooks/useImageZoom'; 
import { ImageZoomModal } from '@/components/common/ImageZoomModal'; 
import { Switch } from "@/components/ui/switch";
import Breadcrumb, { type BreadcrumbItem } from '@/components/common/Breadcrumb';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// 시험 상태 타입
type ExamState = 'loading' | 'inProgress' | 'submitted' | 'error';

// Fisher-Yates shuffle 함수
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function ExamStartPage() {
  const routeParams = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const typedUser = session?.user as NextAuthUser | undefined; 
  const userId = typedUser?.id;
  const userDisplayName = typedUser?.name || typedUser?.email;

  // 시험 정보 및 문제 상태
  const [decodedExamName, setDecodedExamName] = useState<string | null>(null);
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const imageZoom = useImageZoom();
  const [shuffledOptionsMap, setShuffledOptionsMap] = useState<Record<string, { options: IOption[], answerIndex: number }>>({});
  const [examState, setExamState] = useState<ExamState>('loading');
  const [isOptionShufflingEnabled, setIsOptionShufflingEnabled] = useState(true);
  
  // 미응답 문제 확인 Dialog 상태
  const [showUnansweredDialog, setShowUnansweredDialog] = useState(false);
  const [unansweredQuestions, setUnansweredQuestions] = useState<number[]>([]);

  // 문제 이동 Dialog 상태
  const [showMoveDialog, setShowMoveDialog] = useState(false);

  // URL 파라미터 및 문제 로딩 로직
  useEffect(() => {
    const examNameFromPath = routeParams?.examName as string | undefined;
    if (examNameFromPath) {
      try {
        setDecodedExamName(decodeURIComponent(examNameFromPath));
      } catch (e) {
        console.error("Error decoding exam name from path:", e);
        setError("잘못된 시험명 형식입니다.");
        setExamState('error');
        return;
      }
    }

    if (!searchParams || !decodedExamName) {
        if (!searchParams) setError("URL 파라미터를 읽을 수 없습니다.");
        if (examNameFromPath && !decodedExamName) { /* 아직 디코딩 중 */ }
        else if (!examNameFromPath) setError("경로에서 시험명을 찾을 수 없습니다.")
        return;
    }

    const dateParam = searchParams!.get('date');
    const subjectsParam = searchParams!.get('subjects');
    const randomStartParam = searchParams!.get('randomStart') === 'true';

    let mode: 'date' | 'subject' | null = null;
    let paramValue: string | null = null;

    if (dateParam) {
      mode = 'date';
      paramValue = dateParam;
    } else if (subjectsParam) {
      mode = 'subject';
      paramValue = subjectsParam;
    } else {
      setError('시험을 시작하기 위한 정보(date 또는 subjects)가 URL에 없습니다.');
      setExamState('error');
      return;
    }

    const fetchExamQuestions = async () => {
      setExamState('loading');
      setError(null);
      setQuestions([]); 

      try {
        const tags: string[] = [`시험명:${decodedExamName}`];
        if (mode === 'date' && paramValue) {
          tags.push(`날짜:${paramValue}`);
        } else if (mode === 'subject' && paramValue) {
          const individualSubjects = paramValue.split(',').map(s => s.trim()).filter(s => s.length > 0);
          individualSubjects.forEach(sub => tags.push(`과목:${sub}`));
        }

        const query = new URLSearchParams();
        query.append('tags', tags.join(','));
        if (randomStartParam) {
          query.append('randomStart', 'true');
        }
        
        // 문제 수 설정에 따른 limit 결정
        let limit: number | undefined = undefined;
        const limitParam = searchParams?.get('limit');
        if (limitParam) {
          const parsed = parseInt(limitParam, 10);
          if (!isNaN(parsed) && parsed > 0) {
            limit = parsed;
          }
        }
        if (!limit) {
          if (mode === 'date' && paramValue) {
            limit = 1000;
          } else if (mode === 'subject' && paramValue) {
            limit = 1000;
          } else {
            setError('시험을 시작하기 위한 정보(date 또는 subjects)가 URL에 없습니다.');
            setExamState('error');
            return;
          }
        }
        query.append('limit', limit.toString());

        const response = await fetch(`/api/questions?${query.toString()}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: '문제를 불러오는 데 실패했습니다.' }));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data && Array.isArray(data.questions) && data.questions.length > 0) {
          setQuestions(data.questions);
          setTimeLeft(data.questions.length * 60); 
          setStartTime(Date.now());
          setCurrentQuestionIndex(0); 
          setUserAnswers({}); 
          setExamState('inProgress');

          if (isOptionShufflingEnabled) {
            const newShuffledOptionsMap: Record<string, { options: IOption[], answerIndex: number }> = {};
            data.questions.forEach((q: IQuestion) => {
              if (q.id && q.options && q.options.length > 0 && q.answer < q.options.length) { // q.answer 유효성 검사 추가
                const originalOptions = [...q.options];
                const correctOriginalOption = originalOptions[q.answer]; // 원본 정답 옵션
                const shuffled = shuffleArray(originalOptions);
                const newAnswerIndex = shuffled.findIndex(opt => 
                  opt.text === correctOriginalOption.text && 
                  JSON.stringify(opt.images) === JSON.stringify(correctOriginalOption.images)
                );
                newShuffledOptionsMap[q.id] = { options: shuffled, answerIndex: newAnswerIndex > -1 ? newAnswerIndex : 0 }; // 못찾으면 0번째로 fallback (이론상 발생 안함)
              }
            });
            setShuffledOptionsMap(newShuffledOptionsMap);
          }

        } else {
          setQuestions([]);
          setError('해당하는 문제가 없거나 문제 형식이 올바르지 않습니다.');
          setExamState('error');
        }
      } catch (e: any) {
        console.error('Error fetching exam questions:', e);
        setError(e.message || '문제를 불러오는 중 오류가 발생했습니다.');
        setExamState('error');
      }
    };

    if (decodedExamName && mode && paramValue) {
      fetchExamQuestions();
    }
  }, [routeParams, searchParams, decodedExamName, isOptionShufflingEnabled]);

  // 타이머 로직
  useEffect(() => {
    if (examState !== 'inProgress' || timeLeft <= 0) return; // timeLeft 조건 추가
    const timerInterval = setInterval(() => {
      setTimeLeft((prevTime: number) => { // prevTime 타입 명시
        if (prevTime <= 1) {
          clearInterval(timerInterval);
          // handleSubmitExam(); // 시간 초과 시 자동 제출 (아래에서 호출되도록 수정)
          setExamState('submitted'); 
          console.log("시간 초과! 자동 제출됩니다.");
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [examState, timeLeft]); // timeLeft 의존성 추가

  // 시험 자동 제출 (examState가 'submitted'로 변경되고, 타이머가 0이 되었을 때)
   useEffect(() => {
    if (examState === 'submitted' && timeLeft === 0 && userId) { // userId 조건 추가
      // 이전에 콘솔 로그만 있었으므로, 실제 제출 로직 호출
      handleSubmitExam();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examState, timeLeft, userId]); // handleSubmitExam은 useCallback으로 감싸져 있으므로 의존성 추가 가능


  // 답변 선택 핸들러
  const handleAnswerSelect = (questionId: string | undefined, selectedOptionIndexInDisplay: number) => {
    if (!questionId) return;
    setUserAnswers((prevAnswers: Record<string, number>) => {
      // 이미 동일한 옵션이 선택되어 있으면 선택 취소
      if (prevAnswers[questionId] === selectedOptionIndexInDisplay) {
        // 선택 취소 시 해당 키를 제거한 새 객체를 반환
        const newAnswers = { ...prevAnswers };
        delete newAnswers[questionId];
        return newAnswers;
      }
      // 새로운 옵션 선택 또는 다른 옵션으로 변경
      return {
        ...prevAnswers,
        [questionId]: selectedOptionIndexInDisplay
      };
    });
  };

  // 문제 네비게이션 핸들러
  const handlePrevQuestion = () => {
    setCurrentQuestionIndex((prev: number) => Math.max(0, prev - 1)); // prev 타입 명시
  };

  const handleNextQuestion = () => {
    setCurrentQuestionIndex((prev: number) => Math.min(questions.length - 1, prev + 1)); // prev 타입 명시
  };

  // 답안 제출 핸들러
  const handleSubmitExam = useCallback(async () => {
    if (questions.length === 0 && examState !== 'error') { // 에러 상태가 아닐 때만 문제 없음 오류 표시
        setError("제출할 문제가 없습니다.");
        setExamState('error'); // 오류 상태로 전환
        return;
    }
    // 이미 제출 중이거나 완료된 상태면 중복 호출 방지
    if (examState === 'submitted' && !error && questions.length > 0) { 
        // API 호출 전 상태를 submitted로 설정 (중복 제출 방지용으로 사용)
        // 실제 API 호출 실패 시를 대비해 UI에서는 '결과 처리 중' 등으로 표시할 수 있음
    } else if (examState !== 'inProgress' && examState !== 'error') { 
        // inProgress 상태가 아니면 제출하지 않음 (이미 제출했거나 로딩 중 등)
        // 단, 시간이 만료되어 submitted로 바로 변경된 경우는 제외
        if (!(examState === 'submitted' && timeLeft === 0)) {
          console.log("Current examState is not 'inProgress', submission prevented:", examState);
          return;
        }
    }
    
    // API 호출 중복 방지를 위해 examState를 '결과 처리 중' 같은 상태로 변경할 수도 있음
    // setExamState('submitting'); // 예시

    const elapsedTime = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
    let correctCount = 0;

    const answerDetails: IAnswerDetail[] = questions.map((q: IQuestion) => { // q 타입 명시
      const userAnswerDisplayIndex = userAnswers[q.id!];
      let isCorrect = false;
      let originalSelectedOptionIndex: number | null = null;

      if (userAnswerDisplayIndex !== undefined && q.id && q.options && q.answer < q.options.length) {
        const currentQuestionOptionsInfo = shuffledOptionsMap[q.id!];
        const originalCorrectOption = q.options[q.answer];

        if (isOptionShufflingEnabled && currentQuestionOptionsInfo && currentQuestionOptionsInfo.options.length > 0) {
          isCorrect = userAnswerDisplayIndex === currentQuestionOptionsInfo.answerIndex;
          const selectedActualOption = currentQuestionOptionsInfo.options[userAnswerDisplayIndex];
          // 원본 옵션 리스트에서 실제 선택된 옵션의 인덱스를 찾습니다.
          originalSelectedOptionIndex = q.options.findIndex(opt => 
            opt.text === selectedActualOption?.text && 
            JSON.stringify(opt.images) === JSON.stringify(selectedActualOption?.images)
          );
           if (originalSelectedOptionIndex === -1) originalSelectedOptionIndex = null; // 못찾으면 null
        } else {
          isCorrect = userAnswerDisplayIndex === q.answer;
          originalSelectedOptionIndex = userAnswerDisplayIndex;
        }
      }

      if (isCorrect) {
        correctCount++;
      }
      return {
        questionId: q.id!,
        selectedOptionIndex: originalSelectedOptionIndex,
        isCorrect: isCorrect,
      };
    });

    const totalQuestions = questions.length;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    
    // 과목별 통계 및 과락 여부 계산
    const subjectStats: Record<string, { correct: number; total: number }> = {};
    const calculateSubjectStats = () => {
      // 문제 목록을 과목별로 분류
      questions.forEach((q, idx) => {
        const subject = q.examSubject || '기타';
        
        if (!subjectStats[subject]) {
          subjectStats[subject] = { correct: 0, total: 0 };
        }
        
        // 해당 과목의 총 문제 수 증가
        subjectStats[subject].total += 1;
        
        // 해당 문제를 맞췄는지 확인
        const answerDetail = answerDetails[idx];
        if (answerDetail && answerDetail.isCorrect) {
          subjectStats[subject].correct += 1;
        }
      });
      
      return subjectStats;
    };
    
    // 과목별 점수 및 통계 계산
    const subjectStatsData = calculateSubjectStats();
    
    const representativeQuestion = questions.length > 0 ? questions[0] : null; // questions가 비어있을 수 있으므로 null 체크
    let determinedExamYear: number;
    let determinedExamSubject: string;
    let determinedExamDate: string; 

    const currentSearchParams = searchParams; 

    if (currentSearchParams) { 
      const dateValue = currentSearchParams.get('date');
      const subjectsValue = currentSearchParams.get('subjects');

      if (dateValue) { 
          determinedExamYear = parseInt(dateValue.substring(0, 4)) || new Date().getFullYear();
          determinedExamDate = dateValue;
          determinedExamSubject = representativeQuestion?.examSubject || representativeQuestion?.subject || "종합"; 
      } else if (subjectsValue) { 
          determinedExamYear = representativeQuestion?.examYear || new Date().getFullYear(); 
          determinedExamSubject = subjectsValue;
      } else {
          determinedExamYear = new Date().getFullYear();
          determinedExamSubject = "정보 없음";
          setError("시험 정보(date 또는 subjects)가 누락되어 결과를 정확히 기록할 수 없습니다.");
      }
    } else {
      setError("시험 정보를 URL에서 완전히 로드할 수 없습니다. 페이지를 새로고침하거나 다시 시도해주세요.");
      determinedExamYear = representativeQuestion?.examYear || new Date().getFullYear();
      determinedExamSubject = representativeQuestion?.subject || "정보 없음";
    }

    // examYear 최종 유효성 검사
    if (!determinedExamYear || isNaN(determinedExamYear)) {
        determinedExamYear = new Date().getFullYear();
    }

    // examDate 최종 결정 (determinedExamDate가 아직 할당되지 않은 경우)
    if (!currentSearchParams?.get('date')) { // dateValue가 없는 경우에만 이 블록 실행
        if (representativeQuestion?.examDate) {
            determinedExamDate = representativeQuestion.examDate;
        } else {
            determinedExamDate = `${determinedExamYear}-01-01`;
        }
    } else {
        // dateValue가 있었으므로, determinedExamDate는 이미 할당됨 (위의 if(dateValue) 블록에서)
        // 이 else 블록은 사실상 determinedExamDate가 이미 설정된 상태를 확인하는 것.
        // 만약 dateValue가 있었음에도 determinedExamDate가 할당되지 않았다면 로직 오류.
        // 여기서는 dateValue가 있을 때 determinedExamDate가 확실히 할당되었다고 가정.
    }

    const resultData: INewExamResult = {
      userId: userId || 'guest',
      examName: decodedExamName || "모의고사",
      examYear: determinedExamYear,
      examDate: determinedExamDate!, // Non-null assertion, 로직상 항상 string 값이어야 함
      examSubject: determinedExamSubject!,
      answers: answerDetails,
      score: score,
      correctCount: correctCount,
      totalQuestions: totalQuestions,
      elapsedTime: elapsedTime,
      subjectStats: subjectStatsData, // 과목별 통계 추가
    };

    setExamState('submitted'); // API 호출 직전 submitted로 확실히 변경 (중복 제출 방지 및 UI 피드백)

    // 로그인 상태 확인 - 로그인된 경우 API 호출, 비로그인 시 임시 결과 저장
    if (userId) {
      try {
        const response = await fetch('/api/exam-results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(resultData),
          credentials: 'include',
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: '결과 저장에 실패했습니다.' }));
          setError(`결과 저장 실패: ${errorData.message}`); // 에러 메시지 구체화
          return; // 오류 발생 시 여기서 중단
        }
        const savedResult = await response.json();
        if (savedResult && savedResult.id) {
          router.push(`/results/${savedResult.id}`);
        } else {
          setError("결과 ID를 받지 못해 결과 페이지로 이동할 수 없습니다.");
        }
      } catch (error: any) {
        console.error("결과 저장 API 호출 오류:", error);
        setError("시험 결과를 저장하는 중 오류가 발생했습니다: " + error.message);
      }
    } else {
      // 비로그인 상태일 때 - 세션 스토리지에 임시 결과 저장
      try {
        // 현재 시간으로 임시 ID 생성
        const tempResultId = `temp_result_${Date.now()}`;
        
        // 결과 데이터에 임시 ID와 생성 시간 추가
        const tempResultData = {
          ...resultData,
          id: tempResultId,
          createdAt: new Date().toISOString(),
          isTemporary: true
        };
        
        // 세션 스토리지에 결과 저장
        sessionStorage.setItem(`exam_result_${tempResultId}`, JSON.stringify({
          result: tempResultData,
          questions: questions
        }));
        
        // 임시 결과 페이지로 이동
        router.push(`/results/temp/${tempResultId}`);
      } catch (error: any) {
        console.error("임시 결과 저장 오류:", error);
        setError("임시 결과를 저장하는 중 오류가 발생했습니다: " + error.message);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, decodedExamName, questions, userAnswers, startTime, router, searchParams, shuffledOptionsMap, isOptionShufflingEnabled, examState, timeLeft]); // examState, timeLeft 추가
  
  const currentQuestion = questions[currentQuestionIndex];
  const nextQuestion = currentQuestionIndex < questions.length - 1 ? questions[currentQuestionIndex + 1] : null;

  const currentOptionsInfo = currentQuestion?.id ? shuffledOptionsMap[currentQuestion.id] : null;
  const displayOptions = isOptionShufflingEnabled && currentOptionsInfo ? currentOptionsInfo.options : currentQuestion?.options;

  // 다음 문제의 선택지 정보 (섞기 여부 반영)
  const nextQuestionId = nextQuestion?.id;
  const nextOptionsInfo = nextQuestionId ? shuffledOptionsMap[nextQuestionId] : null;
  const displayNextOptions = isOptionShufflingEnabled && nextOptionsInfo ? nextOptionsInfo.options : nextQuestion?.options;

  // 키보드 이벤트 핸들러 (숫자키 선택, 화살표키 이동)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (examState !== 'inProgress') return;

      const activeElement = document.activeElement;
      if (activeElement && ((activeElement as HTMLElement).tagName === 'INPUT' || (activeElement as HTMLElement).tagName === 'TEXTAREA' || (activeElement as HTMLElement).isContentEditable)) {
        return; // 입력 필드에 포커스된 경우 단축키 무시
      }

      if (e.key >= '1' && e.key <= '9') {
        const optionIndex = parseInt(e.key) - 1;
        if (displayOptions && optionIndex < displayOptions.length) {
          handleAnswerSelect(currentQuestion?.id, optionIndex);
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentQuestionIndex > 0) handlePrevQuestion();
      } else if (e.key === 'ArrowRight') {
        if (currentQuestionIndex < questions.length - 1) handleNextQuestion();
        else if (currentQuestionIndex === questions.length - 1) {
          // 마지막 문제에서 오른쪽 화살표 누르면 제출 확인 다이얼로그 띄우거나 바로 제출 (선택)
          // 여기서는 일단 동작 없음. 필요시 handleSubmitExam() 호출.
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestionIndex, questions.length, displayOptions, currentQuestion, examState, handleAnswerSelect, handlePrevQuestion, handleNextQuestion]);

  // 미응답 문제 찾기 함수
  const findUnansweredQuestions = useCallback(() => {
    const unanswered: number[] = [];
    questions.forEach((question, index) => {
      if (question.id && userAnswers[question.id] === undefined) {
        unanswered.push(index);
      }
    });
    return unanswered;
  }, [questions, userAnswers]);

  // 모든 문제에 답변했는지 확인하는 함수
  const allQuestionsAnswered = useMemo(() => {
    if (questions.length === 0) return false;

    return questions.every(question =>
      question.id && userAnswers[question.id] !== undefined
    );
  }, [questions, userAnswers]);

  // 미응답 문제 처리 및 제출 준비 함수
  const handleSubmitRequest = useCallback(() => {
    const unanswered = findUnansweredQuestions();

    if (unanswered.length > 0) {
      setUnansweredQuestions(unanswered);
      setShowUnansweredDialog(true);
    } else {
      handleSubmitExam();
    }
  }, [findUnansweredQuestions, handleSubmitExam]);

  // 특정 미응답 문제로 이동하는 함수
  const goToUnansweredQuestion = useCallback((index: number) => {
    setCurrentQuestionIndex(index);
    setShowUnansweredDialog(false);
  }, []);

  if (examState === 'loading') {
    return <div className="flex justify-center items-center h-screen"><div>로딩 중...</div></div>;
  }

  if (examState === 'error' || (examState === 'submitted' && error) ) { // 제출 후 에러 발생 시에도 통합 처리
    return (
      <div className="flex flex-col justify-center items-center h-screen text-red-500 p-4">
        <AlertCircle className="w-16 h-16 mb-4" />
        <p className="text-xl font-semibold">오류 발생</p>
        <p className="text-center mt-2">{error || "알 수 없는 오류가 발생했습니다."}</p>
        <Button onClick={() => router.push('/')} className="mt-6">홈으로 돌아가기</Button>
      </div>
    );
  }
  
  if (examState === 'submitted' && !error) {
    // API 호출 후 router.push로 이동하므로, 이 상태는 매우 짧게만 표시됨
    return <div className="flex justify-center items-center h-screen"><div>시험 결과를 처리 중입니다...</div></div>;
  }

  if (!currentQuestion && examState === 'inProgress') {
    // 문제가 로드되었으나 currentQuestion이 없는 경우 (이론상 발생하기 어려움)
     return <div className="flex justify-center items-center h-screen"><div>문제를 표시할 수 없습니다. 설정 확인이 필요합니다.</div></div>; 
  }
  
  if (!currentQuestion && examState !== 'loading' && examState !== 'error' && !questions.length) {
    // 로딩/에러도 아니고, 현재문제가 없으면 (예: questions가 빈 배열)
    const breadcrumbItems: BreadcrumbItem[] = [];
    if (decodedExamName && routeParams?.examName) {
        breadcrumbItems.push({ label: "홈", href: "/" });
        breadcrumbItems.push({ label: "문제 은행", href: "/learn/exams" });
        breadcrumbItems.push({ label: decodedExamName, href: `/learn/exams/${routeParams.examName as string}`});
        const pageTitle = searchParams?.get('date') || searchParams?.get('subjects');
        breadcrumbItems.push({ label: `${pageTitle || '모의고사'} (문제 없음)`, isCurrent: true });
    } else {
        breadcrumbItems.push({ label: "홈", href: "/" });
        breadcrumbItems.push({ label: "문제 은행", href: "/learn/exams" });
        breadcrumbItems.push({ label: "모의고사 (문제 없음)", isCurrent: true });
    }

    return (
      <div className="container mx-auto p-4">
        <Breadcrumb items={breadcrumbItems} />
        <div className="flex flex-col justify-center items-center h-[calc(100vh-150px)] text-gray-700 p-4">
          <AlertCircle className="w-16 h-16 mb-4 text-yellow-500" />
          <p className="text-xl font-semibold">문제가 없습니다.</p>
          <p className="text-center mt-2">선택하신 조건에 해당하는 문제가 없습니다. 다른 시험을 선택해주세요.</p>
          <Button onClick={() => router.push('/learn/exams')} className="mt-6">다른 시험 선택하기</Button>
        </div>
      </div>
    );
  }

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "홈", href: "/" },
    { label: "문제 은행", href: "/learn/exams" },
  ];
  if (decodedExamName && routeParams?.examName) {
    breadcrumbItems.push({ label: decodedExamName, href: `/learn/exams/${routeParams.examName as string}`});
  }
  const pageIdentifier = searchParams?.get('date') || searchParams?.get('subjects');
  breadcrumbItems.push({ label: `${pageIdentifier ? pageIdentifier + ' ' : ''}모의고사`, isCurrent: true });

  return (
    <div className="container mx-auto p-4 flex flex-col min-h-screen">
      <Breadcrumb items={breadcrumbItems} />
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-center">{decodedExamName || '모의고사'}</h1>
        {/* 추가 정보 표시: 날짜 또는 과목 */}
        {searchParams!.get('date') && <p className="text-center text-sm text-gray-500">회차: {searchParams!.get('date')}</p>}
        {searchParams!.get('subjects') && <p className="text-center text-sm text-gray-500">과목: {searchParams!.get('subjects')}</p>}
      </header>

      {/* 문제 표시 영역을 Grid로 변경 - 모바일에서는 1열, 데스크탑에서는 2열 */} 
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 현재 문제 - 모바일에서는 전체 너비, 데스크탑에서는 왼쪽 열 */} 
        {currentQuestion && (
          <Card className="w-full shadow-lg lg:col-span-1">
            <CardHeader className="bg-gray-50 p-4 border-b">
              <div className="flex justify-between items-center mb-2"> 
                <CardTitle className="text-lg">문제 {currentQuestionIndex + 1} / {questions.length}</CardTitle>
                <div className="flex items-center space-x-4"> 
                  <div className={cn("flex items-center space-x-1 font-semibold", timeLeft <= 60 ? "text-red-600 animate-pulse" : "text-gray-700")}>
                    <TimerIcon className="h-5 w-5" />
                    <span>{Math.floor(timeLeft / 60)}분 {timeLeft % 60}초</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="shuffle-options"
                      checked={isOptionShufflingEnabled}
                      onCheckedChange={setIsOptionShufflingEnabled} 
                    />
                    <Label htmlFor="shuffle-options" className="text-sm font-medium">선택지 섞기</Label>
                  </div>
                </div>
              </div>
              <Progress value={(currentQuestionIndex + 1) / questions.length * 100} className="h-2" />
              <div className="mt-2 text-xs text-gray-600 flex items-center">
                <Info size={14} className="mr-1 flex-shrink-0" />
                <span>팁: 좌우 화살표 키로 문제 이동, 숫자 키로 정답 선택이 가능합니다.</span>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="mb-4">
                <div className="pt-4">
                  <Label className="font-semibold text-xl whitespace-pre-wrap">{currentQuestion.content}</Label>
                </div>
                {currentQuestion.images && currentQuestion.images.length > 0 && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentQuestion.images.map((img: { url: string; hash: string }, idx: number) => (
                      <CommonImage 
                        key={img.hash || idx}
                        src={getImageUrl(img.url)} 
                        alt={`문제 이미지 ${idx + 1}`}
                        onClick={() => imageZoom.showZoom(getImageUrl(img.url))}
                        containerClassName="rounded border cursor-pointer hover:opacity-80 w-full h-auto object-contain max-h-60"
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {displayOptions && displayOptions.map((option: IOption, index: number) => {
                  const displayOptionNumber = isOptionShufflingEnabled && currentOptionsInfo 
                                            ? index + 1 
                                            : (option.number !== undefined ? option.number + 1 : index + 1);
                  return (
                    <div 
                      key={index} 
                      className={cn(
                        "flex items-start p-3 border rounded-md cursor-pointer transition-colors",
                        userAnswers[currentQuestion.id!] === index 
                          ? "bg-blue-100 border-blue-500 ring-2 ring-blue-500" 
                          : "hover:bg-gray-50"
                      )}
                      onClick={() => handleAnswerSelect(currentQuestion.id, index)}
                    >
                      <span className="font-medium mr-3">{displayOptionNumber}.</span>
                      <div className="flex-1">
                        <span className="whitespace-pre-wrap">{option.text}</span>
                        {option.images && option.images.length > 0 && (
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
                            {option.images.map((img: { url: string; hash: string }, imgIdx: number) => (
                               <CommonImage 
                                key={img.hash || imgIdx}
                                src={getImageUrl(img.url)} 
                                alt={`선택지 ${displayOptionNumber} 이미지 ${imgIdx + 1}`}
                                onClick={(e: React.MouseEvent<Element, MouseEvent>) => { e.stopPropagation(); imageZoom.showZoom(getImageUrl(img.url));}}
                                containerClassName="rounded border cursor-pointer hover:opacity-80 w-full h-auto object-contain max-h-40"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
        {!currentQuestion && examState === 'inProgress' && (
             <div className="col-span-1 lg:col-span-2 flex justify-center items-center h-full"><div>문제를 표시할 수 없습니다. 설정 확인이 필요합니다.</div></div>
        )}
        {!currentQuestion && examState !== 'loading' && examState !== 'error' && !questions.length && (
            <div className="col-span-1 lg:col-span-2 flex flex-col justify-center items-center h-full text-gray-700 p-4">
                <AlertCircle className="w-16 h-16 mb-4 text-yellow-500" />
                <p className="text-xl font-semibold">문제가 없습니다.</p>
                <p className="text-center mt-2">선택하신 조건에 해당하는 문제가 없습니다. 다른 시험을 선택해주세요.</p>
                <Button onClick={() => router.push('/learn/exams')} className="mt-6">다른 시험 선택하기</Button>
            </div>
        )}

        {/* 오른쪽 열: 데스크탑에서만 보이는 다음 문제 (미리보기) */} 
        {nextQuestion && (
          <Card className="hidden lg:block w-full shadow-lg opacity-50 pointer-events-none">
            <CardHeader className="bg-gray-50 p-4 border-b">
              <CardTitle className="text-lg text-gray-500">다음 문제: {currentQuestionIndex + 2}</CardTitle>
              {/* 다음 문제에는 타이머나 섞기 스위치 불필요, 진행도도 현재 문제 기준이므로 불필요 */} 
            </CardHeader>
            <CardContent className="p-6">
              <div className="mb-4">
                <div className="pt-4">
                  <Label className="font-semibold text-xl whitespace-pre-wrap">{nextQuestion.content}</Label>
                </div>
                {nextQuestion.images && nextQuestion.images.length > 0 && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {nextQuestion.images.map((img: { url: string; hash: string }, idx: number) => (
                      <CommonImage 
                        key={img.hash || idx}
                        src={getImageUrl(img.url)} 
                        alt={`다음 문제 이미지 ${idx + 1}`}
                        containerClassName="rounded border w-full h-auto object-contain max-h-60"
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {displayNextOptions && displayNextOptions.map((option: IOption, index: number) => {
                  const displayOptionNumber = isOptionShufflingEnabled && nextOptionsInfo 
                                            ? index + 1 
                                            : (option.number !== undefined ? option.number + 1 : index + 1);
                  return (
                    <div key={index} className="flex items-start p-3 border rounded-md">
                      <span className="font-medium mr-3">{displayOptionNumber}.</span>
                      <div className="flex-1">
                        <span className="whitespace-pre-wrap">{option.text}</span>
                        {option.images && option.images.length > 0 && (
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
                            {option.images.map((img: { url: string; hash: string }, imgIdx: number) => (
                               <CommonImage 
                                key={img.hash || imgIdx}
                                src={getImageUrl(img.url)} 
                                alt={`다음 선택지 ${displayOptionNumber} 이미지 ${imgIdx + 1}`}
                                containerClassName="rounded border w-full h-auto object-contain max-h-40"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div> 

      <footer className="mt-6 mb-2 sticky bottom-0 bg-white dark:bg-gray-900 py-4 border-t dark:border-gray-700">
        <div className="flex justify-between items-center max-w-3xl mx-auto px-2">
          <Button 
            onClick={handlePrevQuestion} 
            disabled={currentQuestionIndex === 0 || examState !== 'inProgress'}
            variant="outline"
            size="lg"
          >
            이전
          </Button>
          <Button
            onClick={() => setShowMoveDialog(true)}
            variant="outline"
            size="lg"
            disabled={questions.length === 0 || examState !== 'inProgress'}
          >
            문제 이동
          </Button>
          {currentQuestionIndex === questions.length - 1 ? (
            <Button
              onClick={handleSubmitRequest}
              size="lg"
              className={allQuestionsAnswered ? "bg-green-600 hover:bg-green-700 text-white ml-2" : "bg-yellow-600 hover:bg-yellow-700 text-white ml-2"}
              disabled={examState !== 'inProgress'}
            >
              {allQuestionsAnswered ? "답안 제출" : "제출하기"}
            </Button>
          ) : (
            <Button 
              onClick={handleNextQuestion} 
              disabled={currentQuestionIndex === questions.length - 1 || examState !== 'inProgress'} 
              size="lg"
            >
              다음
            </Button>
          )}
        </div>
      </footer>

      {/* 미응답 문제 확인 Dialog */}
      <Dialog open={showUnansweredDialog} onOpenChange={setShowUnansweredDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="text-yellow-500 mr-2 h-5 w-5" />
              미응답 문제가 있습니다
            </DialogTitle>
            <DialogDescription>
              {unansweredQuestions.length > 0
                ? "다음 문제에 답변하지 않았습니다. 아래 번호를 클릭하면 해당 문제로 이동합니다."
                : "미응답 문제가 있습니다."}
            </DialogDescription>
          </DialogHeader>
          {unansweredQuestions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {unansweredQuestions.map((index) => (
                <Button
                  key={index}
                  size="sm"
                  variant="outline"
                  className="min-w-[40px]"
                  onClick={() => goToUnansweredQuestion(index)}
                >
                  {index + 1}
                </Button>
              ))}
            </div>
          )}
          <DialogFooter className="flex justify-between sm:justify-between mt-4">
            <Button
              variant="outline"
              onClick={() => goToUnansweredQuestion(unansweredQuestions[0])}
            >
              첫 미응답 문제로 이동
            </Button>
            <Button
              variant="default"
              onClick={() => {
                setShowUnansweredDialog(false);
                handleSubmitExam();
              }}
            >
              그대로 제출하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 문제 이동 Dialog */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Info className="text-blue-500 mr-2 h-5 w-5" />
              문제로 이동
            </DialogTitle>
            <DialogDescription>
              아래에서 원하는 문제 번호를 클릭하면 해당 문제로 이동합니다.
            </DialogDescription>
          </DialogHeader>
          {/* 안푼 문제 */}
          <div className="mb-2">
            <div className="text-xs font-semibold text-gray-500 mb-1">안푼문제</div>
            <div className="flex flex-wrap gap-1">
              {questions
                .map((q, idx) => ({ idx, answered: userAnswers[q.id!] !== undefined }))
                .filter(q => !q.answered)
                .sort((a, b) => a.idx - b.idx)
                .map(({ idx }) => (
                  <Button
                    key={idx}
                    size="sm"
                    variant={currentQuestionIndex === idx ? "default" : "outline"}
                    className={
                      `border-2 ${currentQuestionIndex === idx ? 'border-black !text-black font-bold' : 'border-gray-400 text-gray-700'} bg-white` +
                      ' min-w-[32px] h-8 px-0'
                    }
                    onClick={() => {
                      setCurrentQuestionIndex(idx);
                      setShowMoveDialog(false);
                    }}
                    disabled={examState !== 'inProgress'}
                  >
                    {idx + 1}
                  </Button>
                ))}
            </div>
          </div>
          {/* 푼 문제 */}
          <div>
            <div className="text-xs font-semibold text-blue-700 mb-1">푼문제</div>
            <div className="flex flex-wrap gap-1">
              {questions
                .map((q, idx) => ({ idx, answered: userAnswers[q.id!] !== undefined }))
                .filter(q => q.answered)
                .sort((a, b) => a.idx - b.idx)
                .map(({ idx }) => (
                  <Button
                    key={idx}
                    size="sm"
                    variant={currentQuestionIndex === idx ? "default" : "outline"}
                    className={
                      `border-2 ${currentQuestionIndex === idx ? 'border-blue-700' : 'border-blue-400'} bg-blue-50 text-blue-700` +
                      ' min-w-[32px] h-8 px-0'
                    }
                    onClick={() => {
                      setCurrentQuestionIndex(idx);
                      setShowMoveDialog(false);
                    }}
                    disabled={examState !== 'inProgress'}
                  >
                    {idx + 1}
                  </Button>
                ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <ImageZoomModal 
        imageUrl={imageZoom.zoomedImage}
        onClose={imageZoom.closeZoom} 
      />
    </div>
  );
} 