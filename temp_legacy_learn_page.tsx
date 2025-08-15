'use client' // Make this a Client Component

import { useParams } from 'next/navigation'
import { useEffect, useState, useCallback, useMemo } from 'react'
import React from 'react';
import StudyPageHeader from '@/components/study/StudyPageHeader';
import { IQuestion, IOption } from '@/types'; // Import IQuestion and IOption interfaces
import { Button } from "@/components/ui/button"; // Import Button component
import Breadcrumb from '@/components/common/Breadcrumb'; // Import Breadcrumb
import { CommonImage } from "@/components/common/CommonImage"; // CommonImage 임포트 추가
import { getImageUrl } from "@/utils/image"; // getImageUrl 임포트 추가
import { useImageZoom } from '@/hooks/useImageZoom'; // useImageZoom 훅 임포트
import { ImageZoomModal } from '@/components/common/ImageZoomModal'; // ImageZoomModal 임포트

/**
 * 특정 시험 문제 학습 페이지 (기존 SolvePage)
 * URL 파라미터로 받은 시험명/년도/회차에 해당하는 문제 목록을 보여주고
 * 사용자가 문제와 해설을 학습할 수 있도록 합니다.
 */
export default function StudyPage() { // Rename component from SolvePage to StudyPage
  const params = useParams()
  const [decodedParams, setDecodedParams] = useState<{
    examName: string
    year: string
    session: string
  } | null>(null)
  const [questions, setQuestions] = useState<IQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState<Record<string, boolean>>({});
  // Add state for new toggle features
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [showAllExplanations, setShowAllExplanations] = useState(false);
  // Add state for single view mode
  const [isSingleViewMode, setIsSingleViewMode] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  // Add state for individual answer visibility
  const [showIndividualAnswer, setShowIndividualAnswer] = useState<Record<string, boolean>>({});
  const [isShuffled, setIsShuffled] = useState(false); // 선택지 섞기 상태 추가
  const imageZoom = useImageZoom(); // 이미지 확대 훅 사용

  // Restore useEffect for decoding parameters
  useEffect(() => {
    try {
      const examNameRaw = params?.examName
      const yearRaw = params?.year
      const sessionRaw = params?.session

      if (
        typeof examNameRaw !== 'string' ||
        typeof yearRaw !== 'string' ||
        typeof sessionRaw !== 'string'
      ) {
        throw new Error('Invalid route parameters received.')
      }

      console.log('Raw params from useParams:', examNameRaw, yearRaw, sessionRaw)

      const decodedExamName = decodeURIComponent(examNameRaw)
      const decodedYear = decodeURIComponent(yearRaw)
      const decodedSession = decodeURIComponent(sessionRaw)

      console.log(
        'Decoded params:',
        decodedExamName,
        decodedYear,
        decodedSession
      )

      setDecodedParams({
        examName: decodedExamName,
        year: decodedYear,
        session: decodedSession
      })
      setError(null)
    } catch (e: any) {
      console.error('Error decoding params in StudyPage:', e)
      setError(e.message || 'An error occurred while decoding parameters.')
      setDecodedParams(null)
    }
  }, [params])

  // Restore useEffect for fetching questions
  useEffect(() => {
    if (!decodedParams) {
      return
    }

    const fetchQuestions = async () => {
      setLoading(true)
      setError(null)
      try {
        const tagsToQuery = [
          `시험명:${decodedParams.examName}`,
          `년도:${decodedParams.year}`,
          `회차:${decodedParams.session}`
        ];
        const encodedTags = encodeURIComponent(tagsToQuery.join(','));

        console.log(`Fetching questions with tags: ${tagsToQuery.join(', ')}`);
        const response = await fetch(`/api/questions?tags=${encodedTags}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch questions' }));
          console.error('API Error Response:', errorData);
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API Response Data:', data);

        if (data && Array.isArray(data.questions)) {
           // Add detailed log for images field of each question
           data.questions.forEach((q: IQuestion, index: number) => {
             console.log(`[Debug] Question ${index} images from API:`, q.images);
           });
           setQuestions(data.questions);
        } else {
          console.warn('API did not return questions in expected format:', data);
          setQuestions([]);
        }

      } catch (e: any) {
        console.error('Error fetching questions:', e)
        setError(e.message || 'An error occurred while fetching questions.')
        setQuestions([])
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [decodedParams])

  // Function to toggle explanation visibility for a specific question
  const toggleExplanation = (questionId: string | undefined) => {
    if (!questionId) return;
    setShowExplanation(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  // Handler to toggle showing all answers
  const handleToggleShowAllAnswers = () => {
    setShowAllAnswers(prev => !prev);
  };

  // Handler to toggle showing all explanations
  const handleToggleShowAllExplanations = () => {
    const nextShowState = !showAllExplanations;
    setShowAllExplanations(nextShowState);
    // Update individual explanation states based on the new global state
    const newShowExplanation: Record<string, boolean> = {};
    questions.forEach(q => {
      if (q.id) {
        newShowExplanation[q.id] = nextShowState;
      }
    });
    setShowExplanation(newShowExplanation);
  };

  // Handler to toggle single view mode
  const handleToggleSingleViewMode = () => {
    setIsSingleViewMode(prev => !prev);
    setCurrentQuestionIndex(0); // Reset index when toggling mode
  };

  // Handler to toggle individual answer visibility
  const toggleIndividualAnswer = (questionId: string | undefined) => {
    if (!questionId) return;
    setShowIndividualAnswer(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  // Wrap navigation handlers in useCallback
  const handlePrevQuestion = useCallback(() => {
    setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
  }, []); // No dependencies needed if it only uses setCurrentQuestionIndex setter

  const handleNextQuestion = useCallback(() => {
    // Need questions.length as a dependency
    setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1));
  }, [questions.length]); // Add questions.length dependency

  // useEffect for keyboard navigation in single view mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only act if in single view mode
      if (!isSingleViewMode) return;

      if (event.key === 'ArrowLeft') {
        // Check condition directly here before calling handler
        if (currentQuestionIndex > 0) {
           handlePrevQuestion();
        }
      } else if (event.key === 'ArrowRight') {
         // Check condition directly here before calling handler
         if (currentQuestionIndex < questions.length - 1) {
            handleNextQuestion();
         }
      }
    };

    // Add listener only when in single view mode
    if (isSingleViewMode) {
      window.addEventListener('keydown', handleKeyDown);
    } else {
      // Ensure listener is removed if mode changes
      window.removeEventListener('keydown', handleKeyDown);
    }

    // Cleanup function to remove the listener when the component unmounts or dependencies change
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  // Dependencies: mode, current index (for checks), questions length (for checks), and handlers
  }, [isSingleViewMode, currentQuestionIndex, questions.length, handlePrevQuestion, handleNextQuestion]);

  // Define breadcrumb items dynamically
  const breadcrumbItems = decodedParams ? [
    { label: '홈', href: '/' },
    { label: '문제 은행', href: '/bank' },
    // Ensure params.examName exists and is a string for the href
    { label: decodedParams.examName, href: params?.examName ? `/bank/${params.examName}` : '/bank' }, 
    { label: `${decodedParams.year}년 ${decodedParams.session}`, href: '', isCurrent: true },
  ] : [];

  // 선택지 섞기 토글 핸들러 추가
  const handleToggleShuffle = () => {
    setIsShuffled(prev => !prev);
  };

  // 배열 섞기 유틸리티 함수 (Fisher-Yates 알고리즘) - 컴포넌트 외부로 이동
  function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]; // 원본 배열 복사
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      if (shuffled[i] !== undefined && shuffled[j] !== undefined) {
        const temp = shuffled[i]!;
        shuffled[i] = shuffled[j]!;
        shuffled[j] = temp;
      }
    }
    return shuffled;
  }

  // 섞인 선택지와 정답 인덱스 계산 (useMemo 사용)
  const shuffledQuestionsData = useMemo(() => {
    if (!isShuffled) return null;

    return questions.map(question => {
      if (!question.options || question.options.length === 0) {
        return { shuffledOptions: [], newAnswerIndex: -1 };
      }
      const originalCorrectOption = question.options[question.answer];
      const shuffledOptions = shuffleArray(question.options);
      // findIndex 콜백 파라미터에 IOption 타입 명시
      const newAnswerIndex = shuffledOptions.findIndex((opt: IOption) => opt === originalCorrectOption);
      
      return { shuffledOptions, newAnswerIndex };
    });
  }, [questions, isShuffled]);

  // --- Render Logic ---
  if (!decodedParams) {
     return <div>Waiting for parameters...</div>;
  }
  if (loading) {
    // Keep loading rendering simple, maybe place breadcrumb later
    return <div className="container mx-auto py-8 text-center">로딩 중...</div>;
  }
  if (error) {
    // Keep error rendering simple
    return <div className="container mx-auto py-8 text-center text-red-500">오류: {error}</div>;
  }

  // Determine which questions to display based on the mode
  const questionsToDisplay = isSingleViewMode && questions.length > 0
    ? [questions[currentQuestionIndex]]
    : questions;

  return (
    <div className="container mx-auto py-8">
      {/* Add Breadcrumb component */} 
      <Breadcrumb items={breadcrumbItems} />

      {/* Pass new state and handlers to the header */}
      <StudyPageHeader
        title={`${decodedParams.examName} ${decodedParams.year}년 ${decodedParams.session}`}
        showAllAnswers={showAllAnswers}
        showAllExplanations={showAllExplanations}
        isSingleViewMode={isSingleViewMode}
        onToggleShowAllAnswers={handleToggleShowAllAnswers}
        onToggleShowAllExplanations={handleToggleShowAllExplanations}
        onToggleSingleViewMode={handleToggleSingleViewMode}
        isShuffled={isShuffled}
        onToggleShuffle={handleToggleShuffle}
        currentQuestionNumber={isSingleViewMode ? currentQuestionIndex + 1 : undefined}
        totalQuestions={questions.length}
        onPrev={isSingleViewMode ? handlePrevQuestion : undefined}
        onNext={isSingleViewMode ? handleNextQuestion : undefined}
        showControls={true}
      />

      {/* Question list rendering - Use questionsToDisplay */}
      <div className={`mt-8 ${isSingleViewMode ? '' : 'grid grid-cols-1 md:grid-cols-2 gap-6'}`}> 
        {loading ? (
          <p>문제를 불러오는 중...</p>
        ) : error ? (
          <p className="text-red-500">오류: {error}</p>
        ) : questions.length === 0 ? (
          <p>해당 시험에 대한 문제가 없습니다.</p>
        ) : (
          // Map over questionsToDisplay instead of questions
          questionsToDisplay.map((question, displayIndex) => {
            // Use currentQuestionIndex for question number in single view mode
            const questionNumber = isSingleViewMode ? currentQuestionIndex + 1 : displayIndex + 1;
            // 섞기 데이터 가져오기 (isShuffled가 true일 때만 사용)
            const currentShuffledData = shuffledQuestionsData ? shuffledQuestionsData[isSingleViewMode ? currentQuestionIndex : displayIndex] : null;
            
            // question이 undefined인 경우 처리
            if (!question) {
              return null;
            }

            // 선택지와 정답 인덱스 결정
            const optionsToRender = currentShuffledData ? currentShuffledData.shuffledOptions : question.options;
            const answerIndexToUse = currentShuffledData ? currentShuffledData.newAnswerIndex : question.answer;
            
            // 디버깅용 로그
            console.log(`[Render Debug] Images for Question ${displayIndex}:`, question.images);
            
            return (
              <div key={question.id || displayIndex} className={`p-4 border border-gray-300 rounded shadow-md bg-white flex flex-col ${isSingleViewMode ? 'mb-6' : ''}`}>
                {/* 문제 번호 */}
                <div className="text-lg font-semibold mb-2 text-blue-600">
                  문제 {questionNumber}
                </div>
                
                {/* 문제 내용 */}
                <div 
                  className="mb-4 text-gray-800"
                  dangerouslySetInnerHTML={{ __html: question.content }}
                />
                
                {/* 문제 이미지 */}
                {question.images && question.images.length > 0 && (
                  <div className="mb-4">
                    {question.images.map((img: any, imgIndex) => {
                      return (
                        <div key={`q-${question.id}-img-${imgIndex}`} className="mb-2">
                          <img 
                            src={img.url} 
                            alt={`문제 이미지 ${imgIndex + 1}`}
                            className="max-w-full h-auto border rounded"
                            onClick={() => imageZoom.showZoom(img.url)}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Options - 섞기 적용 및 정답 인덱스 수정 */}
                <div className="space-y-[0.1rem] mb-4">
                  {optionsToRender.map((option, optionIndex) => {
                    // isCorrectAnswer 계산 시 answerIndexToUse 사용
                    const isCorrectAnswer = optionIndex === answerIndexToUse;
                    const shouldHighlight = (showAllAnswers || showIndividualAnswer[question.id || '']) && isCorrectAnswer;
                    const highlightClass = shouldHighlight ? 'bg-yellow-200 font-semibold' : 'hover:bg-gray-100';
                    return (
                      <div 
                        key={option.text + optionIndex} // key를 좀 더 고유하게 (섞이면 index가 바뀔 수 있으므로 text 조합)
                        className={`flex flex-col gap-1 p-2 rounded ${highlightClass}`}
                      >
                        <div className="flex items-start"> {/* 텍스트 부분을 div로 감싸기 */} 
                           <span className="mr-2 font-medium text-gray-700">{optionIndex + 1}.</span>
                           <span>{option.text}</span>
                        </div>
                        {/* --- 선택지 이미지 렌더링 로직 추가 --- */}
                        {option.images && option.images.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-1 pl-6"> {/* 이미지 영역 스타일링 */} 
                            {option.images.map((img: any, imgIndex: number) => {
                              const imageUrl = getImageUrl(img);
                              if (imageUrl) {
                                return (
                                  <CommonImage
                                    key={`opt-${optionIndex}-img-${imgIndex}`}
                                    src={imageUrl}
                                    alt={`선택지 ${optionIndex + 1} 이미지 ${imgIndex + 1}`}
                                    className="block max-w-full h-auto object-contain mx-auto border rounded"
                                    containerClassName="max-w-[300px] max-h-[200px] flex items-center justify-center cursor-zoom-in"
                                    maintainAspectRatio={true}
                                    onClick={() => imageZoom.showZoom(imageUrl)}
                                  />
                                );
                              }
                              return null;
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Action Buttons Area - Distribute space */}
                <div className="flex items-center mt-auto pt-3 border-t border-gray-100 gap-2"> {/* Add gap */} 
                   {/* Add Show Answer Button - Make it grow */}
                   <Button 
                     variant="outline" 
                     size="sm" 
                     onClick={() => toggleIndividualAnswer(question.id)} 
                     disabled={!question.id}
                     className="flex-grow" // Add flex-grow, remove mr-2
                   >
                     {showIndividualAnswer[question.id || ''] ? '정답 숨기기' : '정답 보기'}
                   </Button>
                   {/* Existing Show Explanation Button - Make it grow */}
                   <Button 
                     variant="outline" 
                     size="sm" 
                     onClick={() => toggleExplanation(question.id)} 
                     disabled={!question.id}
                     className="flex-grow" // Add flex-grow
                   >
                     {showExplanation[question.id || ''] ? '해설 숨기기' : '해설 보기'}
                   </Button>
                </div>

                {/* Conditional Explanation Area - Remove blue answer text */}
                {question.id && showExplanation[question.id] && (
                  <div className="mt-3 pt-3 border-t border-gray-200 bg-gray-50 p-3 rounded">
                    {question.explanation ? (
                      <div className="prose prose-sm max-w-none">
                        <p className="font-semibold mb-1">해설:</p>
                        <div dangerouslySetInnerHTML={{ __html: question.explanation }} />
                        
                        {/* Explanation Images - Format src as data URL for base64 */}
                        {question.explanationImages && question.explanationImages.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {question.explanationImages.map((img: any, imgIndex) => {
                              const imageUrl = getImageUrl(img);
                              if (imageUrl) {
                                return (
                                  <CommonImage
                                    key={`exp-${question.id}-img-${imgIndex}`}
                                    src={imageUrl}
                                    alt={`해설 이미지 ${imgIndex + 1}`}
                                    className="block max-w-full h-auto object-contain mx-auto border rounded"
                                    containerClassName="max-w-[400px] max-h-[300px] flex items-center justify-center cursor-zoom-in"
                                    maintainAspectRatio={true}
                                    onClick={() => imageZoom.showZoom(imageUrl)}
                                  />
                                );
                              }
                              return null;
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">해설 정보가 없습니다.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination for Single View Mode */}
      {isSingleViewMode && questions.length > 0 && (
        <div className="mt-8 flex justify-between items-center">
          <Button
            onClick={handlePrevQuestion}
            disabled={currentQuestionIndex === 0}
            variant="outline"
            size="default"
          >
            이전 문제
          </Button>
          <span className="text-gray-700 font-medium">
            {currentQuestionIndex + 1} / {questions.length}
          </span>
          <Button
            onClick={handleNextQuestion}
            disabled={currentQuestionIndex >= questions.length - 1}
            variant="outline"
            size="default"
          >
            다음 문제
          </Button>
        </div>
      )}

      {/* 이미지 확대 모달 */}
      <ImageZoomModal imageUrl={imageZoom.zoomedImage} onClose={imageZoom.closeZoom} />

    </div>
  )
} 