'use client' // Make this a Client Component

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import React from 'react';
import SolvePageHeader from '@/components/solve/SolvePageHeader'; // 클라이언트 컴포넌트 import
import { IQuestion } from '@/types'; // Import IQuestion interface
import { Button } from "@/components/ui/button"; // Import Button component

// 필요한 컴포넌트 import 예정

/**
 * 특정 시험 문제 풀이 페이지
 * URL 파라미터로 받은 시험명/년도/회차에 해당하는 문제 목록을 보여주고
 * 사용자가 문제를 풀 수 있도록 합니다.
 */
export default function SolvePage() {
  const params = useParams()
  const [decodedParams, setDecodedParams] = useState<{
    examName: string
    year: string
    session: string
  } | null>(null)
  const [questions, setQuestions] = useState<IQuestion[]>([]) // Use IQuestion type
  const [loading, setLoading] = useState(true) // Add loading state
  const [error, setError] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState<Record<string, boolean>>({}); // State to track explanation visibility per question

  // Decode parameters effect
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
      setError(null) // Clear any previous error
    } catch (e: any) {
      console.error('Error decoding params in SolvePage:', e)
      setError(
        e.message || 'An error occurred while decoding parameters.'
      )
      setDecodedParams(null)
    }
    // No setLoading here, loading is for data fetching
  }, [params])

  // Fetch questions effect
  useEffect(() => {
    if (!decodedParams) {
      // Don't fetch if params are not ready
      return
    }

    const fetchQuestions = async () => {
      setLoading(true) // Start loading
      setError(null) // Clear previous errors
      try {
        // Construct tags for the API query
        const tagsToQuery = [
          `시험명:${decodedParams.examName}`,
          `년도:${decodedParams.year}`,
          `회차:${decodedParams.session}`
        ];
        const encodedTags = encodeURIComponent(tagsToQuery.join(',')); // Join tags with comma and encode

        console.log(`Fetching questions with tags: ${tagsToQuery.join(', ')}`);
        const response = await fetch(`/api/questions?tags=${encodedTags}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch questions' }));
          console.error('API Error Response:', errorData);
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API Response Data:', data);

        // Assuming the API returns { questions: IQuestion[] }
        if (data && Array.isArray(data.questions)) {
           setQuestions(data.questions);
        } else {
          console.warn('API did not return questions in expected format:', data);
          setQuestions([]); // Set to empty array if format is wrong
        }

      } catch (e: any) {
        console.error('Error fetching questions:', e)
        setError(e.message || 'An error occurred while fetching questions.')
        setQuestions([]) // Clear questions on error
      } finally {
        setLoading(false) // Stop loading regardless of success or failure
      }
    }

    fetchQuestions()
  }, [decodedParams]) // Re-run effect when decodedParams change

  // Function to toggle explanation visibility for a specific question
  const toggleExplanation = (questionId: string | undefined) => {
    if (!questionId) return; // Do nothing if questionId is undefined
    setShowExplanation(prev => ({
      ...prev,
      [questionId]: !prev[questionId] // Toggle the boolean value
    }));
  };

  // --- Render Logic ---

  // Handle parameter decoding error
  if (!loading && !decodedParams && error) {
     return <div>Error decoding parameters: {error}</div>
  }

  // Handle initial loading or parameter processing
  if (!decodedParams && loading) {
    return <div>Loading parameters...</div>
  }

  // Ensure decodedParams is available before rendering header
  if (!decodedParams) {
     // This case should ideally not be reached if loading/error states are handled correctly
     return <div>Waiting for parameters...</div>;
  }


  return (
    <div className="container mx-auto py-8">
      {/* Pass decoded params to the header */}
      <SolvePageHeader
        encodedExamName={decodedParams.examName}
        encodedYear={decodedParams.year}
        encodedSession={decodedParams.session}
      />

      {/* Question list rendering */}
      {/* Apply grid layout: default 1 column, 2 columns on medium screens and up */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6"> 
        {loading ? (
          <p>문제를 불러오는 중...</p>
        ) : error ? (
          <p className="text-red-500">오류: {error}</p>
        ) : questions.length === 0 ? (
          <p>해당 시험에 대한 문제가 없습니다.</p>
        ) : (
          questions.map((question, index) => (
            // Each question card is now a grid item - Apply medium shadow
            <div key={question.id || index} className="p-4 border border-gray-300 rounded shadow-md bg-white flex flex-col">
              {/* Question Content - Remove flex-grow */}
              <p className="font-semibold mb-3">문제 {index + 1}:</p>
              <div 
                className="mb-2 prose max-w-none font-bold text-lg" /* Removed flex-grow */
                dangerouslySetInnerHTML={{ __html: question.content }} 
              />

              {/* Options */}
              <div className="space-y-[0.1rem] mb-4">
                {question.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-start p-2 rounded hover:bg-gray-100">
                    <span className="mr-2 font-medium text-gray-700">{optionIndex + 1}.</span>
                    <span>{option}</span>
                  </div>
                ))}
              </div>

              {/* Explanation Toggle Button - Remove mt-auto */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => toggleExplanation(question.id)} 
                disabled={!question.id}
                className="mb-3" /* Removed mt-auto */
              >
                {showExplanation[question.id || ''] ? '해설 숨기기' : '해설 보기'}
              </Button>

              {/* Conditional Explanation Area */}
              {question.id && showExplanation[question.id] && (
                <div className="mt-3 pt-3 border-t border-gray-200 bg-gray-50 p-3 rounded">
                  <p className="font-semibold text-blue-600 mb-2">
                    정답: {question.answer + 1}. {question.options[question.answer]}
                  </p>
                  {question.explanation ? (
                    <div className="prose prose-sm max-w-none">
                      <p className="font-semibold mb-1">해설:</p>
                      <div dangerouslySetInnerHTML={{ __html: question.explanation }} />
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">해설 정보가 없습니다.</p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
} 