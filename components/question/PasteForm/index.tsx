"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { TagManager } from "./TagManager"
import { PasteInput } from "./PasteInput"
import { QuestionList } from "./QuestionList"
import { useToast } from "@/components/ui/use-toast"
import { useQuestionState, useTagState, useImageUpload } from "./hooks"

export function PasteForm() {
  // toast 기능 추가
  const { toast } = useToast();
  
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
    addQuestionTag,
    removeQuestionTag,
    addImageToQuestion,
    addExplanationImageToQuestion,
    addExplanationTextToQuestion,
    handleSubmit
  } = useQuestionState()
  
  const {
    globalTags,
    globalTagInput,
    setGlobalTagInput,
    questionTagInput,
    setQuestionTagInput,
    examName,
    setExamName,
    year,
    setYear,
    subject,
    setSubject,
    session,
    setSession,
    addGlobalTag,
    removeGlobalTag,
    applyBasicTags
  } = useTagState(parsedQuestions, setParsedQuestions)
  
  const {
    clipboardImage,
    setClipboardImage,
    explanationText,
    setExplanationText,
    handlePaste,
  } = useImageUpload(parsedQuestions, setParsedQuestions)

  // 태그 적용 함수 수정
  const handleApplyBasicTags = () => {
    // 기본 태그 유효성 검사
    if (!examName.trim() || !year.trim() || !session.trim()) {
      toast({
        title: "필수 태그를 입력해주세요",
        description: "시험명, 년도, 회차는 필수 입력 항목입니다.",
        variant: "destructive",
      });
      return;
    }
    
    const isSuccess = applyBasicTags();
    
    if (isSuccess) {
      toast({
        title: "태그가 적용되었습니다.",
        description: `'시험명:${examName}', '년도:${year}', '회차:${session}'${subject ? `, '과목:${subject}'` : ''}`,
        variant: "default",
      });
    }
  };

  // 문제 분석 함수 수정
  const handleParseWithTags = () => {
    // 기본 태그 유효성 검사
    if (!examName.trim() || !year.trim() || !session.trim()) {
      toast({
        title: "필수 태그를 입력해주세요",
        description: "시험명, 년도, 회차는 필수 입력 항목입니다.",
        variant: "destructive",
      });
      return;
    }
    
    handleParseQuestions(globalTags);
  };

  return (
    <div className="space-y-6">
      {/* 붙여넣기 영역 */}
      <div>
        {/* 태그 관리자 컴포넌트 */}
        <TagManager
          globalTags={globalTags}
          globalTagInput={globalTagInput}
          setGlobalTagInput={setGlobalTagInput}
          examName={examName}
          setExamName={setExamName}
          year={year}
          setYear={setYear}
          session={session}
          setSession={setSession}
          subject={subject}
          setSubject={setSubject}
          onAddGlobalTag={addGlobalTag}
          onRemoveGlobalTag={removeGlobalTag}
          onApplyBasicTags={handleApplyBasicTags}
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
          onClick={handleParseWithTags}
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