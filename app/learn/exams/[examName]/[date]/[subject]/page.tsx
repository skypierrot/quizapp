'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { IQuestion, IOption } from '@/types';
import Breadcrumb, { BreadcrumbItem } from '@/components/common/Breadcrumb';
// import { QuestionDisplayCard } from '@/components/question/common/QuestionDisplayCard'; // 학습용 StudyQuestionCard 사용할 예정
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
import StudyPageHeader from '@/components/study/StudyPageHeader'; // 학습 페이지 헤더
import { shuffleArray } from '@/utils/array'; // 유틸리티 함수 경로 수정
import { ImageZoomModal } from '@/components/common/ImageZoomModal'; // 이미 정의되어 있을 수 있음, 확인 필요
import { getImageUrl } from "@/utils/image"; // getImageUrl 임포트 추가
import { CommonImage } from "@/components/common/CommonImage"; // CommonImage 임포트 추가

// ImageZoomModal은 이미 있을 경우 중복 정의 피하기 위해 주석 처리 또는 조건부 정의
// function ImageZoomModal({ imageUrl, onClose }: { imageUrl: string | null; onClose: () => void }) { ... }

// 학습용 카드 컴포넌트
const StudyQuestionCard = ({ question, index, page, onImageZoom, showAnswer, showExplanation, onOptionSelect, userAnswer }: {
  question: IQuestion;
  index: number; // 문제 번호 표시용 (0-based)
  page?: number; // 페이지네이션 시 문제 번호 계산용
  onImageZoom: (url: string) => void;
  showAnswer?: boolean; // 정답 즉시 공개 여부 (전체 토글 또는 개별)
  showExplanation?: boolean; // 해설 즉시 공개 여부 (전체 토글 또는 개별)
  onOptionSelect?: (optionIndex: number) => void; // 사용자가 선택지를 골랐을 때
  userAnswer?: number | null; // 사용자가 선택한 답변의 인덱스
}) => {
  const questionNumber = (page && page > 0 ? (page - 1) * 10 : 0) + index + 1;

  return (
    <div className="p-4 border rounded-lg bg-white shadow mb-4">
      <p className="text-xs text-gray-500 mb-2">문제 #{questionNumber}</p>
      
      {/* 문제 내용 */}
      <p className="font-semibold mb-3whitespace-pre-wrap">{question.content || "문제 내용 없음"}</p>
      
      {/* 문제 이미지 */}
      {question.images && question.images.length > 0 && (
        <div className="mb-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {question.images.map((img, imgIndex) => (
            <div key={img.hash || imgIndex} className="cursor-pointer border rounded overflow-hidden hover:opacity-80" onClick={() => onImageZoom(getImageUrl(img.url))}>
              <CommonImage src={getImageUrl(img.url)} alt={`문제 ${questionNumber} 이미지 ${imgIndex + 1}`} className="w-full h-auto object-contain max-h-40" containerClassName="w-full" />
            </div>
          ))}
        </div>
      )}

      {/* 선택지 */}
      {question.options && question.options.map((opt, i) => {
        const isSelected = userAnswer === i;
        const isCorrect = question.answer === i;
        const isUserCorrect = isSelected && isCorrect;
        const isUserIncorrect = isSelected && !isCorrect;

        let optionStyle = "cursor-pointer hover:bg-blue-50 border-gray-300";
        if (showAnswer && isCorrect) {
          optionStyle = "ring-2 ring-green-500 border-green-500 bg-green-50"; // 정답 항상 표시 (녹색 링)
        }
        if (isSelected) {
          optionStyle = isCorrect ? "bg-green-100 border-green-500 text-green-800 font-semibold" // 사용자가 맞춘 정답
                                : "bg-red-100 border-red-500 text-red-800 font-semibold";    // 사용자가 선택한 오답
        } else if (showAnswer && isCorrect && userAnswer !== undefined && userAnswer !== null && !isUserCorrect) {
          // 사용자가 다른 오답을 선택했을 때, 실제 정답을 부드럽게 표시 (예: 녹색 텍스트)
          // optionStyle += " text-green-700"; 
        }
        

        return (
          <div 
            key={opt.number || i} 
            className={`p-3 my-2 border rounded-md transition-all duration-150 ${optionStyle}`}
            onClick={() => onOptionSelect && onOptionSelect(i)}
          >
            <span className="mr-2 font-medium">{i + 1}.</span>
            <span className="whitespace-pre-wrap">{opt.text}</span>
            {/* 선택지 이미지 */}
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

      {/* 정답 및 해설 버튼 (개별 토글용 - 필요시 추가) */}
      {/* 
      <div className="mt-3 flex space-x-2">
        {!showAnswer && userAnswer !== undefined && userAnswer !== null && ( // 사용자가 답을 선택했고, 전체 정답보기가 아닐 때만 개별 정답 보기 버튼
          <Button variant="outline" size="sm" onClick={() => { 
            // 여기에 개별 정답 보기 상태를 토글하는 로직 필요 (부모 컴포넌트에서 핸들러 전달)
            // 예: onToggleIndividualAnswer(question.id) 
          }}>
            정답 확인
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => {
            // 여기에 개별 해설 보기 상태를 토글하는 로직 필요
            // 예: onToggleIndividualExplanation(question.id)
        }}>
            {showExplanation ? "해설 숨기기" : "해설 보기"}
        </Button>
      </div>
      */}

      {/* 해설 (showExplanation 상태에 따라 표시) */}
      {showExplanation && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
          <p className="font-semibold text-gray-700 mb-1">해설</p>
          {question.explanation ? (
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{question.explanation}</p>
          ) : (
            <p className="text-sm text-gray-500">해설 정보가 없습니다.</p>
          )}
          {/* 해설 이미지 */}
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

export default function ExamSessionLearningPage() {
  const params = useParams();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1); // 페이지네이션용 (현재는 10문제씩)
  const [totalPages, setTotalPages] = useState(1);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const [decodedExamName, setDecodedExamName] = useState<string>('');
  const [decodedDate, setDecodedDate] = useState<string>('');
  const [decodedSubject, setDecodedSubject] = useState<string>('');

  // --- 학습 기능 상태 변수들 (temp_legacy_learn_page.tsx 에서 가져옴) ---
  const [showExplanation, setShowExplanation] = useState<Record<string, boolean>>({});
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [showAllExplanations, setShowAllExplanations] = useState(false);
  const [isSingleViewMode, setIsSingleViewMode] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showIndividualAnswer, setShowIndividualAnswer] = useState<Record<string, boolean>>({});
  const [isShuffled, setIsShuffled] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, number | null>>({}); // 문제 ID별 사용자 답변 기록
  // ---------------------------------------------------------------------

  useEffect(() => {
    if (!params) { 
      setLoading(false);
      return;
    }
    const examNameParam = params.examName;
    const dateParam = params.date;
    const subjectParam = params.subject;
    try {
      if (typeof examNameParam === 'string') setDecodedExamName(decodeURIComponent(examNameParam)); else setDecodedExamName('');
      if (typeof dateParam === 'string') setDecodedDate(decodeURIComponent(dateParam)); else setDecodedDate('');
      if (typeof subjectParam === 'string') setDecodedSubject(decodeURIComponent(subjectParam)); else setDecodedSubject('');
    } catch (e) {
      console.error("Error decoding URL params:", e);
      toast({ title: "오류", description: "잘못된 URL 파라미터 형식입니다." });
      setLoading(false); setDecodedExamName(''); setDecodedDate(''); setDecodedSubject('');
    }
  }, [params, toast]);

  const normalizeImages = useCallback((imgs: any): { url: string; hash: string }[] => {
    if (Array.isArray(imgs)) { return imgs.map((img) => typeof img === 'string' ? { url: img, hash: "" } : (img && typeof img.url === 'string' ? img : {url:'', hash:''})); }
    if (typeof imgs === 'string' && imgs.startsWith('{') && imgs.endsWith('}')) { return imgs.slice(1, -1).split(',').filter(url => url.trim() !== '').map((url: string) => ({ url: url.trim(), hash: '' }));}
    return [];
  }, []);

  const fetchQuestionsForSession = useCallback(async () => {
    if (!decodedExamName || !decodedDate || !decodedSubject) { setQuestions([]); setTotalPages(1); setLoading(false); return; }
    setLoading(true);
    try {
      const tags = [`시험명:${decodedExamName}`,`날짜:${decodedDate}`,`과목:${decodedSubject}`];
      const queryParams = new URLSearchParams({ tags: tags.join(','), page: currentPage.toString(), limit: "0" }); // limit "0"으로 모든 문제 요청
      const response = await fetch(`/api/questions?${queryParams.toString()}`, { cache: 'no-store' });
      if (!response.ok) { const errorData = await response.json().catch(() => ({ message: "Error fetching data"})); throw new Error(errorData.message); }
      const data: { questions: IQuestion[], totalPages: number, currentPage: number } = await response.json();
      const processedQuestions = (data.questions || []).map((q: IQuestion) => ({ ...q, images: normalizeImages(q.images), explanationImages: normalizeImages(q.explanationImages), options: (q.options || []).map((opt: IOption) => ({...opt, images: normalizeImages(opt.images)}))}));
      setQuestions(processedQuestions);
      setTotalPages(data.totalPages || 1); // API가 페이지네이션을 안하면 1로 설정
      setCurrentQuestionIndex(0); // 문제 새로 로드 시 첫 문제로
      setUserAnswers({}); // 답변 기록 초기화
      setShowExplanation({}); // 해설 상태 초기화
      setShowIndividualAnswer({}); // 개별 정답 상태 초기화
    } catch (error) { toast({ title: "Error", description: (error instanceof Error ? error.message : "Failed to load questions.") }); setQuestions([]); setTotalPages(1); }
    finally { setLoading(false); }
  }, [decodedExamName, decodedDate, decodedSubject, currentPage, toast, normalizeImages]); // currentPage 제거 (모든 문제 한번에 로드)

  useEffect(() => {
    if(decodedExamName && decodedDate && decodedSubject) { fetchQuestionsForSession(); }
    else if (params && (!params.examName || !params.date || !params.subject)) { setQuestions([]); setTotalPages(1); setCurrentPage(1); setLoading(false); }
  }, [decodedExamName, decodedDate, decodedSubject, fetchQuestionsForSession, params]);

  // --- 학습 기능 핸들러 함수들 (temp_legacy_learn_page.tsx 에서 가져옴) ---
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
    // setCurrentQuestionIndex(0); // 단일 뷰 모드 변경 시 인덱스는 유지하거나, 필요시 첫 문제로
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isSingleViewMode || questions.length === 0) return;
      if (event.key === 'ArrowLeft') { if (currentQuestionIndex > 0) handlePrevQuestion(); }
      else if (event.key === 'ArrowRight') { if (currentQuestionIndex < questions.length - 1) handleNextQuestion(); }
    };
    if (isSingleViewMode) { window.addEventListener('keydown', handleKeyDown); }
    else { window.removeEventListener('keydown', handleKeyDown); }
    return () => { window.removeEventListener('keydown', handleKeyDown); };
  }, [isSingleViewMode, currentQuestionIndex, questions.length, handlePrevQuestion, handleNextQuestion]);
  
  const handleToggleShuffle = () => setIsShuffled(prev => !prev);

  const handleOptionSelect = (questionId: string | undefined, optionIndex: number) => {
    if (!questionId) return;
    setUserAnswers(prev => ({...prev, [questionId]: optionIndex }));
    // 정답 선택 시 바로 해설을 보여주거나, 정답 확인 버튼을 누를 때 보여줄 수 있음
    // toggleExplanationHandler(questionId); // 예: 선택 시 바로 해설 표시
    // toggleIndividualAnswerHandler(questionId); // 예: 선택 시 바로 정답 표시
  };
  // ------------------------------------------------------------------------

  // 섞인 문제 데이터 생성 (선택지 섞기)
  const processedQuestions = useMemo(() => {
    if (!questions) return [];
    return questions.map(q => {
      if (isShuffled && q.options) {
        const originalOptions = [...q.options];
        const originalAnswerIndex = q.answer; // 원본 정답 인덱스
        const shuffledOptions = shuffleArray(originalOptions);
        
        // 원본 정답이 유효한 경우 (0 이상인 경우)에만 새 인덱스 검색
        const newAnswerIndex = (originalAnswerIndex !== undefined && originalAnswerIndex !== null && originalAnswerIndex >= 0)
          ? shuffledOptions.findIndex((opt: IOption) => {
              const originalOpt = originalOptions[originalAnswerIndex]; // originalAnswerIndex는 이제 유효함이 보장됨
              return opt.text === originalOpt.text && JSON.stringify(opt.images) === JSON.stringify(originalOpt.images);
            })
          : -1; // 원본 정답이 없거나 유효하지 않으면 -1 (정답 없음)

        return { ...q, options: shuffledOptions, answer: newAnswerIndex };
      }
      return q;
    });
  }, [questions, isShuffled]);

  const currentQuestion = isSingleViewMode && processedQuestions.length > 0 ? processedQuestions[currentQuestionIndex] : null;

  const handleImageZoom = (url: string) => setZoomedImage(url);
  const closeImageZoom = () => setZoomedImage(null);

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: '홈', href: '/' },
    { label: '시험별 학습', href: '/learn/exams' },
  ];
  const currentPath = (params && params.examName && params.date && params.subject)
    ? `/learn/exams/${encodeURIComponent(params.examName as string)}/${encodeURIComponent(params.date as string)}/${encodeURIComponent(params.subject as string)}`
    : (params && params.examName ? `/learn/exams/${encodeURIComponent(params.examName as string)}` : '/learn/exams');
  if (decodedExamName) {
    breadcrumbItems.push({ label: decodedExamName, href: params && params.examName ? `/learn/exams/${encodeURIComponent(params.examName as string)}` : '/learn/exams' });
    if (decodedDate && decodedSubject) { breadcrumbItems.push({ label: `${decodedDate} - ${decodedSubject}`, href: currentPath, isCurrent: true }); }
  } else { breadcrumbItems.push({ label: '시험 정보 로딩 중...', href: currentPath, isCurrent: true }); }

  if (loading && questions.length === 0) { return <div className="container mx-auto py-10 px-4 text-center">문제 로딩 중...</div>; }

  return (
    <div className="container mx-auto py-10 px-4">
      <Breadcrumb items={breadcrumbItems} />
      <StudyPageHeader 
        encodedExamName={params?.examName as string || ''}
        encodedDate={params?.date as string || ''}
        encodedSubject={params?.subject as string || ''}
        isShowingAllAnswers={showAllAnswers}
        isShowingAllExplanations={showAllExplanations}
        isSingleViewMode={isSingleViewMode}
        onToggleShowAllAnswers={handleToggleShowAllAnswers}
        onToggleShowAllExplanations={handleToggleShowAllExplanations}
        onToggleSingleViewMode={handleToggleSingleViewMode}
        isShufflingEnabled={isShuffled}
        onToggleShuffle={handleToggleShuffle}
      />

      <h1 className="text-2xl font-bold my-6">
        {decodedExamName || '시험'} - {decodedDate || '날짜'} ({decodedSubject || '과목'})
      </h1>
      
      {processedQuestions.length === 0 && !loading ? (
         <div className="text-center py-8 border rounded-md">
           <p className="text-gray-500">해당 조건의 문제가 없습니다. URL의 시험명, 날짜(YYYY-MM-DD), 과목을 확인해주세요.</p>
         </div>
      ) : isSingleViewMode ? (
        currentQuestion && (
          <div className="space-y-6">
            <StudyQuestionCard
              key={currentQuestion.id}
              question={currentQuestion}
              index={currentQuestionIndex}
              onImageZoom={handleImageZoom}
              showAnswer={showAllAnswers || !!showIndividualAnswer[currentQuestion.id!]}
              showExplanation={showAllExplanations || !!showExplanation[currentQuestion.id!]}
              onOptionSelect={(optionIndex) => handleOptionSelect(currentQuestion.id, optionIndex)}
              userAnswer={userAnswers[currentQuestion.id!]}
            />
            <div className="flex justify-between items-center mt-6">
              <Button onClick={handlePrevQuestion} disabled={currentQuestionIndex <= 0}>이전 문제</Button>
              <span>{currentQuestionIndex + 1} / {processedQuestions.length}</span>
              <Button onClick={handleNextQuestion} disabled={currentQuestionIndex >= processedQuestions.length - 1}>다음 문제</Button>
            </div>
            <div className="mt-4 flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={() => toggleIndividualAnswerHandler(currentQuestion.id)}>정답 보기/숨기기</Button>
              <Button variant="outline" size="sm" onClick={() => toggleExplanationHandler(currentQuestion.id)}>해설 보기/숨기기</Button>
            </div>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {processedQuestions.map((question, index) => (
            <StudyQuestionCard
              key={question.id}
              question={question}
              index={index}
              onImageZoom={handleImageZoom}
              showAnswer={showAllAnswers || !!showIndividualAnswer[question.id!]}
              showExplanation={showAllExplanations || !!showExplanation[question.id!]}
              onOptionSelect={(optionIndex) => handleOptionSelect(question.id, optionIndex)}
              userAnswer={userAnswers[question.id!]}
            />
          ))}
        </div>
      )}
      <ImageZoomModal src={zoomedImage} onClose={closeImageZoom} />
    </div>
  );
} 