'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress'; // 타이머 시각화용
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { IQuestion } from '@/types'; // 문제 타입 임포트

// 예시 문제 표시 컴포넌트 (별도 파일로 분리 가능)
function QuestionDisplay({ question, selectedValue, onValueChange }: {
  question: IQuestion;
  selectedValue: number | null;
  onValueChange: (value: string) => void;
}) {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>문제 {question.questionNumber || ''}</CardTitle> {/* questionNumber 필드가 있다고 가정 */} 
      </CardHeader>
      <CardContent>
        {/* 문제 내용 */} 
        <p className="mb-4 whitespace-pre-wrap">{question.content}</p>
        {/* TODO: 문제 이미지 표시 (question.contentImageId 사용) */} 

        {/* 선택지 */} 
        <RadioGroup value={selectedValue?.toString()} onValueChange={onValueChange}>
          {question.options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <RadioGroupItem value={index.toString()} id={`option-${question.id}-${index}`} />
              <Label htmlFor={`option-${question.id}-${index}`} className="flex-1">
                {option.text}
                {/* TODO: 선택지 이미지 표시 (option.imageId 사용) */} 
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}

export default function TestSessionPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const sessionId = params.sessionId as string;

  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [questionId: string]: number | null }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // TODO: 타이머 로직 구현
  const [timeLeft, setTimeLeft] = useState(3600); // 예: 60분
  const [timeProgress, setTimeProgress] = useState(100);

  // 문제 데이터 로딩
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!sessionId) return;
      setIsLoading(true);
      try {
        const response = await fetch(`/api/test/sessions/${sessionId}/questions`);
        if (!response.ok) {
          throw new Error(`Failed to fetch questions (status: ${response.status})`);
        }
        const data: IQuestion[] = await response.json();
        // 각 문제에 번호 부여 (옵션)
        const numberedQuestions = data.map((q, index) => ({ ...q, questionNumber: index + 1 }));
        setQuestions(numberedQuestions);
        // TODO: 시험 시간 정보 API에서 받아와서 timeLeft 설정
      } catch (error: any) {
        console.error("Error fetching questions:", error);
        toast({ title: "문제 로딩 실패", description: error.message || "문제를 불러오는 중 오류가 발생했습니다.", variant: "destructive" });
        // 오류 시 이전 페이지로 이동 또는 다른 처리
        router.back();
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, [sessionId, toast, router]);

  // 타이머 로직
  useEffect(() => {
    if (isLoading || isSubmitting || timeLeft <= 0) return; // 로딩 중, 제출 중, 시간 종료 시 타이머 중지
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        const newTime = prevTime - 1;
        // TODO: 실제 시험 총 시간 기준으로 진행률 계산
        const totalTime = 3600; // 예시 총 시간
        setTimeProgress(Math.max(0, (newTime / totalTime) * 100)); 
        if (newTime <= 0) {
          clearInterval(timer);
          toast({ title: "시간 종료", description: "답안을 자동으로 제출합니다.", variant: "warning" });
          handleSubmit(); // 시간 종료 시 자동 제출
          return 0;
        }
        return newTime;
      });
    }, 1000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isSubmitting, timeLeft]); // handleSubmit 의존성 추가 시 무한 루프 주의

  // 답안 선택 핸들러
  const handleValueChange = useCallback((value: string) => {
    const currentQuestionId = questions[currentQuestionIndex]?.id;
    if (currentQuestionId) {
      setUserAnswers(prev => ({ ...prev, [currentQuestionId]: parseInt(value, 10) }));
    }
  }, [currentQuestionIndex, questions]);

  // 이전/다음 문제 이동
  const navigateQuestion = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else if (direction === 'next' && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  // 답안 제출 핸들러
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // userAnswers 객체를 API 요구 형식으로 변환
      const formattedAnswers = Object.entries(userAnswers).map(([questionId, selectedOptionIndex]) => ({
        questionId,
        selectedOptionIndex,
      }));

      // 누락된 문제에 대한 처리 (선택 사항: null로 제출)
      questions.forEach(q => {
        if (!(q.id in userAnswers)) {
          formattedAnswers.push({ questionId: q.id, selectedOptionIndex: null });
        }
      });

      const response = await fetch(`/api/test/sessions/${sessionId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: formattedAnswers }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to submit answers (status: ${response.status})`);
      }

      const { resultId } = await response.json();
      toast({ title: "제출 완료", description: "결과 페이지로 이동합니다." });
      router.push(`/test/result/${resultId}`);

    } catch (error: any) {
      console.error("Error submitting answers:", error);
      toast({ title: "제출 오류", description: error.message || "답안 제출 중 오류가 발생했습니다.", variant: "destructive" });
      setIsSubmitting(false); // 오류 발생 시 제출 상태 해제
    } 
    // 성공 시 페이지 이동하므로 finally에서 setIsSubmitting(false) 불필요
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin" /></div>;
  }

  if (questions.length === 0) {
    return <div className="flex justify-center items-center h-screen">문제를 불러올 수 없습니다.</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const selectedValue = userAnswers[currentQuestion.id];

  // 시간 포맷팅 함수
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      {/* 상단 정보 영역 (타이머 등) */} 
      <div className="mb-4 p-4 border rounded-lg flex justify-between items-center">
        {/* TODO: 시험 제목 표시 */} 
        <span className="font-semibold">정보처리기사 필기 (임시)</span>
        <div className="text-right">
          <div className="font-mono text-lg font-semibold">{formatTime(timeLeft)}</div>
          <Progress value={timeProgress} className="w-32 h-2 mt-1" />
        </div>
      </div>

      {/* 문제 표시 영역 */} 
      <QuestionDisplay 
        question={currentQuestion}
        selectedValue={selectedValue ?? null} 
        onValueChange={handleValueChange}
      />

      {/* 하단 네비게이션 및 제출 버튼 */} 
      <CardFooter className="flex justify-between items-center mt-4">
        {/* 문제 번호 표시 */} 
        <span>{currentQuestionIndex + 1} / {questions.length}</span>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigateQuestion('prev')} 
            disabled={currentQuestionIndex === 0 || isSubmitting}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> 이전
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigateQuestion('next')} 
            disabled={currentQuestionIndex === questions.length - 1 || isSubmitting}
          >
            다음 <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 제출 중...</>
          ) : (
            <><CheckCircle className="mr-2 h-4 w-4" /> 답안 제출</>
          )}
        </Button>
      </CardFooter>
    </div>
  );
} 