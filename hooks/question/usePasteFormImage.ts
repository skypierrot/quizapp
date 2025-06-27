import { useState, useEffect, useRef } from "react"
import { convertToBase64 } from "@/utils/image"

interface IParsedQuestion {
  content: string;
  options: string[];
  answer: number;
  images: string[];
  explanation?: string;
  explanationImages?: string[];
  tags?: string[];
  examples?: string[];
}

type ImageAreaType = 'question' | 'explanation'

interface UsePasteFormImageProps {
  parsedQuestions: IParsedQuestion[]
  setParsedQuestions: React.Dispatch<React.SetStateAction<IParsedQuestion[]>>
  safeToast: (title: string, description?: string, variant?: string) => void
}

export function usePasteFormImage({ parsedQuestions, setParsedQuestions, safeToast }: UsePasteFormImageProps) {
  const [activeImageArea, setActiveImageArea] = useState<{index: number, type: ImageAreaType} | null>(null)
  const [isImageAreaActive, setIsImageAreaActive] = useState(false)
  const [imageEventProcessing, setImageEventProcessing] = useState(false)
  const [processingCount, setProcessingCount] = useState(0)
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(-1)
  const [selectedImageType, setSelectedImageType] = useState<ImageAreaType>('question')

  // 디바운스 함수로 마우스 이벤트 처리
  const setActiveImageAreaWithDebounce = (value: typeof activeImageArea) => {
    if (imageEventProcessing) {
      safeToast("이미지 처리 중입니다. 잠시 후 다시 시도하세요.", "", "warning")
      return
    }
    setActiveImageArea(value)
  }

  // 전역 붙여넣기 이벤트 리스너 등록
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (processingCount > 0) return
      if (!activeImageArea) {
        safeToast("이미지 영역을 클릭하거나 마우스를 올려주세요.", "", "warning")
        return
      }
      const items = e.clipboardData?.items
      if (!items) return
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') === 0) {
          const blob = items[i].getAsFile()
          if (blob) {
            setProcessingCount(prev => prev + 1)
            setImageEventProcessing(true)
            handleImageBlob(blob, activeImageArea.index, activeImageArea.type === 'explanation')
              .finally(() => {
                setTimeout(() => {
                  setImageEventProcessing(false)
                  setProcessingCount(prev => Math.max(0, prev - 1))
                }, 300)
              })
            e.preventDefault()
            break
          }
        }
      }
    }
    window.addEventListener('paste', handleGlobalPaste)
    return () => {
      window.removeEventListener('paste', handleGlobalPaste)
    }
  }, [activeImageArea, imageEventProcessing, processingCount, parsedQuestions])

  // 이미지 Blob 처리 함수
  const handleImageBlob = async (blob: File, questionIndex: number, isExplanation: boolean) => {
    if (!blob) {
      safeToast("이미지가 선택되지 않았습니다", "", "destructive")
      return Promise.reject("이미지가 선택되지 않았습니다")
    }
    if (blob.size > 10 * 1024 * 1024) {
      safeToast("이미지 크기가 너무 큽니다", "10MB 이하의 이미지만 업로드 가능합니다", "destructive")
      return Promise.reject("이미지 크기 초과")
    }
    if (!blob.type.startsWith('image/')) {
      safeToast("이미지 파일만 업로드 가능합니다", "", "destructive")
      return Promise.reject("이미지 파일이 아님")
    }
    try {
      const base64 = await convertToBase64(blob)
      const generateImageHash = (imgData: string) => {
        if (imgData.length > 300) {
          const start = imgData.substring(0, 100)
          const middle = imgData.substring(Math.floor(imgData.length / 2) - 50, Math.floor(imgData.length / 2) + 50)
          const end = imgData.substring(imgData.length - 100)
          return start + middle + end
        }
        return imgData
      }
      setParsedQuestions(prevState => {
        const currentQuestion = prevState[questionIndex]
        if (!currentQuestion) {
          safeToast("문제를 찾을 수 없습니다", "", "destructive")
          return prevState
        }
        const currentImages = isExplanation 
          ? (currentQuestion.explanationImages || []) 
          : (currentQuestion.images || [])
        const newImageHash = generateImageHash(base64)
        const isDuplicate = currentImages.some(img => generateImageHash(img) === newImageHash)
        if (isDuplicate) {
          safeToast("이미지 중복", "이 이미지는 이미 등록되었습니다.", "warning")
          return prevState
        }
        const updatedQuestions = [...prevState]
        const updatedQuestion = {...updatedQuestions[questionIndex]}
        if (isExplanation) {
          updatedQuestion.explanationImages = [...(updatedQuestion.explanationImages || []), base64]
          safeToast("이미지 추가 완료", "해설에 이미지가 추가되었습니다.", "success")
        } else {
          updatedQuestion.images = [...(updatedQuestion.images || []), base64]
          safeToast("이미지 추가 완료", "문제에 이미지가 추가되었습니다.", "success")
        }
        updatedQuestions[questionIndex] = updatedQuestion
        return updatedQuestions
      })
      return Promise.resolve()
    } catch (error) {
      safeToast("이미지 처리 실패", "이미지를 처리하는 중 오류가 발생했습니다.", "destructive")
      return Promise.reject(error)
    }
  }

  // 이미지 업로드 핸들러 (파일 선택 시)
  const handleImageUpload = async (file: File) => {
    if (selectedQuestionIndex < 0) return
    await handleImageBlob(
      file, 
      selectedQuestionIndex, 
      selectedImageType === 'explanation'
    )
  }

  // 이미지 추가 함수
  const addImageToQuestion = (e: React.MouseEvent, questionIndex: number) => {
    e.stopPropagation()
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    setSelectedQuestionIndex(questionIndex)
    setSelectedImageType('question')
    input.click()
    input.onchange = (event) => {
      if (event.target instanceof HTMLInputElement && event.target.files && event.target.files.length > 0) {
        const file = event.target.files[0]
        handleImageUpload(file)
      }
    }
  }

  // 해설 이미지 추가 함수
  const addExplanationImageToQuestion = (e: React.MouseEvent, questionIndex: number) => {
    e.stopPropagation()
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    setSelectedQuestionIndex(questionIndex)
    setSelectedImageType('explanation')
    input.click()
    input.onchange = (event) => {
      if (event.target instanceof HTMLInputElement && event.target.files && event.target.files.length > 0) {
        const file = event.target.files[0]
        handleImageUpload(file)
      }
    }
  }

  // 이미지 확대 모달 핸들러
  const handleImageZoom = (imageUrl: string) => {
    setZoomedImage(imageUrl)
  }

  // 이미지 영역 클릭 처리 함수
  const handleImageAreaClick = (index: number, type: ImageAreaType) => {
    if (imageEventProcessing) return
    const isCurrentlyActive = activeImageArea?.index === index && 
                              activeImageArea?.type === type && 
                              isImageAreaActive
    if (isCurrentlyActive) {
      if (type === 'question') {
        addImageToQuestion(new MouseEvent('click') as any, index)
      } else {
        addExplanationImageToQuestion(new MouseEvent('click') as any, index)
      }
    } else {
      setActiveImageArea({ index, type })
      setIsImageAreaActive(true)
    }
  }

  // 이미지 영역 마우스 떠남 처리
  const handleImageAreaMouseLeave = () => {
    if (!imageEventProcessing) {
      setActiveImageArea(null)
      setIsImageAreaActive(false)
    }
  }

  // 마우스/클릭 이벤트로 이미지 영역 상태 초기화
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isImageAreaActive && !imageEventProcessing) {
        const isMouseOverImageArea = (e.target as Element)?.closest('[data-image-area="true"]')
        if (!isMouseOverImageArea) {
          setActiveImageArea(null)
          setIsImageAreaActive(false)
        }
      }
    }
    const handleDocumentClick = (e: MouseEvent) => {
      if (isImageAreaActive && !imageEventProcessing) {
        const isClickOnImageArea = (e.target as Element)?.closest('[data-image-area="true"]')
        if (!isClickOnImageArea) {
          setActiveImageArea(null)
          setIsImageAreaActive(false)
        }
      }
    }
    document.addEventListener('mousemove', handleGlobalMouseMove)
    document.addEventListener('click', handleDocumentClick)
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('click', handleDocumentClick)
    }
  }, [isImageAreaActive, imageEventProcessing])

  return {
    activeImageArea,
    isImageAreaActive,
    imageEventProcessing,
    processingCount,
    zoomedImage,
    setZoomedImage,
    selectedQuestionIndex,
    selectedImageType,
    setActiveImageAreaWithDebounce,
    handleImageBlob,
    handleImageUpload,
    addImageToQuestion,
    addExplanationImageToQuestion,
    handleImageZoom,
    handleImageAreaClick,
    handleImageAreaMouseLeave,
    setActiveImageArea,
    setIsImageAreaActive
  }
} 