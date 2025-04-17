'use client' // Make this a Client Component

import { useParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import React from 'react';
import StudyPageHeader from '@/components/study/StudyPageHeader';
import { IQuestion } from '@/types'; // Import IQuestion interface
import { Button } from "@/components/ui/button"; // Import Button component
import Breadcrumb from '@/components/common/Breadcrumb'; // Import Breadcrumb

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

  // Restore useEffect for decoding parameters
  useEffect(() => {
    try {
      const examNameRaw = params.examName
      const yearRaw = params.year
      const sessionRaw = params.session

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
    { label: decodedParams.examName, href: typeof params.examName === 'string' ? `/bank/${params.examName}` : '/bank' }, 
    { label: `${decodedParams.year}년 ${decodedParams.session}`, href: '', isCurrent: true },
  ] : [];

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
        encodedExamName={params.examName as string} // Pass raw encoded params
        encodedYear={params.year as string}
        encodedSession={params.session as string}
        isShowingAllAnswers={showAllAnswers}
        isShowingAllExplanations={showAllExplanations}
        isSingleViewMode={isSingleViewMode} // Pass single view state
        onToggleShowAllAnswers={handleToggleShowAllAnswers}
        onToggleShowAllExplanations={handleToggleShowAllExplanations}
        onToggleSingleViewMode={handleToggleSingleViewMode} // Pass single view toggle handler
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
            // Add log to inspect the question object just before rendering the card
            console.log(`[Render Debug] Rendering card for Question ${displayIndex}. Data:`, question);
            console.log(`[Render Debug] Images for Question ${displayIndex}:`, question.images);

            return (
              // Pass questionNumber to the card content
              <div key={question.id || displayIndex} className={`p-4 border border-gray-300 rounded shadow-md bg-white flex flex-col ${isSingleViewMode ? 'mb-6' : ''}`}>
                {/* Use questionNumber for display */}
                <p className="font-semibold mb-3">문제 {questionNumber}:</p>
                <div 
                  className="mb-2 prose max-w-none font-bold text-lg" /* Removed flex-grow */
                  dangerouslySetInnerHTML={{ __html: question.content }} 
                />

                {/* Question Images - Format src as data URL for base64 */}
                {question.images && question.images.length > 0 && (
                  <div className="my-4 space-y-2">
                    {question.images.map((imgSrc, imgIndex) => {
                      if (typeof imgSrc === 'string' && imgSrc.trim() !== '') {
                        // const dataUrl = imgSrc.startsWith('data:image') ? imgSrc : `data:image/png;base64,${imgSrc}`; // Remove data URL formatting
                        return (
                          <img 
                            key={`q-${question.id}-img-${imgIndex}`} 
                            src={imgSrc} // Use direct imgSrc (should be file path now)
                            alt={`문제 ${questionNumber} 이미지 ${imgIndex + 1}`}
                            className="max-w-full h-auto rounded border border-gray-200"
                          />
                        );
                      }
                      return null;
                    })}
                  </div>
                )}

                {/* Options - Update highlighting logic */}
                <div className="space-y-[0.1rem] mb-4">
                  {question.options.map((option, optionIndex) => {
                    const isCorrectAnswer = optionIndex === question.answer;
                    // Highlight if global showAllAnswers OR individual showIndividualAnswer is true
                    const shouldHighlight = (showAllAnswers || showIndividualAnswer[question.id || '']) && isCorrectAnswer;
                    const highlightClass = shouldHighlight ? 'bg-yellow-200 font-semibold' : 'hover:bg-gray-100';
                    return (
                      <div 
                        key={optionIndex} 
                        className={`flex items-start p-2 rounded ${highlightClass}`}
                      >
                        <span className="mr-2 font-medium text-gray-700">{optionIndex + 1}.</span>
                        <span>{option}</span>
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
                            {question.explanationImages.map((imgSrc, imgIndex) => {
                              if (typeof imgSrc === 'string' && imgSrc.trim() !== '') {
                                // const dataUrl = imgSrc.startsWith('data:image') ? imgSrc : `data:image/png;base64,${imgSrc}`; // Remove data URL formatting
                                return (
                                  <img 
                                    key={`exp-${question.id}-img-${imgIndex}`} 
                                    src={imgSrc} // Use direct imgSrc (should be file path now)
                                    alt={`해설 이미지 ${imgIndex + 1}`}
                                    className="max-w-full h-auto rounded border border-gray-200"
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
    </div>
  )
} 