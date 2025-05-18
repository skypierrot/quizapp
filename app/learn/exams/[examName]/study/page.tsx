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
      <p className="text-xs text-gray-500 mb-2">문제 {question.questionNumber !== undefined ? question.questionNumber : index + 1}</p>
      
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
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [isShuffled, setIsShuffled] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, number | null>>({});

  const shuffledOptionsData = useMemo(() => {
    if (!isShuffled) return null;
    return questions.map(question => {
      if (!question.options || question.options.length === 0) {
        return { questionId: question.id, shuffledOptions: [], newAnswerIndex: -1 };
      }
      const originalOptions: IOption[] = question.options;
      const originalCorrectOption = originalOptions[question.answer];
      const shuffledOptions = shuffleArray(originalOptions);
      const newAnswerIndex = shuffledOptions.findIndex((opt: IOption) => opt.text === originalCorrectOption.text && JSON.stringify(opt.images) === JSON.stringify(originalCorrectOption.images));
      return { questionId: question.id, shuffledOptions, newAnswerIndex };
    });
  }, [questions, isShuffled]);

  const normalizeImages = useCallback((imgs: any): { url: string; hash: string }[] => {
    if (Array.isArray(imgs)) { return imgs.map((img) => typeof img === 'string' ? { url: img, hash: "" } : (img && typeof img.url === 'string' ? img : {url:'', hash:''})); }
    if (typeof imgs === 'string' && imgs.startsWith('{') && imgs.endsWith('}')) { return imgs.slice(1, -1).split(',').filter(url => url.trim() !== '').map((url: string) => ({ url: url.trim(), hash: '' }));}
    return [];
  }, []);

  const fetchQuestions = useCallback(async (examName: string, mode: 'date' | 'subject', paramValue: string, currentPageValue: number) => {
    if (!examName || !mode || !paramValue) {
      console.log("[fetchQuestions] Aborted: examName, mode, or paramValue is missing", { examName, mode, paramValue });
      setQuestions([]);
      setTotalPages(1);
      setLoading(false);
      setCurrentExamSubject(undefined);
      return;
    }
    setLoading(true);
    setCurrentExamSubject(undefined);
    try {
      const tags: string[] = [`시험명:${examName}`];
      const queryParams = new URLSearchParams({
        page: currentPageValue.toString(),
        limit: "0"
      });

      if (mode === 'date') {
        tags.push(`날짜:${paramValue}`);
      }
      queryParams.append('tags', tags.join(','));

      if (mode === 'subject') {
        queryParams.append('subjects', paramValue);
      }

      const response = await fetch(`/api/questions?${queryParams.toString()}`, { cache: 'no-store' });
      console.log("[fetchQuestions] API URL:", `/api/questions?${queryParams.toString()}`);
      console.log("[fetchQuestions] API Response Status:", response.status, "for", { examName, mode, paramValue });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Error fetching data" }));
        console.error("[fetchQuestions] API Error Data:", errorData, "for", { examName, mode, paramValue });
        throw new Error(errorData.message || `Failed to load questions for ${examName} (${mode}: ${paramValue})`);
      }
      const data: { questions: IQuestion[], totalPages: number, currentPage: number } = await response.json();
      console.log("[fetchQuestions] API Data Received (count):", data.questions?.length, "for", { examName, mode, paramValue });
      
      let processedQuestions = (data.questions || []).map((q: IQuestion) => ({ 
        ...q, 
        images: normalizeImages(q.images), 
        explanationImages: normalizeImages(q.explanationImages), 
        options: (q.options || []).map((opt: IOption) => ({...opt, images: normalizeImages(opt.images)}))
      }));

      const questionIds = processedQuestions.map(q => q.id);
      const duplicateIds = questionIds.filter((id, index) => questionIds.indexOf(id) !== index);
      if (duplicateIds.length > 0) {
        console.warn("[fetchQuestions] !!! 중복된 문제 ID 발견 !!!:", duplicateIds);
      }

      setQuestions(processedQuestions);
      if (processedQuestions.length > 0 && processedQuestions[0].examSubject) {
        setCurrentExamSubject(processedQuestions[0].examSubject);
      } else {
        setCurrentExamSubject(undefined);
      }
      setTotalPages(data.totalPages || 1);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setShowExplanation({});
      setShowIndividualAnswer({});
    } catch (error) { 
      toast({ title: "데이터 로딩 오류", description: error instanceof Error ? error.message : "문제를 불러오는데 실패했습니다." }); 
      setQuestions([]); 
      setTotalPages(1); 
    }
    finally { setLoading(false); }
  }, [toast, normalizeImages]);

  useEffect(() => {
    const examNameFromPath = params?.examName as string | undefined;
    const dateQueryParam = searchParams?.get('date');

    if (examNameFromPath) {
      try {
        const name = decodeURIComponent(examNameFromPath);
        setDecodedExamName(name);

        if (dateQueryParam) {
          const dateStr = decodeURIComponent(dateQueryParam);
          setStudyMode('date');
          setStudyModeParam(dateStr);
          fetchQuestions(name, 'date', dateStr, currentPage);
        } else {
          toast({ title: "정보 부족", description: "URL에 날짜 또는 과목 정보가 누락되었습니다." });
          setLoading(false);
          setQuestions([]);
        }
      } catch (e) {
        console.error("Error decoding URL params in useEffect:", e);
        toast({ title: "URL 오류", description: "시험 정보 또는 날짜/과목 정보를 URL에서 올바르게 읽어올 수 없습니다." });
        setLoading(false);
        setDecodedExamName('');
        setStudyModeParam(null);
        setStudyMode(null);
        setQuestions([]);
      }
    } else {
      toast({ title: "정보 부족", description: "URL에 시험명 정보가 누락되었습니다." });
      setLoading(false);
      setQuestions([]);
    }
  }, [params, searchParams, currentPage, fetchQuestions, toast]);

  const toggleExplanationHandler = (questionId: string | undefined) => {
    if (!questionId) return;
    setShowExplanation(prev => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const handleToggleShowAllAnswers = () => setShowAllAnswers(prev => !prev);

  const handleToggleShowAllExplanations = () => {
    const nextShowState = !showAllExplanations;
    setShowAllExplanations(nextShowState);
    const newShowExplanation: Record<string, boolean> = {};
    questions.forEach(q => { if (q.id) { newShowExplanation[q.id] = nextShowState; } });
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
    setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1));
  }, [questions.length]);

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
  
  const handleOptionSelect = (questionId: string | undefined, optionIndex: number) => {
    if (!questionId) return;
    setUserAnswers(prev => ({...prev, [questionId]: optionIndex }));
  };

  const displayedQuestions = useMemo(() => {
    if (isSingleViewMode) {
      return questions.length > 0 ? [questions[currentQuestionIndex]] : [];
    }
    return questions;
  }, [isSingleViewMode, questions, currentQuestionIndex]);

  const handleImageZoom = (url: string) => setZoomedImage(url);
  const closeImageZoom = () => setZoomedImage(null);

  const breadcrumbItems: BreadcrumbItem[] = useMemo(() => {
    const items: BreadcrumbItem[] = [
        { label: "홈", href: "/" }, 
        { label: "시험별 학습", href: "/learn/exams" }
    ];
    if (decodedExamName) {
        items.push({ label: decodedExamName, href: `/learn/exams/${encodeURIComponent(decodedExamName)}` });
        if (studyMode === 'date' && studyModeParam) {
            items.push({ label: `날짜: ${studyModeParam}`, isCurrent: true });
        } else {
            items.push({ label: "학습 세션", isCurrent: true });
        }
    } else {
        items.push({ label: "학습 세션 로딩 중...", isCurrent: true });
    }
    return items;
  }, [decodedExamName, studyMode, studyModeParam]);

  if (loading) return <div className="container mx-auto p-4 text-center">로딩 중...</div>;
  if (!decodedExamName || !studyMode || !studyModeParam) { 
    return (
        <div className="container mx-auto p-4 text-center">
            <Breadcrumb items={breadcrumbItems} />
            <p className="mt-4">잘못된 접근입니다. 시험 정보, 날짜 또는 과목 정보가 URL에 올바르게 설정되지 않았습니다.</p>
        </div>
    );
  }
  if (!loading && questions.length === 0) return (
    <div className="container mx-auto p-4">
      <Breadcrumb items={breadcrumbItems} />
      <h1 className="text-2xl font-bold my-4">
        {decodedExamName} - {studyMode === 'date' && studyModeParam ? `날짜: ${studyModeParam}` : '과목 학습'}
      </h1>
      <p>해당 조건의 문제 데이터가 없습니다.</p>
    </div>
  );
  
  return (
    <div className="container mx-auto p-4">
      {zoomedImage && <ImageZoomModal imageUrl={zoomedImage} onClose={closeImageZoom} />}

      <Breadcrumb items={breadcrumbItems} />
      
      <StudyPageHeader
        title={`${decodedExamName} - ${studyMode === 'date' && studyModeParam ? `날짜: ${studyModeParam}` : '과목 학습'}`}
        showAllAnswers={showAllAnswers}
        onToggleShowAllAnswers={handleToggleShowAllAnswers}
        showAllExplanations={showAllExplanations}
        onToggleShowAllExplanations={handleToggleShowAllExplanations}
        isSingleViewMode={isSingleViewMode}
        onToggleSingleViewMode={handleToggleSingleViewMode}
        isShuffled={isShuffled}
        onToggleShuffle={handleToggleShuffle}
        currentQuestionNumber={isSingleViewMode ? currentQuestionIndex + 1 : undefined}
        totalQuestions={isSingleViewMode ? questions.length : undefined}
        onPrev={isSingleViewMode ? handlePrevQuestion : undefined}
        onNext={isSingleViewMode ? handleNextQuestion : undefined}
        showControls={questions.length > 0}
      />

      {loading && <p className="text-center py-8">문제 로딩 중...</p>}
      {!loading && questions.length === 0 && (
        <p className="text-center py-8 text-gray-600">표시할 문제가 없습니다.</p>
      )}

      {!loading && questions.length > 0 && (
        <>
          {isSingleViewMode ? (
            displayedQuestions.map((question) => (
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
            ))
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
          
          {isSingleViewMode && questions.length > 1 && (
            <div className="flex justify-between items-center mt-6 mb-2">
              <Button onClick={handlePrevQuestion} disabled={currentQuestionIndex === 0} variant="outline">
                이전 문제
              </Button>
              <p className="text-sm text-gray-600">
                {currentQuestionIndex + 1} / {questions.length}
              </p>
              <Button onClick={handleNextQuestion} disabled={currentQuestionIndex === questions.length - 1} variant="outline">
                다음 문제
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
} 