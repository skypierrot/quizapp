'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, X, AlertCircle } from 'lucide-react';

// 결과 데이터 타입 (API 응답과 일치해야 함)
interface IExamResultDetails {
  id: string;
  status: 'in_progress' | 'completed' | 'aborted';
  score: number | null;
  totalQuestions: number;
  correctAnswers: number | null;
  startedAt: string; // ISO string format
  completedAt: string | null; // ISO string format
  timeTakenSeconds: number | null;
  answers: { questionId: string; selectedOptionIndex: number | null; isCorrect: boolean }[] | null;
  exam: {
    id: string;
    title: string;
    year: number;
    session: number;
    subject?: string;
  } | null;
  // TODO: 필요한 경우 사용자 정보, 문제 상세 정보 추가
}

export default function TestResultPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const resultId = params.resultId as string;

  const [resultDetails, setResultDetails] = useState<IExamResultDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResultDetails = async () => {
      if (!resultId) return;
      setIsLoading(true);
      try {
        const response = await fetch(`/api/test/results/${resultId}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch result details (status: ${response.status})`);
        }
        const data: IExamResultDetails = await response.json();
        setResultDetails(data);
      } catch (error: any) {
        console.error("Error fetching result details:", error);
        toast({ title: "결과 로딩 실패", description: error.message || "결과 정보를 불러오는 중 오류가 발생했습니다.", variant: "destructive" });
        // 오류 시 다른 페이지로 이동하거나 오류 메시지 표시
        // router.push('/'); 
      } finally {
        setIsLoading(false);
      }
    };
    fetchResultDetails();
  }, [resultId, toast, router]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin" /></div>;
  }

  if (!resultDetails) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">결과 정보를 불러올 수 없습니다.</h2>
        <p className="text-muted-foreground mb-4">오류가 발생했거나 유효하지 않은 결과입니다.</p>
        <Button onClick={() => router.push('/')}>홈으로 돌아가기</Button>
      </div>
    );
  }

  // 시간 포맷팅 함수
  const formatDateTime = (isoString: string | null) => {
    if (!isoString) return '-';
    try {
      return new Date(isoString).toLocaleString('ko-KR');
    } catch { return '-'; }
  };
  
  const formatDuration = (seconds: number | null) => {
    if (seconds === null || seconds < 0) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}분 ${secs}초`;
  };

  const score = resultDetails.score ?? 0;
  const correctCount = resultDetails.correctAnswers ?? 0;
  const wrongCount = resultDetails.totalQuestions - correctCount;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>시험 결과: {resultDetails.exam?.title || '시험 정보 없음'}</CardTitle>
          <CardDescription>응시일시: {formatDateTime(resultDetails.startedAt)}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 border rounded-lg text-center">
            <p className="text-sm text-muted-foreground">총점</p>
            <p className="text-2xl font-bold">{score}점</p>
          </div>
          <div className="p-4 border rounded-lg text-center">
            <p className="text-sm text-muted-foreground">정답</p>
            <p className="text-2xl font-bold text-green-600">{correctCount}개</p>
          </div>
          <div className="p-4 border rounded-lg text-center">
            <p className="text-sm text-muted-foreground">오답</p>
            <p className="text-2xl font-bold text-red-600">{wrongCount}개</p>
          </div>
          <div className="p-4 border rounded-lg text-center">
            <p className="text-sm text-muted-foreground">소요 시간</p>
            <p className="text-2xl font-bold">{formatDuration(resultDetails.timeTakenSeconds)}</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          {/* TODO: 오답 노트 기능 구현 후 링크 추가 */} 
          {/* <Button variant="outline">오답 노트 보기</Button> */} 
          <Button onClick={() => router.push('/')}>홈으로</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>상세 결과</CardTitle>
          <CardDescription>각 문항별 채점 결과입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">문제 번호</TableHead>
                <TableHead>선택 답안</TableHead>
                <TableHead className="text-center">정답 여부</TableHead>
                {/* TODO: 문제 내용 또는 해설 보기 링크 추가 */} 
                <TableHead className="text-right">액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resultDetails.answers?.map((answer, index) => (
                <TableRow key={answer.questionId}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{answer.selectedOptionIndex !== null ? `${answer.selectedOptionIndex + 1}번` : '미선택'}</TableCell>
                  <TableCell className="text-center">
                    {answer.isCorrect ? (
                      <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-200">
                        <Check className="mr-1 h-4 w-4" /> 정답
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <X className="mr-1 h-4 w-4" /> 오답
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {/* TODO: 문제 상세 보기 또는 해설 페이지 링크 */} 
                    <Link href={`/questions/${answer.questionId}`} passHref>
                      <Button variant="link" size="sm">문제 보기</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {!resultDetails.answers || resultDetails.answers.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      결과 상세 정보가 없습니다.
                    </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 