"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { TagManager } from "./TagManager"
import { PasteInput } from "./PasteInput"
import { QuestionList } from "./QuestionList"

import { useQuestionState } from "./hooks/useQuestionState"
import { useTagState } from "./hooks/useTagState"
import { useImageUpload } from "./hooks/useImageUpload"

export function PasteForm() {
  // 참조 및 UI 상태
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isPasteAreaFocused, setIsPasteAreaFocused] = useState(false)
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(-1)
  
  // 커스텀 훅으로 상태 관리
  const {
    parsedQuestions,
    setParsedQuestions,
    pasteValue,
    setPasteValue,
    isProcessing,
    isSubmitting,
    errorMessage,
    hasWarning,
    pasteExample,
    handleParseQuestions,
    setQuestionAnswer,
    addOption,
    updateOption,
    removeOption,
    handleSubmit
  } = useQuestionState()
  
  const {
    globalTags,
    globalTagInput,
    setGlobalTagInput,
    questionTagInput,
    setQuestionTagInput,
    year,
    setYear,
    subject,
    setSubject,
    session,
    setSession,
    addGlobalTag,
    removeGlobalTag,
    addQuestionTag,
    removeQuestionTag,
    applyBasicTags
  } = useTagState(parsedQuestions, setParsedQuestions)
  
  const {
    clipboardImage,
    setClipboardImage,
    explanationText,
    setExplanationText,
    handlePaste,
    addImageToQuestion,
    addExplanationImageToQuestion,
    addExplanationTextToQuestion,
  } = useImageUpload(parsedQuestions, setParsedQuestions)

  return (
    <div className="space-y-6">
      {/* 붙여넣기 영역 */}
      <div>
        {/* 태그 관리자 컴포넌트 */}
        <TagManager
          globalTags={globalTags}
          globalTagInput={globalTagInput}
          setGlobalTagInput={setGlobalTagInput}
          year={year}
          setYear={setYear}
          subject={subject}
          setSubject={setSubject}
          session={session}
          setSession={setSession}
          onAddGlobalTag={addGlobalTag}
          onRemoveGlobalTag={removeGlobalTag}
          onApplyBasicTags={applyBasicTags}
        />
        
        {/* 붙여넣기 입력 컴포넌트 */}
        <PasteInput
          pasteValue={pasteValue}
          setPasteValue={setPasteValue}
          onPaste={handlePaste}
          isPasteAreaFocused={isPasteAreaFocused}
          setIsPasteAreaFocused={setIsPasteAreaFocused}
          clipboardImage={clipboardImage}
          setClipboardImage={setClipboardImage}
          textareaRef={textareaRef}
          pasteExample={pasteExample}
        />
      </div>

      {/* 오류 메시지 표시 */}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
          {errorMessage}
        </div>
      )}

      {/* 버튼 영역 */}
      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleParseQuestions(globalTags)}
          disabled={isProcessing || isSubmitting || !pasteValue.trim()}
        >
          {isProcessing ? "분석 중..." : "문제 분석"}
        </Button>
        
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || parsedQuestions.length === 0}
        >
          {isSubmitting ? "등록 중..." : `문제 등록 (${parsedQuestions.length}개)`}
        </Button>
      </div>

      {/* 문제 목록 표시 */}
      <QuestionList
        questions={parsedQuestions}
        selectedQuestionIndex={selectedQuestionIndex}
        setSelectedQuestionIndex={setSelectedQuestionIndex}
        questionTagInput={questionTagInput}
        setQuestionTagInput={setQuestionTagInput}
        explanationText={explanationText}
        setExplanationText={setExplanationText}
        onSetAnswer={setQuestionAnswer}
        onAddOption={addOption}
        onUpdateOption={updateOption}
        onRemoveOption={removeOption}
        onAddQuestionTag={addQuestionTag}
        onRemoveQuestionTag={removeQuestionTag}
        onAddImage={addImageToQuestion}
        onAddExplanationImage={addExplanationImageToQuestion}
        onAddExplanationText={addExplanationTextToQuestion}
      />
    </div>
  )
} 