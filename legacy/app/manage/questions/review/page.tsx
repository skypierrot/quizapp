"use client";

import { useState } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PasteInput } from "@/components/question/PasteInput";
import { ResolvedQuestions } from "@/components/question/ResolvedQuestions";
import { IQuestion } from "@/types";

export default function QuestionReviewPage() {
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleParsed = (parsedQuestions: IQuestion[], parseErrors: string[]) => {
    setQuestions(parsedQuestions);
    setErrors(parseErrors);
    setSaveStatus('idle');
  };

  const handleQuestionUpdate = (updatedQuestion: IQuestion) => {
    setQuestions(prevQuestions => 
      prevQuestions.map(q => 
        q.id === updatedQuestion.id ? updatedQuestion : q
      )
    );
  };

  const handleSave = async (questionsToSave: IQuestion[]) => {
    // 실제 API 저장 구현
    try {
      // const response = await fetch('/api/questions/batch', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(questionsToSave),
      // });
      
      // if (!response.ok) {
      //   throw new Error('문제 저장 중 오류가 발생했습니다.');
      // }
      
      // await response.json();
      
      // 임시 구현 (API 연결 전)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('문제 저장 오류:', error);
      setSaveStatus('error');
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">문제 리뷰 및 이미지 추가</h1>
      
      {saveStatus === 'success' && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <AlertTitle>저장 완료</AlertTitle>
          <AlertDescription>
            문제가 성공적으로 저장되었습니다.
          </AlertDescription>
        </Alert>
      )}
      
      {saveStatus === 'error' && (
        <Alert className="mb-6 bg-red-50 border-red-200" variant="destructive">
          <AlertTitle>저장 오류</AlertTitle>
          <AlertDescription>
            문제 저장 중 오류가 발생했습니다. 다시 시도해주세요.
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="paste" className="space-y-6">
        <TabsList>
          <TabsTrigger value="paste">문제 붙여넣기</TabsTrigger>
          <TabsTrigger value="reviewed" disabled={questions.length === 0}>
            분석된 문제 ({questions.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="paste" className="space-y-6">
          <p className="text-gray-600">
            문제와 선택지를 포함한 텍스트를 아래 영역에 붙여넣고 분석해주세요.
            각 문제는 번호(예: "1.")로 시작해야 하며, 선택지는 원 기호(①, ②, ③, ④)로 시작해야 합니다.
          </p>
          <PasteInput onParsed={handleParsed} />
        </TabsContent>
        
        <TabsContent value="reviewed">
          <ResolvedQuestions 
            questions={questions}
            errors={errors}
            onQuestionUpdate={handleQuestionUpdate}
            onSave={handleSave}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
} 