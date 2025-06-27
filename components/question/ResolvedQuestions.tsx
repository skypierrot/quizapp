'use client';

import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, Loader2, ImagePlus, Save } from 'lucide-react';
import { IQuestion } from '@/types';

interface ResolvedQuestionsProps {
  questions: IQuestion[];
  errors: string[];
  onQuestionUpdate: (question: IQuestion) => void;
  onSave: (questions: IQuestion[]) => Promise<void>;
}

export function ResolvedQuestions({ 
  questions, 
  errors, 
  onQuestionUpdate, 
  onSave 
}: ResolvedQuestionsProps) {
  const [activeTab, setActiveTab] = useState<string>(questions.length > 0 ? questions[0].id : '');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleQuestionChange = (id: string, field: keyof IQuestion, value: any) => {
    const question = questions.find(q => q.id === id);
    if (!question) return;

    const updatedQuestion = { ...question, [field]: value };
    onQuestionUpdate(updatedQuestion);
  };

  const handleChoiceChange = (id: string, index: number, value: string) => {
    const question = questions.find(q => q.id === id);
    if (!question) return;

    const newChoices = [...question.choices];
    newChoices[index] = value;

    const updatedQuestion = { ...question, choices: newChoices };
    onQuestionUpdate(updatedQuestion);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await onSave(questions);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (id: string, file: File) => {
    // 이미지 업로드 로직 (임시로 URL 생성)
    const imageUrl = URL.createObjectURL(file);
    handleQuestionChange(id, 'imageUrl', imageUrl);
    
    // 실제 구현에서는 서버에 업로드하는 로직이 필요합니다
    // const formData = new FormData();
    // formData.append('image', file);
    // formData.append('questionId', id);
    
    // const response = await fetch('/api/upload-image', {
    //   method: 'POST',
    //   body: formData,
    // });
    
    // if (response.ok) {
    //   const data = await response.json();
    //   handleQuestionChange(id, 'imageUrl', data.imageUrl);
    // }
  };

  if (questions.length === 0) {
    return (
      <div className="text-center p-10 text-gray-500">
        분석된 문제가 없습니다. 먼저 문제를 붙여넣고 분석해주세요.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {errors.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <p className="font-medium text-amber-700">다음 문제가 발생했습니다:</p>
              <ul className="list-disc list-inside mt-1 text-sm text-amber-600">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">분석된 문제 ({questions.length}개)</h2>
        <Button 
          onClick={handleSaveAll} 
          disabled={isSaving || questions.length === 0}
          className="bg-green-600 hover:bg-green-700"
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          모든 문제 저장
        </Button>
      </div>

      <Card className="border-gray-200">
        <CardContent className="p-0">
          <div className="flex">
            <div className="w-1/4 border-r border-gray-200 p-4 max-h-[600px] overflow-y-auto">
              <div className="font-medium mb-2 text-gray-500 text-sm">문제 목록</div>
              <TabsList className="flex flex-col space-y-1 bg-transparent p-0">
                {questions.map((question, index) => (
                  <TabsTrigger
                    key={question.id}
                    value={question.id}
                    onClick={() => setActiveTab(question.id)}
                    className={`justify-start text-left px-3 py-2 h-auto ${
                      activeTab === question.id ? 'bg-gray-100' : ''
                    }`}
                  >
                    <span className="truncate">
                      {index + 1}. {question.text.substring(0, 30)}
                      {question.text.length > 30 ? '...' : ''}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="w-3/4 p-6 max-h-[600px] overflow-y-auto">
              {questions.map((question) => (
                <div
                  key={question.id}
                  className={`space-y-4 ${activeTab === question.id ? '' : 'hidden'}`}
                >
                  <div className="space-y-2">
                    <Label htmlFor={`question-${question.id}`}>문제 내용</Label>
                    <Textarea
                      id={`question-${question.id}`}
                      value={question.text}
                      onChange={(e) => handleQuestionChange(question.id, 'text', e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-4">
                    <Label>선택지</Label>
                    {question.choices.map((choice, index) => (
                      <div key={`choice-${question.id}-${index}`} className="flex items-center gap-2">
                        <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100">
                          {index + 1}
                        </div>
                        <Input
                          value={choice}
                          onChange={(e) => handleChoiceChange(question.id, index, e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuestionChange(question.id, 'correctAnswer', index + 1)}
                          className={`min-w-[80px] ${
                            question.correctAnswer === index + 1
                              ? 'bg-green-50 border-green-200 text-green-700'
                              : ''
                          }`}
                        >
                          {question.correctAnswer === index + 1 ? (
                            <>
                              <CheckCircle className="mr-1 h-4 w-4" />
                              정답
                            </>
                          ) : (
                            '정답으로'
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`explanation-${question.id}`}>해설</Label>
                    <Textarea
                      id={`explanation-${question.id}`}
                      value={question.explanation || ''}
                      onChange={(e) => handleQuestionChange(question.id, 'explanation', e.target.value)}
                      placeholder="문제 해설을 입력하세요"
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`difficulty-${question.id}`}>난이도</Label>
                    <Select
                      value={question.difficulty}
                      onValueChange={(value) => handleQuestionChange(question.id, 'difficulty', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="난이도 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">쉬움</SelectItem>
                        <SelectItem value="medium">보통</SelectItem>
                        <SelectItem value="hard">어려움</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>문제 이미지</Label>
                    <div className="border-2 border-dashed rounded-md p-4 text-center">
                      {question.imageUrl ? (
                        <div className="space-y-2">
                          <img
                            src={question.imageUrl}
                            alt="문제 이미지"
                            className="max-h-[200px] mx-auto"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuestionChange(question.id, 'imageUrl', null)}
                          >
                            이미지 제거
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <ImagePlus className="mx-auto h-12 w-12 text-gray-300" />
                          <p className="mt-2 text-sm text-gray-500">
                            이미지 파일을 드래그하거나 클릭하여 업로드하세요
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleImageUpload(question.id, e.target.files[0]);
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 