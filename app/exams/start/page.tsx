'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { IQuestion, IOption, INewExamResult, IAnswerDetail } from '@/types'; // 타입 import 추가
// import { useAuth } from '@clerk/nextjs'; // Clerk useAuth 훅 주석 처리
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // CardDescription 제거
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, TimerIcon } from 'lucide-react';
import { cn } from "@/lib/utils"; // cn 유틸리티 추가
import { CommonImage } from "@/components/common/CommonImage"; // CommonImage 추가
import { getImageUrl } from "@/utils/image"; // getImageUrl 추가
import { useImageZoom } from '@/hooks/useImageZoom'; // 이미지 확대 훅 추가
import { ImageZoomModal } from '@/components/common/ImageZoomModal'; // 이미지 확대 모달 추가

// 시험 상태 타입
type ExamState = 'loading' | 'inProgress' | 'submitted' | 'error';

export default function ExamStartPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // const { userId } = useAuth(); // 주석 처리
  const userId = "temp_dev_user"; // 임시 사용자 ID 사용 (인증 구현 시 제거)

  // 시험 정보 상태
  const [examInfo, setExamInfo] = useState<{ name: string; year: string; session: string } | null>(null);
  const [questions, setQuestions] = useState<IQuestion[]>([]);

  // 시험 진행 상태
  const [examState, setExamState] = useState<ExamState>('loading');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({}); // { [questionId]: selectedOptionIndex }
  const [timeLeft, setTimeLeft] = useState<number>(3600); // 예시: 60분 (초 단위)
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null); // 시험 시작 시간 상태 추가
  const imageZoom = useImageZoom(); // 이미지 확대 훅 사용

  // 1. URL 파라미터 읽기 및 시험 정보 설정
  useEffect(() => {
    const name = searchParams.get('name');
    const year = searchParams.get('year');
    const session = searchParams.get('session');

    if (name && year && session) {
      setExamInfo({ name, year, session });
    } else {
      setError('시험 정보를 URL에서 가져올 수 없습니다.');
      setExamState('error');
      console.error('Missing exam info in URL params');
    }
  }, [searchParams]);

  // 2. 시험 정보 설정 후 문제 로딩
  useEffect(() => {
    if (!examInfo) return;

    const fetchQuestions = async () => {
      setExamState('loading');
      setError(null);
      try {
        const tagsToQuery = [
          `시험명:${examInfo.name}`,
          `년도:${examInfo.year}`,
          `회차:${examInfo.session}`
        ];
        const encodedTags = encodeURIComponent(tagsToQuery.join(','));
        const response = await fetch(`/api/questions?tags=${encodedTags}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: '문제를 불러오는 데 실패했습니다.' }));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data && Array.isArray(data.questions) && data.questions.length > 0) {
          setQuestions(data.questions);
          // TODO: 문제 수에 따른 시간 설정 로직 추가 (예: 문제당 1분)
          setTimeLeft(data.questions.length * 60);
          setStartTime(Date.now()); // 시험 시작 시간 기록
          setExamState('inProgress'); // 문제 로딩 완료 후 시험 시작
        } else {
          setQuestions([]);
          setError('해당하는 문제가 없거나 문제 형식이 올바르지 않습니다.');
          setExamState('error');
          console.warn('No questions found or invalid format');
        }
      } catch (e: any) {
        console.error('Error fetching questions:', e);
        setError(e.message || '문제를 불러오는 중 오류가 발생했습니다.');
        setExamState('error');
      } 
    };

    fetchQuestions();
  }, [examInfo]); // examInfo가 설정되면 실행

  // 3. 타이머 로직
  useEffect(() => {
    // 시험이 진행 중일 때만 타이머 작동
    if (examState !== 'inProgress') return;

    // 1초마다 timeLeft 감소
    const timerInterval = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timerInterval);
          console.log("시간 초과!");
          // TODO: 시간 초과 시 자동 제출 로직 추가
          setExamState('submitted'); // 임시로 제출 상태로 변경
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    // 컴포넌트 언마운트 또는 시험 상태 변경 시 인터벌 정리
    return () => clearInterval(timerInterval);
  }, [examState]); // examState가 변경될 때마다 실행

  // 4. 답변 선택 핸들러
  const handleAnswerSelect = (questionId: string | undefined, selectedOptionIndex: number) => {
    if (!questionId) return;
    setUserAnswers(prevAnswers => ({
      ...prevAnswers,
      [questionId]: selectedOptionIndex
    }));
    console.log(`Question ${questionId} answered: ${selectedOptionIndex + 1}`)
  };

  // 5. 문제 네비게이션 핸들러
  const handlePrevQuestion = () => {
    setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextQuestion = () => {
    setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1));
  };

  // 6. 답안 제출 핸들러
  const handleSubmitExam = useCallback(async () => { // async 추가
    console.log("시험 제출 시작");
    
    // if (!userId || !examInfo) { // userId 검사 제거 (임시 ID 사용)
    if (!examInfo) { // examInfo만 검사
      console.error("시험 정보가 없어 제출할 수 없습니다.");
      // TODO: 사용자에게 오류 알림 (Toast 등)
      return;
    }

    setExamState('submitted'); // 일단 제출 상태로 변경 (API 호출 중 상태 추가 고려)

    // 소요 시간 계산
    const elapsedTime = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
    console.log(`소요 시간: ${elapsedTime}초`);

    // 채점 로직
    let correctCount = 0;
    const answerDetails: IAnswerDetail[] = questions.map(q => {
      const userAnswerIndex = userAnswers[q.id!];
      const isCorrect = userAnswerIndex === q.answer;
      if (isCorrect) {
        correctCount++;
      }
      return {
        questionId: q.id!,
        selectedOptionIndex: userAnswerIndex ?? null,
        isCorrect: isCorrect,
      };
    });

    const totalQuestions = questions.length;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    console.log(`채점 결과: ${correctCount}/${totalQuestions} (점수: ${score})`);

    // 결과 저장 API 호출 데이터 구성
    const resultData: INewExamResult = {
      userId: userId, // 임시 ID 사용
      examName: examInfo.name,
      examYear: parseInt(examInfo.year), // year는 string이므로 number로 변환
      examSession: examInfo.session,
      answers: answerDetails,
      score: score,
      correctCount: correctCount,
      totalQuestions: totalQuestions,
      elapsedTime: elapsedTime,
      // limitTime: questions.length * 60 // 필요하다면 제한 시간도 포함
    };

    try {
      console.log("결과 저장 API 호출 데이터:", resultData);
      const response = await fetch('/api/exam-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resultData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '결과 저장에 실패했습니다.' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const savedResult = await response.json();
      console.log("결과 저장 성공:", savedResult);

      // 결과 페이지로 이동 (저장된 결과 ID 사용)
      if (savedResult && savedResult.id) {
        router.push(`/results/${savedResult.id}`);
      } else {
        console.warn("결과 ID를 받지 못했습니다. 홈으로 이동합니다.");
        router.push('/'); // fallback
      }

    } catch (error: any) {
      console.error("결과 저장 API 호출 오류:", error);
      // TODO: 사용자에게 오류 알림 (Toast 등)
      setError("시험 결과를 저장하는 중 오류가 발생했습니다: " + error.message);
      // 에러 발생 시 submitted 상태 대신 에러 상태나 다른 상태로 변경하는 것을 고려할 수 있음
      // setExamState('errorSaving'); 
    }

  }, [userId, examInfo, startTime, questions, userAnswers, router]); // 의존성 배열에 userId는 그대로 두거나 제거할 수 있음 (여기선 유지)

  // --- Placeholder UI --- 

  if (examState === 'loading') {
    return <div className="container mx-auto py-8 text-center">시험 문제를 불러오는 중...</div>;
  }

  if (examState === 'error') {
    return (
      <div className="container mx-auto py-8 text-center text-red-500">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
        <h2 className="mt-4 text-xl font-semibold">오류 발생</h2>
        <p className="mt-2 text-sm text-gray-600">{error || "알 수 없는 오류가 발생했습니다."}</p>
        <Button variant="outline" className="mt-6" onClick={() => router.push('/exams')}>
          모의고사 선택으로 돌아가기
        </Button>
      </div>
    );
  }

  if (examState === 'submitted') {
    // TODO: 시험 결과 페이지 구현 또는 결과 표시
    return <div className="container mx-auto py-8 text-center">시험이 제출되었습니다. 결과 페이지로 이동합니다...</div>;
  }

  // 현재 문제 가져오기
  const currentQuestion = questions[currentQuestionIndex];

  // --- 실제 시험 진행 UI --- 
  return (
    <div className="container mx-auto py-8">
      {/* 이미지 확대 모달 수정 */} 
      <ImageZoomModal 
        src={imageZoom.zoomedImage} // zoomedImage를 src prop으로 전달
        onClose={imageZoom.closeZoom} // closeZoom을 onClose prop으로 전달
      />

      {examInfo && (
        <h1 className="text-2xl font-bold mb-4">
          {examInfo.name} ({examInfo.year}년 {examInfo.session})
        </h1>
      )}

      {/* 상단 정보 바 */} 
      <Card className="mb-6">
        <CardContent className="pt-6 flex justify-between items-center">
          {/* 진행률 */}
          <div className="w-1/3">
            <Label className="text-sm">진행률 ({currentQuestionIndex + 1} / {questions.length})</Label>
            <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="mt-1 h-2" />
          </div>
          {/* 타이머 */}
          <div className="flex items-center font-semibold text-lg">
            <TimerIcon className="mr-2 h-5 w-5" />
            {/* TODO: 시간 포맷팅 */} 
            <span>{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
          </div>
        </CardContent>
      </Card>

      {/* 문제 표시 카드 */}
      {currentQuestion && (
        <Card key={currentQuestion.id}>
          <CardHeader>
            <CardTitle>문제 {currentQuestionIndex + 1}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* 문제 내용 */}
            <div 
              className="mb-4 prose max-w-none" 
              dangerouslySetInnerHTML={{ __html: currentQuestion.content }}
            />
            {/* 문제 이미지 표시 */} 
            {currentQuestion.images && currentQuestion.images.length > 0 && (
              <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {currentQuestion.images.map((image, imgIndex) => (
                  <CommonImage 
                    key={imgIndex}
                    src={getImageUrl(image.url)}
                    alt={`문제 ${currentQuestionIndex + 1} 이미지 ${imgIndex + 1}`}
                    hash={image.hash}
                    className="rounded border cursor-pointer object-contain w-full h-auto max-h-60"
                    width={300} // 적절한 기본 너비 설정
                    height={200} // 적절한 기본 높이 설정
                    onClick={() => imageZoom.showZoom(getImageUrl(image.url))} // showZoom 사용
                  />
                ))}
              </div>
            )}

            {/* 선택지 (RadioGroup 제거, div 클릭 방식으로 변경) */} 
            <div className="space-y-2">
              {currentQuestion.options.map((option, index) => {
                const isSelected = userAnswers[currentQuestion.id!] === index;
                return (
                  <div 
                    key={index} 
                    className={cn(
                      "flex flex-col space-y-2 p-3 border rounded-md cursor-pointer transition-colors",
                      isSelected ? "bg-green-100 border-green-300" : "hover:bg-accent"
                    )}
                    onClick={() => handleAnswerSelect(currentQuestion.id, index)} // div 클릭 시 답변 선택
                  >
                    {/* 선택지 번호 및 텍스트 */}
                    <Label className="flex-1 cursor-pointer">
                      <span className="font-semibold mr-2">{index + 1}.</span> 
                      {option.text}
                    </Label>
                    {/* 선택지 이미지 표시 */}
                    {option.images && option.images.length > 0 && (
                      <div className="ml-6 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {option.images.map((image, imgIndex) => (
                          <CommonImage 
                            key={imgIndex}
                            src={getImageUrl(image.url)}
                            alt={`선택지 ${index + 1} 이미지 ${imgIndex + 1}`}
                            hash={image.hash}
                            className="rounded border cursor-pointer object-contain w-full h-auto max-h-40"
                            width={200} // 선택지 이미지는 조금 작게
                            height={150}
                            onClick={(e) => { 
                              e.stopPropagation(); // div의 onClick 방지
                              imageZoom.showZoom(getImageUrl(image.url)); // showZoom 사용
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 네비게이션 및 제출 버튼 */}
      <div className="mt-6 flex justify-between">
        <Button 
          variant="outline" 
          onClick={handlePrevQuestion}
          disabled={currentQuestionIndex === 0}
        >
          이전 문제
        </Button>
        {currentQuestionIndex === questions.length - 1 ? (
          <Button 
            onClick={handleSubmitExam}
          >
            답안 제출
          </Button>
        ) : (
          <Button 
            onClick={handleNextQuestion}
            disabled={currentQuestionIndex === questions.length - 1}
          >
            다음 문제
          </Button>
        )}
      </div>
    </div>
  );
} 