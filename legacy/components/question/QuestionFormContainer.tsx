'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ManualInputTab } from './ManualInputTab';
import { PasteInputTab } from './PasteInputTab';
import { ExamCombobox } from '../ExamCombobox'; // 경로 확인 필요
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast'; // 새 경로로 수정
import { IManualQuestion, IExam } from '@/types'; // 필요 타입 임포트

interface QuestionFormContainerProps {
  isEditMode?: boolean;
  initialData?: IManualQuestion; // 수정 시 초기 데이터
  questionId?: string; // 수정 시 문제 ID
  onSuccess?: () => void; // 성공 콜백
}

export function QuestionFormContainer({
  isEditMode = false,
  initialData,
  questionId,
  onSuccess,
}: QuestionFormContainerProps) {
  const { toast } = useToast(); // toast 사용
  const [selectedExamId, setSelectedExamId] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 수정 모드일 경우 초기 시험 ID 설정 (initialData에 examId가 있다고 가정)
  useEffect(() => {
    if (isEditMode && initialData?.examId) {
      setSelectedExamId(initialData.examId);
    }
    // 의존성 배열에 initialData.examId를 직접 넣으면 경고 발생 가능성 있음
    // initialData 객체 전체를 넣거나, 필요하다면 더 안정적인 방법 고려
  }, [isEditMode, initialData]);

  const handleExamChange = (examId: string) => {
    setSelectedExamId(examId);
  };

  // 공통 제출 로직 구현
  const handleFormSubmit = async (data: IManualQuestion | IManualQuestion[], mode: 'manual' | 'paste') => {
    if (!selectedExamId) {
      toast({ title: "시험 선택 필요", description: "문제를 저장할 시험을 선택해주세요." });
      return;
    }

    setIsSubmitting(true);
    let apiUrl = '';
    let apiMethod: 'POST' | 'PUT' = 'POST';
    let requestBody: any;

    try {
      if (mode === 'manual') {
        // 단일 문제 데이터 처리
        const questionData = data as IManualQuestion;
        apiUrl = isEditMode ? `/api/questions/${questionId}` : '/api/questions';
        apiMethod = isEditMode ? 'PUT' : 'POST';

        const formData = new FormData();
        formData.append('examId', selectedExamId);
        formData.append('content', questionData.content);
        // options: number, text, images (URL 배열)
        const optionsForApi = (questionData.options || []).map(opt => ({
          number: opt.number,
          text: opt.text,
          images: (opt.images || []).map(img => img.url)
        }));
        formData.append('options', JSON.stringify(optionsForApi));
        formData.append('answer', String(questionData.answer));
        if (questionData.explanation) {
          formData.append('explanation', questionData.explanation);
        }
        // images, explanationImages: URL 배열
        (questionData.images || []).forEach(img => formData.append('images', img.url));
        (questionData.explanationImages || []).forEach(img => formData.append('explanationImages', img.url));
        
        requestBody = formData;

      } else if (mode === 'paste') {
        // 여러 문제 데이터 처리
        const questionsData = data as IManualQuestion[];
        apiUrl = '/api/questions/batch';
        apiMethod = 'POST';

        const mapImageUrls = (images?: { url: string; hash: string }[]): string[] => (images || []).map(img => img.url).filter(Boolean);

        const questionsDataForApi = questionsData.map(q => ({
          content: q.content,
          options: (q.options || []).map(opt => ({ 
              number: opt.number, 
              text: opt.text, 
              images: mapImageUrls(opt.images)
          })),
          answer: q.answer,
          explanation: q.explanation,
          images: mapImageUrls(q.images),
          explanationImages: mapImageUrls(q.explanationImages),
        }));

        const formData = new FormData();
        formData.append('questions', JSON.stringify(questionsDataForApi));
        formData.append('examId', selectedExamId);
        requestBody = formData;
      }

      // API 호출
      const response = await fetch(apiUrl, {
        method: apiMethod,
        body: requestBody,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '문제 저장에 실패했습니다.');
      }

      toast({ 
        title: "성공", 
        description: mode === 'manual' 
          ? (isEditMode ? "문제가 수정되었습니다." : "문제가 성공적으로 등록되었습니다.")
          : `${(data as IManualQuestion[]).length}개의 문제가 성공적으로 저장되었습니다.`
      });

      if (onSuccess) onSuccess();

    } catch (error: any) {
      console.error("Submit error:", error);
      toast({ title: "오류 발생", description: error.message || "문제 저장 중 오류 발생" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 수정 모드에서는 붙여넣기 탭 비활성화
  const defaultTab = isEditMode ? 'manual' : 'manual'; // 기본값은 항상 manual로?

  return (
    <div className="space-y-6 p-4">
      {/* 시험 선택 (공통) */}
      <div className="space-y-2">
        <Label htmlFor="exam-select-container">시험 선택</Label>
        <ExamCombobox value={selectedExamId} onChange={handleExamChange} />
        {!selectedExamId && (
            <p className="text-sm text-destructive mt-1">시험을 선택해야 문제를 등록할 수 있습니다.</p>
        )}
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">직접 입력</TabsTrigger>
          {/* 수정 모드에서는 붙여넣기 탭 비활성화 */} 
          <TabsTrigger value="paste" disabled={isEditMode}>
             텍스트 붙여넣기
          </TabsTrigger>
        </TabsList>
        <TabsContent value="manual">
          <ManualInputTab
            // key={questionId || 'new'} // 필요시 폼 리셋을 위한 key
            initialData={initialData} // 수정 모드 시 전달
            isEditMode={isEditMode}
            selectedExamId={selectedExamId}
            onSubmit={(data) => handleFormSubmit(data, 'manual')}
            isSubmitting={isSubmitting}
          />
        </TabsContent>
        {!isEditMode && (
          <TabsContent value="paste">
            <PasteInputTab
              selectedExamId={selectedExamId}
              onSubmit={(data) => handleFormSubmit(data, 'paste')}
              isSubmitting={isSubmitting}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
} 