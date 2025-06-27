import { useState } from "react"
import { IManualQuestion, IParsedQuestion } from '@/types'

export function useManualFormTag({
  question,
  setQuestion,
  parsedQuestionsState,
  setParsedQuestionsState
}: {
  question: IManualQuestion,
  setQuestion: React.Dispatch<React.SetStateAction<IManualQuestion>>,
  parsedQuestionsState: IParsedQuestion[],
  setParsedQuestionsState: React.Dispatch<React.SetStateAction<IParsedQuestion[]>>
}) {
  const [tagInput, setTagInput] = useState("")

  // 태그 추가 함수
  const addTag = (tag: string, toast?: (args: any) => void) => {
    const trimmedInput = tag.trim()
    if (!trimmedInput) return
    const isDuplicate = question.tags.some(
      (t: string) => t.trim().toLowerCase() === trimmedInput.toLowerCase()
    )
    if (isDuplicate) {
      toast && toast({
        title: "중복된 태그",
        description: "이미 존재하는 태그입니다.",
      })
      return
    }
    setQuestion((prev) => ({ ...prev, tags: [...prev.tags, trimmedInput] }))
    setParsedQuestionsState((prev) => {
      if (prev.length === 0) return prev
      const newTagObject = {
        id: Math.random().toString(36).slice(2),
        name: trimmedInput,
        color: 'gray'
      }
      return [
        { ...prev[0], tags: [...prev[0].tags, newTagObject] },
        ...prev.slice(1)
      ]
    })
    setTagInput("")
  }

  // 태그 제거 함수
  const removeTag = (tagToRemove: string) => {
    setQuestion((prev) => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }))
    setParsedQuestionsState((prev) => {
      if (prev.length === 0) return prev
      return [
        { ...prev[0], tags: prev[0].tags.filter((tag: { id: string; name: string; color: string }) => tag.name !== tagToRemove) },
        ...prev.slice(1)
      ]
    })
  }

  return {
    tagInput,
    setTagInput,
    addTag,
    removeTag
  }
} 