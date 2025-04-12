"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IQuestion } from "@/types";
import { QuestionReview } from "./review/QuestionReview";

interface ResolvedQuestionsProps {
  questions: IQuestion[];
  errors: string[];
  onQuestionUpdate: (updatedQuestion: IQuestion) => void;
  onSave?: (questions: IQuestion[]) => void;
}

export function ResolvedQuestions({
  questions,
  errors,
  onQuestionUpdate,
  onSave,
}: ResolvedQuestionsProps) {
  const [userAnswers, setUserAnswers] = useState<Record<string | number, number>>({});

  const handleAnswerChange = (questionId: string | number, answerIndex: number) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answerIndex,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">분석된 문제 ({questions.length}개)</h2>
        
        {onSave && (
          <Button 
            onClick={() => onSave(questions)}
            disabled={questions.length === 0}
          >
            문제 저장하기
          </Button>
        )}
      </div>

      {errors.length > 0 && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertDescription className="space-y-2">
            <p className="font-medium">분석 중 다음과 같은 문제가 발견되었습니다:</p>
            <ul className="list-disc pl-5 space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="text-sm">{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {questions.length === 0 ? (
        <div className="p-6 text-center text-gray-500 border rounded-lg">
          분석된 문제가 없습니다. 문제를 붙여넣고 분석해주세요.
        </div>
      ) : (
        <div className="space-y-8">
          {questions.map((question) => (
            <QuestionReview
              key={question.id}
              question={question}
              onUpdate={onQuestionUpdate}
              onAnswerChange={handleAnswerChange}
              userAnswer={userAnswers[question.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
} 