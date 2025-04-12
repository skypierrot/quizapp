"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { parseQuestionsImproved } from "@/utils/questionParser";
import { IQuestion } from "@/types";

interface PasteInputProps {
  onParsed: (questions: IQuestion[], errors: string[]) => void;
}

export function PasteInput({ onParsed }: PasteInputProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleParse = () => {
    if (!text.trim()) {
      setError("입력된 텍스트가 없습니다.");
      return;
    }

    try {
      // 개선된 문제 분석 로직 사용
      const { questions, errors } = parseQuestionsImproved(text);
      
      if (questions.length === 0) {
        setError("문제를 분석할 수 없습니다. 올바른 형식인지 확인해주세요.");
        return;
      }
      
      onParsed(questions, errors);
      setError(null);
      setText("");
    } catch (err) {
      console.error("문제 분석 중 오류 발생:", err);
      setError("문제 분석 중 오류가 발생했습니다. 입력 형식을 확인해주세요.");
    }
  };

  return (
    <div className="space-y-4">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="여기에 문제와 선택지를 붙여넣기 하세요. 예시:&#10;1. 다음 중 올바른 것은?&#10;① 선택지 1&#10;② 선택지 2&#10;③ 선택지 3&#10;④ 선택지 4&#10;&#10;2. 두 번째 문제&#10;① 선택지 A&#10;② 선택지 B&#10;..."
        className="min-h-[300px] font-mono"
      />
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>오류</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex justify-end">
        <Button 
          onClick={handleParse}
          disabled={!text.trim()}
        >
          문제 분석하기
        </Button>
      </div>
    </div>
  );
} 