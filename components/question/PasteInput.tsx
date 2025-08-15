'use client';

import React, { useState } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Loader2 } from 'lucide-react';
import { IQuestion } from '@/types';

interface PasteInputProps {
  onParsed: (questions: IQuestion[], errors: string[]) => void;
}

export function PasteInput({ onParsed }: PasteInputProps) {
  const [text, setText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [parseErrors, setParseErrors] = useState<string[]>([]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (parseErrors.length > 0) {
      setParseErrors([]);
    }
  };

  const parseQuestions = async () => {
    if (!text.trim()) {
      setParseErrors(['붙여넣을 텍스트를 입력해주세요.']);
      return;
    }

    setIsProcessing(true);
    setParseErrors([]);

    try {
      // 실제 구현에서는 API 호출을 통해 서버에서 파싱할 수 있습니다.
      // const response = await fetch('/api/questions/parse', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ text }),
      // });
      
      // if (!response.ok) {
      //   throw new Error('문제 분석 중 오류가 발생했습니다.');
      // }
      
      // const result = await response.json();
      
      // 로컬 파싱 구현 (임시)
      await new Promise(resolve => setTimeout(resolve, 1000)); // 처리 시간 시뮬레이션
      
      const parsedQuestions: IQuestion[] = [];
      const errors: string[] = [];
      
      // 간단한 파싱 로직 (실제 애플리케이션에서는 더 강력한 로직이 필요합니다)
      const questionBlocks = text.split(/\d+\./).filter(block => block.trim());
      
      if (questionBlocks.length === 0) {
        errors.push('유효한 문제 형식을 찾을 수 없습니다. 문제는 "1."과 같은 번호로 시작해야 합니다.');
      }
      
      questionBlocks.forEach((block, index) => {
        try {
          const lines = block.trim().split('\n');
          const questionText = lines[0]?.trim() || '';
          
          if (!questionText) {
            errors.push(`문제 ${index + 1}: 문제 내용이 비어있습니다.`);
            return;
          }
          
          // 선택지 파싱
          const choices: string[] = [];
          const choiceLines = lines.filter(line => /^[①②③④⑤]/.test(line));
          
          choiceLines.forEach(line => {
            const match = line.match(/^[①②③④⑤]\s*(.+)/);
            if (match && match[1]) {
              choices.push(match[1].trim());
            }
          });
          
          // 정답 파싱 (여기서는 단순화: 첫 번째 선택지를 정답으로 가정)
          const correctAnswer = 1;
          
          if (choices.length < 4) {
            errors.push(`문제 ${index + 1}: 선택지가 4개 미만입니다.`);
          }
          
          parsedQuestions.push({
            id: `temp-${Date.now()}-${index}`,
            content: questionText,
            options: choices.map((choice, choiceIndex) => ({
              number: choiceIndex + 1,
              text: choice,
              images: []
            })),
            answer: correctAnswer - 1, // 0-based index로 변환
            explanation: '',
            images: [],
            explanationImages: [],
            tags: [],
          });
        } catch (err) {
          errors.push(`문제 ${index + 1}: 파싱 중 오류가 발생했습니다.`);
        }
      });
      
      onParsed(parsedQuestions, errors);
    } catch (err: any) {
      setParseErrors([err.message || '문제 분석 중 오류가 발생했습니다.']);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <Textarea
          placeholder="문제 텍스트를 이곳에 붙여넣으세요..."
          className="min-h-[300px] font-mono text-sm"
          value={text}
          onChange={handleTextChange}
          disabled={isProcessing}
        />
        
        {parseErrors.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-red-700">분석 중 오류가 발생했습니다:</p>
                <ul className="list-disc list-inside mt-1 text-sm text-red-600">
                  {parseErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-4 flex justify-end">
          <Button 
            onClick={parseQuestions} 
            disabled={isProcessing || !text.trim()}
          >
            {isProcessing && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            문제 분석하기
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 