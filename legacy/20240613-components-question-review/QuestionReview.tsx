"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageUploader } from "./ImageUploader";
import { IQuestion, IQuestionImage } from "@/types";

interface QuestionReviewProps {
  question: IQuestion;
  onUpdate: (question: IQuestion) => void;
  onAnswerChange?: (questionId: string | number, answerIndex: number) => void;
  userAnswer?: number;
}

export function QuestionReview({
  question,
  onUpdate,
  onAnswerChange,
  userAnswer,
}: QuestionReviewProps) {
  const [selectedImageType, setSelectedImageType] = useState<'question' | 'option' | 'explanation'>('question');
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number>(-1);

  const handleImageUpload = async (imageData: { id: number, path: string }) => {
    // 이미지 연결 로직
    if (selectedImageType === 'question') {
      // 문제 이미지 추가
      onUpdate({
        ...question,
        images: [...(question.images || []), {
          id: imageData.id,
          path: imageData.path,
          type: 'question'
        }]
      });
    } else if (selectedImageType === 'option' && selectedOptionIndex >= 0) {
      // 선택지 이미지 추가
      const updatedOptions = [...question.options];
      if (!updatedOptions[selectedOptionIndex].images) {
        updatedOptions[selectedOptionIndex].images = [];
      }
      updatedOptions[selectedOptionIndex].images?.push({
        id: imageData.id,
        path: imageData.path,
        type: 'option'
      });
      onUpdate({ ...question, options: updatedOptions });
    } else if (selectedImageType === 'explanation') {
      // 해설 이미지 추가
      onUpdate({
        ...question,
        explanationImages: [...(question.explanationImages || []), {
          id: imageData.id,
          path: imageData.path,
          type: 'explanation'
        }]
      });
    }
  };

  const removeImage = (type: 'question' | 'option' | 'explanation', imageId: number, optionIndex?: number) => {
    if (type === 'question') {
      onUpdate({
        ...question,
        images: question.images?.filter(img => img.id !== imageId)
      });
    } else if (type === 'option' && optionIndex !== undefined) {
      const updatedOptions = [...question.options];
      updatedOptions[optionIndex].images = updatedOptions[optionIndex].images?.filter(img => img.id !== imageId);
      onUpdate({ ...question, options: updatedOptions });
    } else if (type === 'explanation') {
      onUpdate({
        ...question,
        explanationImages: question.explanationImages?.filter(img => img.id !== imageId)
      });
    }
  };

  return (
    <div className="border rounded-lg p-4 mb-6">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-medium">문제 {question.number}</h3>
        {userAnswer !== undefined && (
          <Badge className={userAnswer === question.number ? "bg-green-500" : "bg-red-500"}>
            {userAnswer === question.number ? "정답" : "오답"}
          </Badge>
        )}
      </div>

      <div className="mb-4">
        <p className="whitespace-pre-line">{question.content}</p>

        {/* 문제 이미지 섹션 */}
        <div className="mt-2">
          <div className="flex flex-wrap gap-2 mb-2">
            {question.images?.map(img => (
              <div key={img.id} className="relative">
                <img
                  src={img.path}
                  alt="문제 이미지"
                  className="w-24 h-24 object-cover border rounded"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                  onClick={() => removeImage('question', img.id)}
                >
                  ✕
                </Button>
              </div>
            ))}

            <ImageUploader
              onUpload={handleImageUpload}
              type="question"
              questionId={question.id.toString()}
              buttonText="문제 이미지 추가"
              buttonVariant="outline"
              buttonSize="sm"
              beforeUpload={() => setSelectedImageType('question')}
            />
          </div>
        </div>
      </div>

      {/* 선택지 섹션 */}
      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2">선택지</h4>
        {question.options.map((option, index) => (
          <div key={index} className="mb-3">
            <div className="flex items-start gap-2">
              <Button
                type="button"
                size="sm"
                variant={userAnswer === index + 1 ? "default" : "outline"}
                onClick={() => onAnswerChange?.(question.id, index + 1)}
                className="h-8 w-8 p-0 flex-shrink-0"
              >
                {index + 1}
              </Button>
              <div className="flex-1">
                <p className="whitespace-pre-line">{option.text}</p>

                {/* 선택지 이미지 */}
                <div className="flex flex-wrap gap-2 mt-1">
                  {option.images?.map(img => (
                    <div key={img.id} className="relative">
                      <img
                        src={img.path}
                        alt={`선택지 ${index + 1} 이미지`}
                        className="w-20 h-20 object-cover border rounded"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full text-xs"
                        onClick={() => removeImage('option', img.id, index)}
                      >
                        ✕
                      </Button>
                    </div>
                  ))}

                  <ImageUploader
                    onUpload={handleImageUpload}
                    type="option"
                    questionId={question.id.toString()}
                    optionId={index.toString()}
                    buttonText="이미지"
                    buttonVariant="ghost"
                    buttonSize="xs"
                    beforeUpload={() => {
                      setSelectedImageType('option');
                      setSelectedOptionIndex(index);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 해설 섹션 */}
      {(question.explanation || userAnswer !== undefined) && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">해설</h4>
          <div className="whitespace-pre-line">{question.explanation || '해설이 없습니다.'}</div>

          {/* 해설 이미지 */}
          <div className="flex flex-wrap gap-2 mt-2">
            {question.explanationImages?.map(img => (
              <div key={img.id} className="relative">
                <img
                  src={img.path}
                  alt="해설 이미지"
                  className="w-24 h-24 object-cover border rounded"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                  onClick={() => removeImage('explanation', img.id)}
                >
                  ✕
                </Button>
              </div>
            ))}

            <ImageUploader
              onUpload={handleImageUpload}
              type="explanation"
              questionId={question.id.toString()}
              buttonText="해설 이미지 추가"
              buttonVariant="outline"
              buttonSize="sm"
              beforeUpload={() => setSelectedImageType('explanation')}
            />
          </div>
        </div>
      )}
    </div>
  );
} 