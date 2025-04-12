"use client"

import React from "react";
import { IQuestionItemProps } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { IoMdAdd, IoMdTrash } from "react-icons/io";
import { MdAddPhotoAlternate } from "react-icons/md";
import { cn } from "@/lib/utils";

export function QuestionItem({
  index,
  question,
  isSelected,
  questionTagInput,
  setQuestionTagInput,
  onSetAnswer,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
  onAddQuestionTag,
  onRemoveQuestionTag,
  onAddImage,
  onAddExplanationImage,
  onAddExplanationText,
  explanationText,
  setExplanationText,
}: IQuestionItemProps) {
  return (
    <div
      className={cn(
        "border rounded-md p-4 my-4 bg-white shadow-sm hover:shadow-md transition-shadow",
        isSelected && "border-blue-500 ring-2 ring-blue-200"
      )}
    >
      <h3 className="text-lg font-semibold mb-2">문항 {index + 1}</h3>

      {/* 문제 내용 */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-700 mb-1">문제</h4>
        <div className="whitespace-pre-wrap bg-gray-50 p-3 rounded-md">
          {question.content}
        </div>
      </div>

      {/* 보기 (예시) 섹션 */}
      {question.examples && question.examples.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-700 mb-1">보기</h4>
          <div className="space-y-1">
            {question.examples.map((example, eIdx) => (
              <div key={eIdx} className="bg-gray-50 p-2 rounded-md">
                {example}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 문제 이미지 */}
      {question.images && question.images.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-700 mb-1">이미지</h4>
          <div className="flex flex-wrap gap-2">
            {question.images.map((img, imgIdx) => (
              <div key={imgIdx} className="relative">
                <img
                  src={img}
                  alt={`문제 이미지 ${imgIdx + 1}`}
                  className="w-48 h-auto object-contain border rounded-md"
                />
              </div>
            ))}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="mt-2 flex items-center gap-1"
            onClick={() => onAddImage(index)}
          >
            <MdAddPhotoAlternate className="w-4 h-4" />
            <span>이미지 추가</span>
          </Button>
        </div>
      )}

      {/* 선택지 섹션 */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium text-gray-700">선택지</h4>
          <Button
            size="sm"
            variant="outline"
            className="flex items-center gap-1"
            onClick={() => onAddOption(index)}
          >
            <IoMdAdd className="w-4 h-4" />
            <span>선택지 추가</span>
          </Button>
        </div>
        <div className="space-y-2">
          {question.options.map((option, optionIdx) => (
            <div key={optionIdx} className="flex items-center gap-2">
              <Button
                size="sm"
                variant={question.answer === optionIdx ? "default" : "outline"}
                className={cn(
                  "w-8 h-8 rounded-full p-0 flex items-center justify-center",
                  question.answer === optionIdx
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-700"
                )}
                onClick={() => onSetAnswer(index, optionIdx)}
              >
                {optionIdx + 1}
              </Button>
              <Input
                value={option}
                onChange={(e) =>
                  onUpdateOption(index, optionIdx, e.target.value)
                }
                className="flex-1"
              />
              <Button
                size="sm"
                variant="outline"
                className="p-1"
                onClick={() => onRemoveOption(index, optionIdx)}
              >
                <IoMdTrash className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* 태그 섹션 */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-700 mb-1">태그</h4>
        <div className="flex flex-wrap gap-1 mb-2">
          {question.tags?.map((tag, tagIdx) => (
            <Badge
              key={tagIdx}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {tag}
              <button
                onClick={() => onRemoveQuestionTag(index, tag)}
                className="ml-1 text-gray-500 hover:text-gray-700"
              >
                <IoMdTrash className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={questionTagInput}
            onChange={(e) => setQuestionTagInput(e.target.value)}
            placeholder="태그 추가"
            className="flex-1"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAddQuestionTag(index)}
          >
            추가
          </Button>
        </div>
      </div>

      {/* 해설 섹션 */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-700 mb-1">해설</h4>
        {question.explanation && (
          <div className="whitespace-pre-wrap bg-gray-50 p-3 rounded-md mb-2">
            {question.explanation}
          </div>
        )}
        <div className="mb-2">
          <Textarea
            value={explanationText}
            onChange={(e) => setExplanationText(e.target.value)}
            placeholder="해설을 입력하세요"
            className="min-h-[100px]"
          />
          <Button
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={() => onAddExplanationText(index)}
          >
            해설 추가
          </Button>
        </div>
      </div>

      {/* 해설 이미지 */}
      {question.explanationImages && question.explanationImages.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-700 mb-1">해설 이미지</h4>
          <div className="flex flex-wrap gap-2">
            {question.explanationImages.map((img, imgIdx) => (
              <div key={imgIdx} className="relative">
                <img
                  src={img}
                  alt={`해설 이미지 ${imgIdx + 1}`}
                  className="w-48 h-auto object-contain border rounded-md"
                />
              </div>
            ))}
          </div>
        </div>
      )}
      <Button
        size="sm"
        variant="outline"
        className="flex items-center gap-1"
        onClick={() => onAddExplanationImage(index)}
      >
        <MdAddPhotoAlternate className="w-4 h-4" />
        <span>해설 이미지 추가</span>
      </Button>
    </div>
  );
} 