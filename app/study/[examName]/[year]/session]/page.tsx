import { useParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import React from 'react';

export default function StudyPage() {
  const [isSingleViewMode, setIsSingleViewMode] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const handlePrevQuestion = useCallback(() => {
    setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
  }, []);

  const handleNextQuestion = useCallback(() => {
    setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1));
  }, [questions.length]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isSingleViewMode) return;

      if (event.key === 'ArrowLeft') {
        if (currentQuestionIndex > 0) {
           handlePrevQuestion();
        }
      } else if (event.key === 'ArrowRight') {
         if (currentQuestionIndex < questions.length - 1) {
            handleNextQuestion();
         }
      }
    };

    if (isSingleViewMode) {
      window.addEventListener('keydown', handleKeyDown);
    } else {
      window.removeEventListener('keydown', handleKeyDown); 
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSingleViewMode, currentQuestionIndex, questions.length, handlePrevQuestion, handleNextQuestion]);

  return (
    <div key={question.id || index} className="p-4 border border-gray-300 rounded shadow-md bg-white flex flex-col">
      {/* ... Question number and content ... */}
      <div 
        className="mb-2 prose max-w-none font-bold text-lg"
        dangerouslySetInnerHTML={{ __html: question.content }} 
      />

      {/* Question Images - Revert to using direct imgSrc (file path) */}
      {question.images && question.images.length > 0 && (
        <div className="my-4 space-y-2">
          {question.images.map((imgSrc, imgIndex) => {
            if (typeof imgSrc === 'string' && imgSrc.trim() !== '') {
              // const dataUrl = imgSrc.startsWith('data:image') ? imgSrc : `data:image/png;base64,${imgSrc}`; // Remove data URL formatting
              return (
                <img 
                  key={`q-${question.id}-img-${imgIndex}`} 
                  src={imgSrc} // Use direct imgSrc (should be file path now)
                  alt={`문제 ${index + 1} 이미지 ${imgIndex + 1}`}
                  className="max-w-full h-auto rounded border border-gray-200"
                />
              );
            }
            return null;
          })}
        </div>
      )}

      {/* Options */}
      {/* ... Options rendering ... */}

      {/* Explanation Toggle Button */}
      {/* ... Button rendering ... */}

      {/* Conditional Explanation Area */}
      {question.id && showExplanation[question.id] && (
        <div className="mt-3 pt-3 border-t border-gray-200 bg-gray-50 p-3 rounded">
          {/* ... Answer rendering ... */}
          
          {question.explanation ? (
            <div className="prose prose-sm max-w-none">
              <p className="font-semibold mb-1">해설:</p>
              <div dangerouslySetInnerHTML={{ __html: question.explanation }} />
              
              {/* Explanation Images - Revert to using direct imgSrc (file path) */}
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
} 