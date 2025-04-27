"use client"

import { IParsedQuestion, IQuestionListProps } from "./types"
import { QuestionItem } from "./QuestionItem"

export function QuestionList({
  questions,
  selectedQuestionIndex,
  setSelectedQuestionIndex,
  questionTagInput,
  setQuestionTagInput,
  explanationText,
  setExplanationText,
  onSetAnswer,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
  onAddQuestionTag,
  onRemoveQuestionTag,
  onAddImage,
  onAddExplanationImage,
  onAddExplanationText
}: IQuestionListProps) {
  if (questions.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-6">
      <h3 className="font-medium mb-3">분석된 문제 ({questions.length}개)</h3>
      <div className="grid grid-cols-1 gap-4">
        {questions.map((question, index) => (
          <QuestionItem
            key={index}
            question={question}
            index={index}
            isSelected={selectedQuestionIndex === index}
            questionTagInput={selectedQuestionIndex === index ? questionTagInput : ''}
            setQuestionTagInput={setQuestionTagInput}
            explanationText={explanationText}
            setExplanationText={setExplanationText}
            onSetAnswer={(qIndex, aIndex) => onSetAnswer(qIndex, aIndex)}
            onAddOption={(qIndex) => onAddOption(qIndex)}
            onUpdateOption={(qIndex, oIndex, text) => onUpdateOption(qIndex, oIndex, text)}
            onRemoveOption={(qIndex, oIndex) => onRemoveOption(qIndex, oIndex)}
            onAddQuestionTag={() => onAddQuestionTag(index)}
            onRemoveQuestionTag={(_, tag) => onRemoveQuestionTag(index, tag)}
            onAddImage={() => onAddImage(index)}
            onAddExplanationImage={() => onAddExplanationImage(index)}
            onAddExplanationText={() => onAddExplanationText(index)}
          />
        ))}
      </div>
    </div>
  )
} 