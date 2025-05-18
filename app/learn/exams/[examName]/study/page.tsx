'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { IQuestion, IOption } from '@/types';
import Breadcrumb, { BreadcrumbItem } from '@/components/common/Breadcrumb';
import { Button } from '@/components/ui/button';
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import StudyPageHeader from '@/components/study/StudyPageHeader';
import { shuffleArray } from '@/utils/array';
import { ImageZoomModal } from '@/components/common/ImageZoomModal';
import { getImageUrl } from "@/utils/image";
import { CommonImage } from "@/components/common/CommonImage";

const SUBJECT_QUESTIONS_PER_PAGE = 50; // 한 번에 불러올 과목별 문제 수

// 학습용 카드 컴포넌트 (기존과 동일)
const StudyQuestionCard = ({ question, index, page, onImageZoom, showAnswer, showExplanation, onOptionSelect, userAnswer, shuffledOptions, shuffledAnswerIndex }: {
  question: IQuestion;
  index: number;
  page?: number;
  onImageZoom: (url: string) => void;
  showAnswer?: boolean;
  showExplanation?: boolean;
  onOptionSelect?: (optionIndex: number) => void;
  userAnswer?: number | null;
  shuffledOptions?: IOption[];
  shuffledAnswerIndex?: number;
}) => {
  // const questionNumber = (page && page > 0 ? (page - 1) * 10 : 0) + index + 1; // 기존 페이지 기반 번호 주석 처리 또는 삭제

  // 렌더링에 사용할 선택지와 정답 인덱스 결정
  const optionsToDisplay = shuffledOptions && shuffledOptions.length > 0 ? shuffledOptions : question.options;
  const correctAnswerIndex = typeof shuffledAnswerIndex === 'number' && shuffledAnswerIndex !== -1 ? shuffledAnswerIndex : question.answer;

  return (
    <div className="p-4 border rounded-lg bg-white shadow mb-4">
      <p className="text-xs text-gray-500 mb-2">문제 {question.questionNumber !== undefined ? question.questionNumber : index + 1}{question.examDate ? ` (${question.examDate})` : ''}</p>
      
      <p className="font-semibold mb-3 whitespace-pre-wrap">{question.content || "문제 내용 없음"}</p>
      
      {question.images && question.images.length > 0 && (
        <div className="mb-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {question.images.map((img, imgIndex) => (
            <div key={img.hash || imgIndex} className="cursor-pointer border rounded overflow-hidden hover:opacity-80" onClick={() => onImageZoom(getImageUrl(img.url))}>
              <CommonImage src={getImageUrl(img.url)} alt={`문제 ${question.questionNumber !== undefined ? question.questionNumber : index + 1} 이미지 ${imgIndex + 1}`} className="w-full h-auto object-contain max-h-40" containerClassName="w-full" />
            </div>
          ))}
        </div>
      )}

      {optionsToDisplay && optionsToDisplay.map((opt, i) => {
        const isSelected = userAnswer === i;
        const isCorrect = correctAnswerIndex === i;

        let optionStyle = "cursor-pointer hover:bg-blue-50 border-gray-300";
        if (showAnswer && isCorrect) {
          optionStyle = "ring-2 ring-green-500 border-green-500 bg-green-50";
        }
        if (isSelected) {
          if (showAnswer) {
            optionStyle = isCorrect ? "bg-green-100 border-green-500 text-green-800 font-semibold"
                                  : "bg-red-100 border-red-500 text-red-800 font-semibold";
          } else {
            optionStyle = "bg-blue-100 border-blue-500 text-blue-800 font-semibold";
          }
        }
        
        return (
          <div 
            key={`q${question.id}-opt-${i}`} 
            className={`p-3 my-2 border rounded-md transition-all duration-150 ${optionStyle}`}
            onClick={() => onOptionSelect && onOptionSelect(i)}
          >
            <span className="mr-2 font-medium">{i + 1}.</span>
            <span className="whitespace-pre-wrap">{opt.text}</span>
            {opt.images && opt.images.length > 0 && (
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {opt.images.map((img, imgIdx) => (
                  <div key={img.hash || imgIdx} className="cursor-pointer border rounded overflow-hidden hover:opacity-80" onClick={(e) => { e.stopPropagation(); onImageZoom(getImageUrl(img.url)); }}>
                    <CommonImage src={getImageUrl(img.url)} alt={`선택지 ${i+1} 이미지 ${imgIdx + 1}`} className="w-full h-auto object-contain max-h-32" containerClassName="w-full" />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {showExplanation && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
          <p className="font-semibold text-gray-700 mb-1">해설</p>
          {question.explanation ? (
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{question.explanation}</p>
          ) : (
            <p className="text-sm text-gray-500">해설 정보가 없습니다.</p>
          )}
          {question.explanationImages && question.explanationImages.length > 0 && (
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {question.explanationImages.map((img, imgIdx) => (
                <div key={img.hash || imgIdx} className="cursor-pointer border rounded overflow-hidden hover:opacity-80" onClick={() => onImageZoom(getImageUrl(img.url))}>
                  <CommonImage src={getImageUrl(img.url)} alt={`해설 이미지 ${imgIdx + 1}`} className="w-full h-auto object-contain max-h-40" containerClassName="w-full" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function StudyPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [originalPagesData, setOriginalPagesData] = useState<IQuestion[][]>([]); // 페이지별 원본 데이터
  const [displayPageSegments, setDisplayPageSegments] = useState<IQuestion[][]>([]); // 화면 표시용 페이지 세그먼트

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const [decodedExamName, setDecodedExamName] = useState<string>('');
  const [studyModeParam, setStudyModeParam] = useState<string | null>(null);
  const [studyMode, setStudyMode] = useState<'date' | 'subject' | null>(null);

  const [currentExamSubject, setCurrentExamSubject] = useState<string | undefined>(undefined);

  const [showExplanation, setShowExplanation] = useState<Record<string, boolean>>({});
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [showAllExplanations, setShowAllExplanations] = useState(false);
  const [isSingleViewMode, setIsSingleViewMode] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showIndividualAnswer, setShowIndividualAnswer] = useState<Record<string, boolean>>({});
  const [isShuffled, setIsShuffled] = useState(false); // 선택지 섞기용 (기존 유지)
  const [userAnswers, setUserAnswers] = useState<Record<string, number | null>>({});
  const [isShuffleModeActive, setIsShuffleModeActive] = useState(false); // 새로운 문제 섞기 모드 상태
  const [previousShuffledListLength, setPreviousShuffledListLength] = useState(0); // 자동 넘김용
  const [shouldAutoAdvance, setShouldAutoAdvance] = useState(false); // 자동 넘김용
  const [isApiRandomized, setIsApiRandomized] = useState(false); // API가 랜덤 순서로 제공했는지 여부

  // shuffledQuestionsList, displayedQuestions를 사용하는 콜백들보다 먼저 정의
  const shuffledQuestionsList = useMemo(() => {
    // displayPageSegments는 이미 페이지 로드 시점의 isShuffleModeActive 상태에 따라 섞여있거나 원본임
    // 따라서 여기서는 단순히 모든 세그먼트를 합치기만 함
    return displayPageSegments.flat();
  }, [displayPageSegments]);

  const displayedQuestions = useMemo(() => {
    if (isSingleViewMode) {
      return shuffledQuestionsList.length > 0 ? [shuffledQuestionsList[currentQuestionIndex]] : [];
    }
    return shuffledQuestionsList;
  }, [isSingleViewMode, shuffledQuestionsList, currentQuestionIndex]);

  const currentDisplayQuestionsRef = React.useRef(displayedQuestions);
  useEffect(() => {
    currentDisplayQuestionsRef.current = displayedQuestions;
  }, [displayedQuestions]);

  const shuffledOptionsData = useMemo(() => {
    if (!isShuffled) return null;
    // 전체 문제 목록 (shuffledQuestionsList) 기준으로 선택지 섞기 데이터 생성
    const allQuestionsForOptions = displayPageSegments.flat(); 
    return allQuestionsForOptions.map(question => {
      if (!question.options || question.options.length === 0) {
        return { questionId: question.id, shuffledOptions: [], newAnswerIndex: -1 };
      }
      const originalOptions: IOption[] = question.options;
      const originalCorrectOption = originalOptions[question.answer];
      const shuffledOptions = shuffleArray(originalOptions);
      const newAnswerIndex = shuffledOptions.findIndex((opt: IOption) => opt.text === originalCorrectOption.text && JSON.stringify(opt.images) === JSON.stringify(originalCorrectOption.images));
      return { questionId: question.id, shuffledOptions, newAnswerIndex };
    });
  }, [displayPageSegments, isShuffled]); // 의존성 변경

  const normalizeImages = useCallback((imgs: any): { url: string; hash: string }[] => {
    if (Array.isArray(imgs)) { return imgs.map((img) => typeof img === 'string' ? { url: img, hash: "" } : (img && typeof img.url === 'string' ? img : {url:'', hash:''})); }
    if (typeof imgs === 'string' && imgs.startsWith('{') && imgs.endsWith('}')) { return imgs.slice(1, -1).split(',').filter(url => url.trim() !== '').map((url: string) => ({ url: url.trim(), hash: '' }));}
    return [];
  }, []);

  const fetchQuestionsForPage = useCallback(async (examName: string, mode: 'date' | 'subject', paramValue: string, pageToFetch: number, initialRandomStart?: boolean) => {
    if (!examName || !mode || !paramValue) {
      console.log("[fetchQuestionsForPage] Aborted: examName, mode, or paramValue is missing", { examName, mode, paramValue });
      setOriginalPagesData([]);
      setDisplayPageSegments([]);
      setTotalPages(1);
      setLoading(false);
      setLoadingMore(false);
      setCurrentExamSubject(undefined);
      return;
    }

    if (pageToFetch === 1) {
      setLoading(true);
      setOriginalPagesData([]);
      setDisplayPageSegments([]);
      setCurrentPage(1);
    } else {
      setLoadingMore(true);
    }
    setCurrentExamSubject(undefined); // 이 위치는 적절한가?

    try {
      const tags: string[] = [`시험명:${examName}`];
      const queryParams = new URLSearchParams({
        page: pageToFetch.toString(),
        limit: mode === 'subject' ? SUBJECT_QUESTIONS_PER_PAGE.toString() : "20"
      });

      if (mode === 'date') {
        tags.push(`날짜:${paramValue}`);
      } else if (mode === 'subject') {
        const individualSubjects = paramValue.split(',').map(s => s.trim()).filter(s => s.length > 0);
        individualSubjects.forEach(subject => {
          tags.push(`과목:${subject}`);
        });
      }

      queryParams.append('tags', tags.join(','));

      // API에 randomStart 파라미터 추가 (페이지 초기 로드 시 또는 필요한 경우)
      if (pageToFetch === 1 && initialRandomStart) {
        queryParams.append('randomStart', 'true');
      }

      const response = await fetch(`/api/questions?${queryParams.toString()}`, { cache: 'no-store' });
      console.log("[fetchQuestionsForPage] API URL:", `/api/questions?${queryParams.toString()}`);
      console.log("[fetchQuestionsForPage] API Response Status:", response.status, "for", { examName, mode, paramValue, pageToFetch });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Error fetching data" }));
        console.error("[fetchQuestionsForPage] API Error Data:", errorData, "for", { examName, mode, paramValue, pageToFetch });
        throw new Error(errorData.message || `Failed to load questions for ${examName} (${mode}: ${paramValue})`);
      }
      const data: { questions: IQuestion[], totalQuestions: number, totalPages: number, page: number, limit: number } = await response.json();
      console.log("[fetchQuestionsForPage] API Data Received (count):", data.questions?.length, "for", { examName, mode, paramValue, pageToFetch });
      
      let processedNewQuestionsPage = (data.questions || []).map((q: IQuestion) => ({ 
        ...q, 
        images: normalizeImages(q.images), 
        explanationImages: normalizeImages(q.explanationImages), 
        options: (q.options || []).map((opt: IOption) => ({...opt, images: normalizeImages(opt.images)}))
      }));

      // 원본 데이터 저장
      setOriginalPagesData(prevPages => {
        const newPages = [...prevPages];
        newPages[pageToFetch -1] = processedNewQuestionsPage;
        return newPages;
      });
      
      // 화면 표시용 데이터 업데이트
      setDisplayPageSegments(prevSegments => {
        const newSegments = [...prevSegments];
        // API가 이미 랜덤으로 줬거나 (initialRandomStart && pageToFetch === 1) 또는 문제 섞기 모드가 활성화된 경우 섞음
        // 단, isApiRandomized가 true이면, API가 이미 전체적으로 섞었으므로 추가로 섞지 않음.
        const shouldShuffleThisSegment = isApiRandomized ? false : (isShuffleModeActive);
        const segmentToDisplay = (pageToFetch === 1 && initialRandomStart) || shouldShuffleThisSegment 
                                 ? shuffleArray([...processedNewQuestionsPage]) 
                                 : processedNewQuestionsPage;
        newSegments[pageToFetch -1] = segmentToDisplay;
        return newSegments;
      });
      
      if (mode === 'date') {
        // 첫 페이지의 첫 문제 과목으로 설정 (만약 과목 정보가 있다면)
        if (pageToFetch === 1 && processedNewQuestionsPage.length > 0 && processedNewQuestionsPage[0].examSubject) {
          setCurrentExamSubject(processedNewQuestionsPage[0].examSubject);
        } else if (pageToFetch === 1) {
           setCurrentExamSubject(paramValue); // Fallback to paramValue if no subject in question
        }
        // '더 보기'의 경우, currentExamSubject는 일반적으로 변경되지 않음 (페이지 타이틀은 고정된 시험/날짜/과목명을 표시)
      } else if (mode === 'subject') {
        setCurrentExamSubject(paramValue); // 과목 모드에서는 항상 paramValue (선택된 과목들)로 설정
      }

      setTotalPages(data.totalPages || 1);
      setCurrentPage(pageToFetch);
      
      if (pageToFetch === 1) {
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setShowExplanation({});
        setShowIndividualAnswer({});
      } else {
        // "더 보기" 로직은 handleNextQuestion의 useEffect에서 처리되므로 여기서는 특별한 인덱스 조정 불필요
      }

    } catch (error) { 
      toast({ title: "데이터 로딩 오류", description: error instanceof Error ? error.message : "문제를 불러오는데 실패했습니다." }); 
      if (pageToFetch === 1) {
        setOriginalPagesData([]);
        setDisplayPageSegments([]);
      }
      setTotalPages(1); 
    }
    finally { 
      if (pageToFetch === 1) setLoading(false);
      setLoadingMore(false);
    }
  }, [toast, normalizeImages, isShuffleModeActive, isApiRandomized]); // isApiRandomized 의존성 추가

  // handleLoadMore를 handleNextQuestion보다 먼저 정의
  const handleLoadMore = useCallback(() => {
    // 페이지 전체를 새로고침하여 새로운 문제를 로드
    setLoadingMore(true); // 로딩 상태 표시 (선택 사항)
    window.location.reload();
  }, []); // 의존성 배열 비우거나 필요한 최소한의 것만 남김

  useEffect(() => {
    const examNameFromPath = params?.examName as string | undefined;
    const dateQueryParam = searchParams?.get('date');
    const subjectsQueryParam = searchParams?.get('subjects');
    const randomStartQueryParam = searchParams?.get('randomStart') === 'true';

    setIsApiRandomized(randomStartQueryParam); // API 랜덤 여부 설정

    if (examNameFromPath) {
      try {
        const name = decodeURIComponent(examNameFromPath);
        setDecodedExamName(name);

        // isShuffleModeActive는 URL 파라미터로 설정되지 않으므로, 페이지 로드 시 기본값(false) 또는 이전 상태 유지
        if (randomStartQueryParam) {
          setIsShuffleModeActive(true); // API가 랜덤이면 UI상 섞기 모드도 활성화된 것처럼 표시
        }

        if (dateQueryParam) {
          const dateStr = decodeURIComponent(dateQueryParam);
          setStudyMode('date');
          setStudyModeParam(dateStr);
          fetchQuestionsForPage(name, 'date', dateStr, 1, randomStartQueryParam);
        } else if (subjectsQueryParam) {
          const subjectsStr = decodeURIComponent(subjectsQueryParam);
          setStudyMode('subject');
          setStudyModeParam(subjectsStr);
          fetchQuestionsForPage(name, 'subject', subjectsStr, 1, randomStartQueryParam);
        } else {
          toast({ title: "정보 부족", description: "URL에 날짜 또는 과목 정보가 누락되었습니다." });
          setLoading(false);
          setOriginalPagesData([]);
          setDisplayPageSegments([]);
        }
      } catch (e) {
        console.error("Error decoding URL params or fetching data:", e);
        toast({ title: "오류 발생", description: "페이지를 로드하는 중 오류가 발생했습니다." });
        setLoading(false);
        setOriginalPagesData([]);
        setDisplayPageSegments([]);
      }
    } else {
      toast({ title: "시험 정보 없음", description: "시험명을 URL에서 찾을 수 없습니다." });
      setLoading(false);
      setOriginalPagesData([]);
      setDisplayPageSegments([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, searchParams, toast]); // fetchQuestionsForPage 의존성 제거 (내부에서 isShuffleModeActive 사용)

  const toggleExplanationHandler = (questionId: string | undefined) => {
    if (!questionId) return;
    setShowExplanation(prev => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const handleToggleShowAllAnswers = () => setShowAllAnswers(prev => !prev);

  const handleToggleShowAllExplanations = () => {
    const nextShowState = !showAllExplanations;
    setShowAllExplanations(nextShowState);
    const newShowExplanation: Record<string, boolean> = {};
    shuffledQuestionsList.forEach(q => { if (q.id) { newShowExplanation[q.id] = nextShowState; } }); // questions -> shuffledQuestionsList
    setShowExplanation(newShowExplanation);
  };

  const handleToggleSingleViewMode = () => {
    setIsSingleViewMode(prev => !prev);
  };

  const toggleIndividualAnswerHandler = (questionId: string | undefined) => {
    if (!questionId) return;
    setShowIndividualAnswer(prev => ({ ...prev, [questionId]: !prev[questionId] }));
  };
  
  const handlePrevQuestion = useCallback(() => {
    setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
  }, []);

  const handleNextQuestion = useCallback(() => {
    const lastIndexOfCurrentList = shuffledQuestionsList.length - 1;
    if (currentQuestionIndex < lastIndexOfCurrentList) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (currentQuestionIndex === lastIndexOfCurrentList && isSingleViewMode) {
      // 한 문제씩 보기 모드에서 마지막 문제일 경우, API를 통해 새 문제 로드
      if (decodedExamName && studyMode && studyModeParam && !loadingMore) {
        setLoadingMore(true); // 로딩 상태 표시
        // fetchQuestionsForPage는 pageToFetch=1일 때 currentQuestionIndex를 0으로 설정함
        fetchQuestionsForPage(decodedExamName, studyMode, studyModeParam, 1, isApiRandomized);
        // shouldAutoAdvance 및 previousShuffledListLength 관련 로직은 여기서는 불필요
      }
    } else if (currentQuestionIndex === lastIndexOfCurrentList && !isSingleViewMode) {
      // 목록 보기 모드에서 마지막 문제 개념은 없으며, "새 문제 로드" 버튼은 handleLoadMore를 직접 사용
      // 이 조건은 사실상 도달하지 않거나, handleLoadMore와 동일하게 페이지 새로고침을 할 수 있으나
      // 현재 버튼 구조상 이 경로로 진입하지 않음. (한 문제씩 보기의 다음 버튼만 이 함수 사용)
      // 만약 다른 경로로 이 함수가 호출될 경우를 대비해 로깅 또는 명확한 처리 추가 가능
      console.log("handleNextQuestion called in list mode at the end, this shouldn't happen via Next button.");
    }
  }, [
    shuffledQuestionsList,
    currentQuestionIndex,
    isSingleViewMode,
    decodedExamName,
    studyMode,
    studyModeParam,
    loadingMore,
    fetchQuestionsForPage,
    isApiRandomized,
    setCurrentQuestionIndex, // setLoadingMore는 fetchQuestionsForPage 내부 finally에서 false로 처리됨
  ]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (isSingleViewMode) {
      if (event.key === 'ArrowLeft') {
        handlePrevQuestion();
      } else if (event.key === 'ArrowRight') {
        handleNextQuestion();
      }
    }
  }, [isSingleViewMode, handlePrevQuestion, handleNextQuestion]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  const handleToggleShuffle = useCallback(() => {
    setIsShuffled(prev => !prev);
  }, []);

  const handleToggleQuestionsShuffle = useCallback(() => {
    if (isApiRandomized) {
      // API가 이미 전체 문제를 랜덤으로 제공한 경우, 프론트엔드에서 추가 섞기/해제 불가
      toast({ title: "알림", description: "문제 순서가 이미 랜덤으로 시작되어 변경할 수 없습니다." });
      return;
    }

    setIsShuffleModeActive(prevActive => {
      const nextActive = !prevActive;
      
      // originalPagesData를 기반으로 displayPageSegments를 재구성
      setDisplayPageSegments(currentOriginalPages => {
        return currentOriginalPages.map(pageOfQuestions => {
          return nextActive ? shuffleArray([...pageOfQuestions]) : pageOfQuestions;
        });
      });

      // 섞기 모드 변경 시 사용자 답변 및 개별 상태 초기화
      setUserAnswers({});
      setShowIndividualAnswer({});
      setShowExplanation({});
      setCurrentQuestionIndex(0); // 첫 문제로 이동
      return nextActive;
    });
  }, [isApiRandomized]); // 의존성: originalPagesData는 setDisplayPageSegments 콜백 내에서 최신 상태를 참조하므로 명시적 의존성 불필요할 수 있으나, 안정성을 위해 추가 고려 가능
  
  const handleOptionSelect = (questionId: string | undefined, optionIndex: number) => {
    if (!questionId) return;
    setUserAnswers(prev => ({...prev, [questionId]: optionIndex }));
  };

  // 자동 다음 문제 이동 로직 (기존 위치 유지 또는 handleImageZoom 위로 이동 가능)
  useEffect(() => {
    if (shouldAutoAdvance && !loadingMore) {
      if (shuffledQuestionsList.length > previousShuffledListLength) {
        setCurrentQuestionIndex(previousShuffledListLength); // 새로 로드된 세그먼트의 첫 문제로 이동
      }
      setShouldAutoAdvance(false); // 플래그 리셋
    }
  }, [shuffledQuestionsList, loadingMore, shouldAutoAdvance, previousShuffledListLength, setCurrentQuestionIndex, setShouldAutoAdvance]); // 의존성 배열에 shuffledQuestionsList가 이미 있음

  const handleImageZoom = (url: string) => setZoomedImage(url);
  const closeImageZoom = () => setZoomedImage(null);

  const breadcrumbItems = useMemo<BreadcrumbItem[]>(() => {
    const baseItems: BreadcrumbItem[] = [
      { label: '홈', href: '/' },
      { label: '문제 은행', href: '/learn/exams' },
    ];
    if (decodedExamName) {
      baseItems.push({ label: decodedExamName, href: `/learn/exams/${encodeURIComponent(decodedExamName)}` });
      if (studyMode && studyModeParam) {
        let studyModeLabel = '';
        if (studyMode === 'date') {
          studyModeLabel = studyModeParam;
        } else if (studyMode === 'subject') {
          studyModeLabel = studyModeParam.split(',').join(', ');
          if (studyModeLabel.length > 30) {
            studyModeLabel = `${studyModeLabel.substring(0, 27)}...`;
          }
        }
        baseItems.push({ label: studyModeLabel, isCurrent: true });
      } else {
        baseItems.push({ label: '학습 모드 선택 중...', isCurrent: true });
      }
    } else {
      baseItems.push({ label: '시험 정보 로딩 중...', isCurrent: true });
    }
    return baseItems;
  }, [decodedExamName, studyMode, studyModeParam]);

  const handlePageChange = (newPage: number) => {
    // ... 기존 코드 ...
  };

  if (loading) return <div className="container mx-auto p-4 text-center">로딩 중...</div>;
  if (!loading && (!decodedExamName || !studyMode || !studyModeParam)) { 
    return (
        <div className="container mx-auto p-4 text-center">
            <Breadcrumb items={breadcrumbItems} />
            <p className="mt-4">잘못된 접근입니다. 시험 정보, 날짜 또는 과목 정보가 URL에 올바르게 설정되지 않았습니다.</p>
        </div>
    );
  }
  if (!loading && shuffledQuestionsList.length === 0 && decodedExamName && studyModeParam) return ( // questions.length -> shuffledQuestionsList.length
    <div className="container mx-auto p-4">
      <Breadcrumb items={breadcrumbItems} />
      <StudyPageHeader
        title={`${decodedExamName} - ${studyMode === 'date' ? `날짜: ${studyModeParam}` : `과목: ${currentExamSubject || studyModeParam}`}`}
        showAllAnswers={false} onToggleShowAllAnswers={() => {}}
        showAllExplanations={false} onToggleShowAllExplanations={() => {}}
        isSingleViewMode={false} onToggleSingleViewMode={() => {}}
        isShuffled={false} onToggleShuffle={() => {}} // 이 isShuffled는 선택지 섞기용.
        isQuestionsShuffled={isShuffleModeActive} // props 이름 일치 및 새 상태 사용
        onToggleQuestionsShuffle={handleToggleQuestionsShuffle}
        isQuestionsShuffleDisabled={isApiRandomized} // API 랜덤 시 버튼 비활성화
        showControls={false}
      />
      <p className="text-center py-8 text-gray-600">해당 조건의 문제 데이터가 없습니다.</p>
    </div>
  );
  
  return (
    <div className="container mx-auto p-4">
      {zoomedImage && <ImageZoomModal imageUrl={zoomedImage} onClose={closeImageZoom} />}

      <Breadcrumb items={breadcrumbItems} />
      
      <StudyPageHeader
        title={`${decodedExamName} - ${studyMode === 'date' ? `날짜: ${studyModeParam}` : `과목: ${currentExamSubject || studyModeParam}`}`}
        showAllAnswers={showAllAnswers}
        onToggleShowAllAnswers={handleToggleShowAllAnswers}
        showAllExplanations={showAllExplanations}
        onToggleShowAllExplanations={handleToggleShowAllExplanations}
        isSingleViewMode={isSingleViewMode}
        onToggleSingleViewMode={handleToggleSingleViewMode}
        isShuffled={isShuffled} // 선택지 섞기 상태 전달
        onToggleShuffle={handleToggleShuffle} // 선택지 섞기 핸들러 전달
        isQuestionsShuffled={isShuffleModeActive} // 문제 목록 섞기 상태 전달
        onToggleQuestionsShuffle={handleToggleQuestionsShuffle} // 문제 목록 섞기 핸들러 전달
        isQuestionsShuffleDisabled={isApiRandomized} // API 랜덤 시 버튼 비활성화
        currentQuestionNumber={isSingleViewMode ? currentQuestionIndex + 1 : undefined}
        totalQuestions={isSingleViewMode ? shuffledQuestionsList.length : undefined}
        onPrev={isSingleViewMode ? handlePrevQuestion : undefined}
        onNext={isSingleViewMode ? handleNextQuestion : undefined}
        showControls={shuffledQuestionsList.length > 0}
      />

      {loading && <p className="text-center py-8">문제 로딩 중...</p>}
      {!loading && shuffledQuestionsList.length === 0 && (
        <p className="text-center py-8 text-gray-600">표시할 문제가 없습니다.</p>
      )}

      {!loading && shuffledQuestionsList.length > 0 && (
        <>
          {isSingleViewMode ? (
            <>
              {shuffledQuestionsList[currentQuestionIndex]?.examSubject && (
                <div className="mt-4 mb-2 p-3 bg-gray-50 rounded-md border border-gray-200">
                  <h2 className="text-md font-semibold text-gray-700">
                    과목: {shuffledQuestionsList[currentQuestionIndex].examSubject}
                  </h2>
                </div>
              )}
              {displayedQuestions.map((question) => (
                <StudyQuestionCard
                  key={question.id}
                  question={question}
                  index={currentQuestionIndex}
                  onImageZoom={handleImageZoom}
                  showAnswer={showAllAnswers || (question.id ? !!showIndividualAnswer[question.id] : false)}
                  showExplanation={showAllExplanations || (question.id ? !!showExplanation[question.id] : false)}
                  onOptionSelect={(optionIndex) => question.id && handleOptionSelect(question.id, optionIndex)}
                  userAnswer={question.id ? userAnswers[question.id] : null}
                  shuffledOptions={shuffledOptionsData ? shuffledOptionsData.find(d => d.questionId === question.id)?.shuffledOptions : undefined}
                  shuffledAnswerIndex={shuffledOptionsData ? shuffledOptionsData.find(d => d.questionId === question.id)?.newAnswerIndex : undefined}
                />
              ))}
            </>
          ) : (
            displayedQuestions.map((question, idx) => {
              const prevQuestion = idx > 0 ? displayedQuestions[idx - 1] : null;
              const showSubjectHeader = !prevQuestion || (question.examSubject !== prevQuestion.examSubject);

              const currentShuffledData = isShuffled && shuffledOptionsData ? 
                                        shuffledOptionsData.find(d => d.questionId === question.id) : 
                                        null;

              const optionsToRender = currentShuffledData ? currentShuffledData.shuffledOptions : question.options;
              const answerToUse = currentShuffledData ? currentShuffledData.newAnswerIndex : question.answer;
              const individualShowAnswer = (question.id && showIndividualAnswer[question.id]) || showAllAnswers;
              const individualShowExplanation = (question.id && showExplanation[question.id]) || showAllExplanations;

              return (
                <React.Fragment key={question.id || idx}>
                  {showSubjectHeader && question.examSubject && (
                    <div className="mt-8 mb-4 pt-3 pb-2 border-t border-b border-gray-200 bg-gray-50 rounded-md">
                      <h2 className="text-lg font-semibold text-gray-700 px-4">
                        과목: {question.examSubject}
                      </h2>
                    </div>
                  )}
                  <StudyQuestionCard
                    question={question}
                    index={idx}
                    onImageZoom={handleImageZoom}
                    showAnswer={answerToUse !== undefined && individualShowAnswer}
                    showExplanation={individualShowExplanation}
                    onOptionSelect={(optionIndex) => question.id && handleOptionSelect(question.id, optionIndex)}
                    userAnswer={question.id ? userAnswers[question.id || ''] : null}
                    shuffledOptions={optionsToRender}
                    shuffledAnswerIndex={answerToUse}
                  />
                </React.Fragment>
              );
            })
          )}
          
          {isSingleViewMode && shuffledQuestionsList.length > 1 && (
            <div className="flex justify-between items-center mt-6 mb-2">
              <Button onClick={handlePrevQuestion} disabled={currentQuestionIndex === 0} variant="outline">
                이전 문제
              </Button>
              <p className="text-sm text-gray-600">
                {currentQuestionIndex + 1} / {shuffledQuestionsList.length}
              </p>
              <Button 
                onClick={handleNextQuestion} 
                disabled={currentQuestionIndex === shuffledQuestionsList.length - 1 && !loadingMore} 
                variant="outline">
                {currentQuestionIndex === shuffledQuestionsList.length - 1 && !loadingMore
                  ? (loadingMore ? "로딩 중..." : "새 문제 로드") 
                  : "다음 문제"}
              </Button>
            </div>
          )}
        </>
      )}

      {!isSingleViewMode && shuffledQuestionsList.length > 0 && ( 
        <div className="text-center mt-8 mb-4">
          <Button onClick={handleLoadMore} disabled={loadingMore} variant="outline">
            {loadingMore ? "새 문제 로딩 중..." : "새 문제 로드"}
          </Button>
        </div>
      )}
      {loadingMore && (
        <p className="text-center py-4 text-gray-500">추가 문제 로딩 중...</p>
      )}
    </div>
  );
} 