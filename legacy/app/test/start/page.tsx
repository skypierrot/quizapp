'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// TODO: 실제 시험 목록을 가져오는 API 호출 필요
// 예시 데이터 구조
interface IExamOption {
  id: string; // 실제로는 exams 테이블의 id (uuid)
  title: string; // 예: "2023년 정보처리기사 필기"
  year: number;
  session: number;
  subject?: string;
}

export default function StartTestPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [availableExams, setAvailableExams] = useState<IExamOption[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [isLoadingExams, setIsLoadingExams] = useState(true);
  const [isStartingSession, setIsStartingSession] = useState(false);

  // TODO: 실제 API 엔드포인트 구현 후 교체
  useEffect(() => {
    // 예시: 시험 목록 데이터 로딩
    const fetchExams = async () => {
      setIsLoadingExams(true);
      try {
        // const response = await fetch('/api/exams'); // 실제 시험 목록 API
        // if (!response.ok) throw new Error('Failed to fetch exams');
        // const data = await response.json();
        // setAvailableExams(data);

        // 임시 데이터 사용
        await new Promise(resolve => setTimeout(resolve, 1000)); // 로딩 시뮬레이션
        setAvailableExams([
          { id: 'exam-uuid-1', title: '2024년 제1회 정보처리기사 필기', year: 2024, session: 1, subject: '정보처리기사' },
          { id: 'exam-uuid-2', title: '2023년 제3회 정보처리기사 필기', year: 2023, session: 3, subject: '정보처리기사' },
        ]);
      } catch (error) {
        console.error("Error fetching exams:", error);
        toast({ title: "시험 목록 로딩 실패", description: "시험 목록을 불러오는 중 오류가 발생했습니다.", variant: "destructive" });
      } finally {
        setIsLoadingExams(false);
      }
    };
    fetchExams();
  }, [toast]);

  const handleStartSession = async () => {
    if (!selectedExamId) {
      toast({ title: "시험 선택 필요", description: "시작할 시험을 선택해주세요.", variant: "warning" });
      return;
    }

    setIsStartingSession(true);
    try {
      const selectedExam = availableExams.find(exam => exam.id === selectedExamId);
      if (!selectedExam) {
        throw new Error('Selected exam not found');
      }

      const response = await fetch('/api/test/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          examInstanceInfo: { // API 요구사항에 맞춰 전송
            examId: selectedExam.id,
            year: selectedExam.year,
            session: selectedExam.session,
            subject: selectedExam.subject,
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // 에러 응답 파싱 시도
        throw new Error(errorData.error || `Failed to start session (status: ${response.status})`);
      }

      const { sessionId } = await response.json();

      toast({ title: "시험 세션 시작", description: "시험 페이지로 이동합니다." });
      router.push(`/test/session/${sessionId}`);

    } catch (error: any) {
      console.error("Error starting session:", error);
      toast({ title: "세션 시작 오류", description: error.message || "시험 세션을 시작하는 중 오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setIsStartingSession(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>모의고사 시작</CardTitle>
          <CardDescription>응시할 시험을 선택하고 시작 버튼을 누르세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="exam-select">시험 선택</Label>
            {isLoadingExams ? (
              <div className="flex items-center justify-center h-10">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <Select 
                onValueChange={setSelectedExamId} 
                value={selectedExamId || undefined}
                disabled={isStartingSession}
              >
                <SelectTrigger id="exam-select">
                  <SelectValue placeholder="시험을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {availableExams.map((exam) => (
                    <SelectItem key={exam.id} value={exam.id}>
                      {exam.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={handleStartSession} 
            disabled={!selectedExamId || isStartingSession || isLoadingExams}
          >
            {isStartingSession ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 시작 중...</>
            ) : (
              '시험 시작'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 