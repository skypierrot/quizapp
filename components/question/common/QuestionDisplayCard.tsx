'use client';

import React from 'react'; 
import Link from 'next/link'; 
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; 
import { BookOpen, User, Calendar } from "lucide-react"; 
import { IQuestion } from "@/types";
import { CommonImage } from "@/components/common/CommonImage"; 
import { getImageUrl } from "@/utils/image"; 

interface QuestionDisplayCardProps {
  question: IQuestion;
  index: number;       
  page?: number;      
  
  showViewExplanationButton?: boolean;
  onViewExplanation?: (question: IQuestion) => void; 
  onImageZoom?: (url: string) => void; 

  showAdminControls?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function QuestionDisplayCard({
  question,
  index,
  page = 1, 
  showViewExplanationButton = false,
  onViewExplanation,
  onImageZoom,
  showAdminControls = false,
  onEdit,
  onDelete,
}: QuestionDisplayCardProps) {
  const displayTags: string[] = [];
  if (question.examName) displayTags.push(`시험명:${question.examName}`);
  if (question.examDate) displayTags.push(`날짜:${question.examDate}`);
  if (question.examSubject) displayTags.push(`과목:${question.examSubject}`);
  if (question.tags && question.tags.length > 0) {
    displayTags.push(...question.tags);
  }

  const handleImageZoom = onImageZoom || (() => {});

  return (
    <Card className="h-full overflow-hidden flex flex-col">
      <CardHeader className="p-4 pb-2 space-y-2 bg-gray-50">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="font-medium">#{(page - 1) * 10 + index + 1}</span> 
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <User className="h-3 w-3" />
              <span>{question.userId || "익명"}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Calendar className="h-3 w-3" />
              <span>{question.createdAt ? new Date(question.createdAt).toLocaleDateString() : ''}</span>
            </div>
          </div>
        </div>
        {displayTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {displayTags.map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <div className="mb-3">
          <p className="font-medium">{question.content}</p> 
        </div>
        <div className="mt-4 space-y-4">
          {question.images && question.images.length > 0 && (
            <div className="mt-2">
              <h4 className="text-sm font-medium mb-2">문제 이미지</h4>
              <div className="flex flex-col gap-3">
                {question.images.map((img, imgIdx) => (
                  <CommonImage
                    key={imgIdx}
                    src={getImageUrl(img)}
                    alt={`문제 이미지 ${imgIdx + 1}`}
                    className="block max-w-full h-auto object-contain mx-auto border rounded"
                    containerClassName="max-w-[400px] max-h-[300px] flex items-center justify-center cursor-zoom-in"
                    maintainAspectRatio={true}
                    onClick={() => handleImageZoom(getImageUrl(img))}
                  />
                ))}
              </div>
            </div>
          )}
          {question.explanationImages && question.explanationImages.length > 0 && (
              <div className="mt-2">
                <h4 className="text-sm font-medium mb-2">해설 이미지</h4>
                <div className="flex flex-col gap-3">
                  {question.explanationImages.map((img, imgIdx) => (
                    <CommonImage
                      key={imgIdx}
                      src={getImageUrl(img)}
                      alt={`해설 이미지 ${imgIdx + 1}`}
                      className="block max-w-full h-auto object-contain mx-auto border rounded"
                      containerClassName="max-w-[400px] max-h-[300px] flex items-center justify-center cursor-zoom-in"
                      maintainAspectRatio={true}
                      onClick={() => handleImageZoom(getImageUrl(img))}
                    />
                  ))}
                </div>
              </div>
            )}
          {question.options && question.options.length > 0 && (
            <div className="mt-2">
              <h4 className="text-sm font-medium mb-1">선택지</h4>
              <div className="space-y-1">
                {question.options.map((option, optIdx) => (
                  <div
                    key={optIdx}
                    className={`p-3 rounded-md text-base transition-all duration-150
                      ${question.answer === optIdx
                        ? 'border-2 bg-green-50 text-black font-extrabold shadow-lg ring-2 ring-green-300' 
                        : 'border border-gray-200 bg-gray-100 text-gray-800' 
                      }
                    `}
                  >
                    {optIdx + 1}. {option.text}
                    {option.images && option.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {option.images.map((img, imgIdx) => (
                          <CommonImage
                            key={imgIdx}
                            src={getImageUrl(img)}
                            alt={`선택지 ${optIdx + 1} 이미지 ${imgIdx + 1}`}
                            className="block max-w-full h-auto object-contain mx-auto border rounded"
                            containerClassName="max-w-[200px] max-h-[150px] flex items-center justify-center cursor-zoom-in" 
                            maintainAspectRatio={true}
                            onClick={() => handleImageZoom(getImageUrl(img))}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
           {question.explanation && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-bold mb-2 text-blue-600">해설</h4>
              <p className="whitespace-pre-wrap text-sm">{question.explanation}</p>
            </div>
          )}
        </div>
      </CardContent>
      {(showViewExplanationButton || showAdminControls) && (
        <CardFooter className="p-4 border-t mt-auto">
          <div className="flex gap-2 w-full">
            {showViewExplanationButton && onViewExplanation && (
              <Button variant="outline" size="sm" className="flex-1 w-full h-10 gap-1" onClick={() => onViewExplanation(question)}>
                <BookOpen className="h-4 w-4" />
                해설 보기
              </Button>
            )}
            {showAdminControls && onEdit && question.id && (
              <Link href={`/manage/questions/edit/${question.id}`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full h-10">✏️ 수정</Button>
              </Link>
            )}
            {showAdminControls && onDelete && question.id && (
              <Button variant="outline" size="sm" className="flex-1 w-full h-10 hover:bg-destructive hover:text-destructive-foreground" onClick={() => onDelete(question.id!)}>
                🗑️ 삭제
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
} 