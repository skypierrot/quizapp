"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { IExamResult, IQuestion, IAnswerDetail } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { AlertCircle, CheckCircle, XCircle, ArrowLeft, Save, LogIn, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CommonImage } from '@/components/common/CommonImage';
import { getImageUrl } from '@/utils/image';
import { useImageZoom } from '@/hooks/useImageZoom';
import { ImageZoomModal } from '@/components/common/ImageZoomModal';
import { formatTime, formatKoreanDateTime } from '@/utils/time';
import { signIn, useSession } from 'next-auth/react';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

// 임시 결과 및 질문 저장을 위한 타입
interface TempResultStorage {
  result: IExamResult & { isTemporary: boolean };
  questions: IQuestion[];
}

export default function TempResultPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const imageZoom = useImageZoom();
  const { toast } = useToast();
  
  const [examResult, setExamResult] = useState<IExamResult | null>(null);
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savePromptVisible, setSavePromptVisible] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const tempResultId = params?.tempResultId as string || '';
  const shouldSave = searchParams?.get('save') === 'true';
  const isAuthenticated = status === 'authenticated' && session?.user?.id;
  
  // 세션 스토리지에서 임시 결과 불러오기
  useEffect(() => {
    if (typeof window === 'undefined') return; // SSR 시 실행 방지
    
    try {
      setLoading(true);
      setError(null);
      
      const storedData = sessionStorage.getItem(`exam_result_${tempResultId}`);
      
      if (!storedData) {
        setError('임시 결과를 찾을 수 없습니다. 세션이 만료되었거나 잘못된 접근입니다.');
        setLoading(false);
        return;
      }
      
      const parsedData: TempResultStorage = JSON.parse(storedData);
      
      if (!parsedData || !parsedData.result) {
        setError('결과 데이터가 손상되었습니다.');
        setLoading(false);
        return;
      }
      
      setExamResult(parsedData.result);
      setQuestions(parsedData.questions || []);
    } catch (err: any) {
      console.error('임시 결과 로드 오류:', err);
      setError(err.message || '임시 결과를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [tempResultId]);

  // 로그인 상태와 save 파라미터가 있을 때 결과를 API에 저장
  useEffect(() => {
    // 로딩 중이거나, 결과가 없거나, 이미 저장 중이면 실행하지 않음
    if (loading || !examResult || isSaving) return;
    
    // 로그인 상태이고 save=true 파라미터가 있을 때 결과 저장
    if (isAuthenticated && shouldSave) {
      saveResultToPermanent();
    }
  }, [loading, examResult, isAuthenticated, shouldSave, isSaving]);

  // 임시 결과를 영구 저장하는 함수
  const saveResultToPermanent = async () => {
    if (!examResult || !session?.user?.id) return;
    
    try {
      setIsSaving(true);
      
      // 임시 결과에서 userId 업데이트
      const permanentResultData = {
        ...examResult,
        userId: session.user.id,
        isTemporary: false
      };
      
      // API 호출하여 영구 저장
      const response = await fetch('/api/exam-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(permanentResultData),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '결과 저장에 실패했습니다.' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const savedResult = await response.json();
      
      if (savedResult && savedResult.id) {
        // 세션 스토리지에서 임시 결과 삭제
        sessionStorage.removeItem(`exam_result_${tempResultId}`);
        
        // 토스트 메시지로 성공 알림
        toast({
          title: "결과 저장 성공",
          description: "시험 결과가 성공적으로 저장되었습니다."
        });
        
        // 영구 저장된 결과 페이지로 이동
        setTimeout(() => {
          router.push(`/results/${savedResult.id}`);
        }, 500);
      } else {
        throw new Error("결과 ID를 받지 못해 결과 페이지로 이동할 수 없습니다.");
      }
    } catch (error: any) {
      console.error("결과 저장 오류:", error);
      
      // 토스트 메시지로 에러 알림
      toast({
        title: "결과 저장 실패",
        description: error.message || "결과를 저장하는 중 오류가 발생했습니다."
      });
      
      // URL에서 save 파라미터 제거하여 무한 시도 방지
      router.replace(`/results/temp/${tempResultId}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 로그인 및 결과 저장 처리
  const handleSaveResult = () => {
    if (isAuthenticated) {
      // 이미 로그인된 상태면 바로 저장 진행
      toast({
        title: "저장 중",
        description: "시험 결과를 저장하고 있습니다. 잠시만 기다려주세요."
      });
      saveResultToPermanent();
    } else {
      // 로그인 페이지로 이동하면서 현재 URL을 콜백으로 전달
      toast({
        title: "로그인 필요",
        description: "결과를 저장하려면 로그인이 필요합니다. 로그인 페이지로 이동합니다."
      });
      const callbackUrl = `/results/temp/${tempResultId}?save=true`;
      signIn(undefined, { callbackUrl });
    }
  };

  if (loading) {
    return <div className="container mx-auto py-8 text-center">결과를 불러오는 중...</div>;
  }

  if (isSaving) {
    return <div className="container mx-auto py-8 text-center">결과를 저장하는 중...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 text-center text-red-500">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
        <h2 className="mt-4 text-xl font-semibold">오류 발생</h2>
        <p className="mt-2 text-sm text-gray-600">{error}</p>
        <Button variant="outline" className="mt-6" onClick={() => router.push('/exams')}>
          목록으로 돌아가기
        </Button>
      </div>
    );
  }

  if (!examResult) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p>시험 결과를 찾을 수 없습니다.</p>
        <Button variant="outline" className="mt-6" onClick={() => router.push('/exams')}>
          목록으로 돌아가기
        </Button>
      </div>
    );
  }

  const questionsMap = new Map(questions.map(q => [q.id, q]));

  return (
    <div className="w-full md:w-4/5 mx-auto my-6 md:my-10 px-4 md:px-0">
      {/* 로그인 안내 메시지 */}
      {savePromptVisible && (
        <Card className="mb-6 border-yellow-300 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start gap-4">
              <div className="bg-yellow-100 p-2 rounded-full">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">임시 결과 - 저장되지 않음</h3>
                <p className="text-sm text-gray-600 mb-4">
                  현재 결과는 임시로 저장되어 있으며, 브라우저 세션이 종료되면 사라집니다.
                  결과를 영구적으로 저장하려면 로그인이 필요합니다.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    variant="default" 
                    className="bg-yellow-600 hover:bg-yellow-700 w-full sm:w-auto"
                    onClick={handleSaveResult}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        저장 중...
                      </>
                    ) : (
                      <>
                        <LogIn className="mr-2 h-4 w-4" />
                        로그인하고 결과 저장하기
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSavePromptVisible(false)}
                    className="w-full sm:w-auto"
                    disabled={isSaving}
                  >
                    나중에 하기
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 시험명 및 응시일 */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold flex flex-wrap items-center gap-2 md:gap-3">
          {examResult.examName}
          <span className="text-sm md:text-base font-normal text-gray-400 inline-block">(
          {examResult.examDate
            ? examResult.examDate
            : examResult.examYear
            ? examResult.examYear
            : new Date(examResult.createdAt).toISOString().slice(0, 10)
          }
          )</span>
        </h1>
        <div className="text-gray-500 text-xs md:text-sm mt-1">
          응시일: {formatKoreanDateTime(examResult.createdAt)}
        </div>
      </div>

      {/* 시험 결과 요약 */}
      <div className="bg-white rounded-xl shadow p-4 md:p-8 mb-6 md:mb-8">
        <div className="text-base md:text-lg font-bold mb-4 md:mb-6">시험 결과 요약</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 text-center gap-4">
          <div className="p-2">
            <div className="text-gray-500 mb-1">점수</div>
            <div className="text-2xl md:text-3xl font-extrabold">{examResult.score}점</div>
          </div>
          <div className="p-2">
            <div className="text-gray-500 mb-1">정답률</div>
            <div className="text-xl md:text-2xl font-bold">
              {examResult.correctCount} / {examResult.totalQuestions}
              <span className="text-sm md:text-base font-normal ml-1">
                ({examResult.totalQuestions > 0 ? Math.round((examResult.correctCount / examResult.totalQuestions) * 100) : 0}%)
              </span>
            </div>
          </div>
          <div className="p-2">
            <div className="text-gray-500 mb-1">소요 시간</div>
            <div className="text-xl md:text-2xl font-bold">
              {String(Math.floor(examResult.elapsedTime / 60)).padStart(2, '0')}:
              {String(examResult.elapsedTime % 60).padStart(2, '0')}
            </div>
          </div>
        </div>
      </div>

      {/* 과목별 성적 */}
      {examResult.subjectStats && Object.keys(examResult.subjectStats).length > 0 && (
        <div className="bg-white rounded-xl shadow p-4 md:p-8 mb-6 md:mb-8 overflow-x-auto">
          <div className="text-base md:text-lg font-bold mb-2 md:mb-4">과목별 성적</div>
          <table className="w-full table-auto text-center">
            <thead>
              <tr className="text-gray-500 border-b">
                <th className="py-2">과목명</th>
                <th className="py-2">정답수</th>
                <th className="py-2">점수</th>
                <th className="py-2">과락여부</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(examResult.subjectStats).map(([subject, stats]) => {
                const subjectScore = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                const isFail = subjectScore < 60;
                return (
                  <tr key={subject} className="border-b">
                    <td className="py-2 px-1 md:px-2">{subject}</td>
                    <td className="py-2 px-1 md:px-2">{stats.correct} / {stats.total}</td>
                    <td className="py-2 px-1 md:px-2">
                      <span className={`font-bold ${isFail ? 'text-red-600' : 'text-blue-600'}`}>{subjectScore}점</span>
                      <span className="text-xs text-gray-400 ml-1">({stats.correct}/{stats.total})</span>
                    </td>
                    <td className="py-2 px-1 md:px-2">
                      {isFail ? (
                        <span className="bg-red-100 text-red-600 rounded px-2 py-0.5 text-xs font-bold">과락</span>
                      ) : (
                        <span className="bg-green-100 text-green-600 rounded px-2 py-0.5 text-xs font-bold">통과</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="text-xs text-gray-400 mt-2 text-right">
            ※ 과목별 과락 기준: 해당 과목 문제의 60% 미만 정답 시 과락
          </div>
        </div>
      )}

      {/* 경고/안내 메시지 */}
      {(examResult.score < 60 || Object.values(examResult.subjectStats || {}).some(stats => (stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0) < 60)) && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-4 mt-4 md:mt-6 text-center font-semibold mb-6 md:mb-10">
          총점 미달 및 일부 과목 과락으로 최종 과락 처리되었습니다.
        </div>
      )}

      <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">문제별 상세 결과</h2>
      <div className="space-y-5 md:space-y-6">
        {examResult.answers?.map((answerDetail, index) => {
          const question = questionsMap.get(answerDetail.questionId);

          if (!question) {
            return (
              <Card key={`missing-${index}-${answerDetail.questionId}`} className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive">문제 정보 누락</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    ID '{answerDetail.questionId}'에 해당하는 문제 정보를 불러올 수 없습니다.
                  </p>
                </CardContent>
              </Card>
            );
          }

          const userAnswerIndex = answerDetail.selectedOptionIndex;
          const correctAnswerIndex = question.answer;
          const isCorrect = answerDetail.isCorrect;

          return (
            <Card key={question.id} className={cn(
              isCorrect ? "border-green-200" : "border-red-200",
              "text-left !block"
            )}>
              <div className="p-4 pb-1 text-left !block">
                <div className="text-left !block">
                  <div className="inline-block text-lg font-bold mr-2">문제 {index + 1}</div>
                  {isCorrect ? (
                    <span className="inline-flex items-center text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      <CheckCircle className="mr-1 h-4 w-4" /> 정답
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-sm font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full">
                      <XCircle className="mr-1 h-4 w-4" /> 오답
                    </span>
                  )}
                </div>
              </div>
              <CardContent>
                <Label className="font-semibold whitespace-pre-wrap">{question.content}</Label>
                
                {question.images && question.images.length > 0 && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {question.images.map((img: { url: string; hash: string }, idx: number) => (
                      <CommonImage 
                        key={img.hash || idx}
                        src={getImageUrl(img.url)} 
                        alt={`문제 이미지 ${idx + 1}`}
                        onClick={() => imageZoom.showZoom(getImageUrl(img.url))}
                        containerClassName="rounded border cursor-pointer hover:opacity-80 w-full h-auto object-contain max-h-60"
                      />
                    ))}
                  </div>
                )}

                {/* 선택지 표시 */}
                <div className="mt-4 space-y-3">
                  {question.options.map((option, optionIndex) => (
                    <div
                      key={optionIndex}
                      className={cn(
                        "p-2 md:p-3 border rounded-md",
                        optionIndex === correctAnswerIndex
                          ? "bg-green-50 border-green-300"
                          : optionIndex === userAnswerIndex && !isCorrect
                          ? "bg-red-50 border-red-300"
                          : "bg-gray-50"
                      )}
                    >
                      <div className="flex items-start">
                        <div className="font-medium mr-2 md:mr-3">{optionIndex + 1}.</div>
                        <div className="flex-1">
                          <div className="whitespace-pre-wrap text-sm md:text-base">{option.text}</div>
                          {option.images && option.images.length > 0 && (
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
                              {option.images.map((img, imgIdx) => (
                                <CommonImage
                                  key={img.hash || imgIdx}
                                  src={getImageUrl(img.url)}
                                  alt={`선택지 ${optionIndex + 1} 이미지 ${imgIdx + 1}`}
                                  onClick={() => imageZoom.showZoom(getImageUrl(img.url))}
                                  containerClassName="rounded border cursor-pointer hover:opacity-80 w-full h-auto object-contain max-h-40"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        {optionIndex === correctAnswerIndex && (
                          <div className="ml-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                        )}
                        {optionIndex === userAnswerIndex && !isCorrect && (
                          <div className="ml-2">
                            <XCircle className="h-5 w-5 text-red-600" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 md:mt-10 flex flex-col sm:flex-row justify-center gap-3 md:gap-4 pb-6">
        <Button onClick={() => router.back()} variant="outline" className="w-full sm:w-auto" disabled={isSaving}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          이전으로
        </Button>
        {savePromptVisible ? (
          <Button
            onClick={handleSaveResult}
            className="bg-yellow-600 hover:bg-yellow-700 w-full sm:w-auto"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                로그인하고 결과 저장하기
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={() => setSavePromptVisible(true)}
            className="w-full sm:w-auto"
            disabled={isSaving}
          >
            <Save className="mr-2 h-4 w-4" />
            결과 저장하기
          </Button>
        )}
      </div>
      
      <ImageZoomModal 
        imageUrl={imageZoom.zoomedImage}
        onClose={imageZoom.closeZoom} 
      />
    </div>
  );
} 