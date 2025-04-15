"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ManualForm } from "@/components/question/ManualForm";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { IQuestion } from "@/types";

interface EditQuestionPageProps {
  params: {
    questionId: string;
  };
}

export default function EditQuestionPage({ params }: EditQuestionPageProps) {
  const { questionId } = params;
  const { toast } = useToast();
  const router = useRouter();
  const [question, setQuestion] = useState<IQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/questions/${questionId}`);
        
        if (!response.ok) {
          throw new Error("문제를 불러오는데 실패했습니다.");
        }
        
        const data = await response.json();
        setQuestion(data.question);
      } catch (error) {
        console.error("문제 로딩 오류:", error);
        setError(error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [questionId]);

  // 문제 데이터를 ManualForm에서 사용 가능한 형식으로 변환
  const convertToFormData = (data: any) => {
    // API에서 가져온 데이터를 폼에서 사용할 수 있는 형식으로 변환
    // 필요시 확장
    return {
      id: data.id,
      number: data.number || 1,
      content: data.content,
      options: data.options,
      answer: data.answer,
      explanation: data.explanation || "",
      images: data.images || [],
      explanationImages: data.explanationImages || [],
      tags: data.tags || [],
    };
  };

  const handleSubmitSuccess = () => {
    toast({
      title: "문제 수정 완료",
      description: "문제가 성공적으로 수정되었습니다.",
    });
    
    // 문제 목록 페이지로 리다이렉트
    router.push("/questions/list");
  };

  if (loading) {
    return (
      <div className="container py-8 text-center">
        <LoadingSpinner />
        <p className="mt-4 text-gray-500">문제를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertTitle>오류</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4 text-center">
          <button
            className="text-blue-600 hover:underline"
            onClick={() => router.push("/questions/list")}
          >
            문제 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">문제 수정</h1>
      
      {question && (
        <div className="space-y-6">
          <p className="text-gray-600 mb-4">
            문제 내용, 선택지, 정답, 해설 등을 직접 수정하세요.
          </p>
          <ManualForm
            initialData={convertToFormData(question)}
            isEditMode={true}
            questionId={questionId}
            onSuccess={handleSubmitSuccess}
            apiMethod="PUT"
          />
        </div>
      )}
    </div>
  );
} 