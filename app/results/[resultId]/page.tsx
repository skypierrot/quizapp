"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { IExamResult, IQuestion, IAnswerDetail } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CommonImage } from '@/components/common/CommonImage';
import { getImageUrl } from '@/utils/image';
import { useImageZoom } from '@/hooks/useImageZoom';
import { ImageZoomModal } from '@/components/common/ImageZoomModal';
import { formatTime } from '@/utils/time';
import { Label } from '@/components/ui/label';

export default function Page() {
    const params = useParams();
    const router = useRouter();
    const imageZoom = useImageZoom();

    const [examResult, setExamResult] = useState<IExamResult | null>(null);
    const [questions, setQuestions] = useState<IQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const resultId = params.resultId as string;

    useEffect(() => {
        if (!resultId) {
            setError('결과 ID가 유효하지 않습니다.');
            setLoading(false);
            return;
        }

        const fetchResultData = async () => {
            setLoading(true);
            setError(null);
            try {
                const resResult = await fetch(`/api/exam-results/${resultId}`, {
                    credentials: 'include',
                  });
                if (!resResult.ok) {
                    const errorData = await resResult.json().catch(() => ({}));
                    throw new Error(errorData.message || `시험 결과 로딩 실패 (${resResult.status})`);
                }
                const resultData: IExamResult = await resResult.json();
                setExamResult(resultData);

                const questionIds = resultData.answers?.map(a => a.questionId).filter(id => id) ?? [];
                if (questionIds.length > 0) {
                    const resQuestions = await fetch(`/api/questions?ids=${questionIds.join(',')}`, {
                        credentials: 'include',
                      });
                    if (!resQuestions.ok) {
                        const errorData = await resQuestions.json().catch(() => ({}));
                        throw new Error(errorData.message || `문제 정보 로딩 실패 (${resQuestions.status})`);
                    }
                    const questionsData = await resQuestions.json();
                    if (questionsData && Array.isArray(questionsData.questions)) {
                        setQuestions(questionsData.questions);
                    } else {
                        throw new Error('서버에서 문제 정보를 잘못된 형식으로 반환했습니다.');
                    }
                } else {
                    setQuestions([]);
                }
            } catch (err: any) {
                setError(err.message || '데이터를 불러오는 중 오류가 발생했습니다.');
            } finally {
                setLoading(false);
            }
        };
        fetchResultData();
    }, [resultId, router]);

    if (loading) {
        return <div className="container mx-auto py-8 text-center">결과를 불러오는 중...</div>;
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
        <div className="container mx-auto py-8">
            {imageZoom.zoomedImage && (
                <ImageZoomModal
                    open={!!imageZoom.zoomedImage}
                    onClose={imageZoom.closeZoom}
                    src={imageZoom.zoomedImage}
                />
            )}
            <Button variant="outline" size="sm" className="mb-4" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" /> 뒤로가기
            </Button>
            <h1 className="text-2xl font-bold mb-2">
                {examResult.examName} ({examResult.examYear}년 {examResult.examSession})
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
                응시일: {new Date(examResult.createdAt).toLocaleString()}
            </p>

            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>시험 결과 요약</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">점수</p>
                        <p className="text-3xl font-bold">{examResult.score}점</p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">정답률</p>
                        <p className="text-3xl font-bold">
                            {examResult.correctCount} / {examResult.totalQuestions}
                            <span className="text-lg ml-1">
                                ({examResult.totalQuestions > 0 ? Math.round((examResult.correctCount / examResult.totalQuestions) * 100) : 0}%)
                            </span>
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">소요 시간</p>
                        <p className="text-3xl font-bold">{formatTime(examResult.elapsedTime)}</p>
                        {examResult.limitTime && (
                            <p className="text-xs text-muted-foreground mt-1">
                                (제한 시간: {formatTime(examResult.limitTime)})
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <h2 className="text-xl font-semibold mb-4">문제별 상세 결과</h2>
            <div className="space-y-6">
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
                        <Card key={question.id} className={cn(isCorrect ? "border-green-200" : "border-red-200")}>
                            <CardHeader className="flex flex-row justify-between items-start">
                                <CardTitle>문제 {index + 1}</CardTitle>
                                {isCorrect ? (
                                    <span className="flex items-center text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                        <CheckCircle className="mr-1 h-4 w-4" /> 정답
                                    </span>
                                ) : (
                                    <span className="flex items-center text-sm font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full">
                                        <XCircle className="mr-1 h-4 w-4" /> 오답
                                    </span>
                                )}
                            </CardHeader>
                            <CardContent>
                                <div
                                    className="mb-4 prose max-w-none"
                                    dangerouslySetInnerHTML={{ __html: question.content }}
                                />
                                {question.images && question.images.length > 0 && (
                                    <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {question.images.map((image, imgIndex) => (
                                            <CommonImage
                                                key={`${question.id}-img-${imgIndex}`}
                                                src={getImageUrl(image.url)}
                                                alt={`문제 ${index + 1} 이미지 ${imgIndex + 1}`}
                                                hash={image.hash}
                                                className="rounded border cursor-pointer object-contain w-full h-auto max-h-60"
                                                width={300}
                                                height={200}
                                                onClick={() => imageZoom.showZoom(getImageUrl(image.url))}
                                            />
                                        ))}
                                    </div>
                                )}
                                
                                <div className="space-y-2 mb-4">
                                    {question.options.map((option, optIndex) => {
                                        const isUserAnswer = userAnswerIndex === optIndex;
                                        const isCorrectAnswer = correctAnswerIndex === optIndex;
                                        return (
                                            <div
                                                key={`${question.id}-opt-${optIndex}`}
                                                className={cn(
                                                    "flex flex-col space-y-2 p-3 border rounded-md",
                                                    isUserAnswer && !isCorrectAnswer && "bg-red-50 border-red-200 ring-1 ring-red-200",
                                                    isCorrectAnswer && "bg-green-50 border-green-200 ring-1 ring-green-200",
                                                    !isUserAnswer && !isCorrectAnswer && "border-gray-200"
                                                )}
                                            >
                                                <Label className="flex items-center flex-wrap cursor-default">
                                                    <span className="font-semibold mr-2">{optIndex + 1}.</span>
                                                    <span className="flex-1 mr-2">{option.text}</span>
                                                    {isUserAnswer && (
                                                        <span className={cn(
                                                            "text-xs font-medium px-1.5 py-0.5 rounded whitespace-nowrap",
                                                            isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                                        )}>
                                                            나의 답
                                                        </span>
                                                    )}
                                                    {isCorrectAnswer && !isUserAnswer && (
                                                        <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 whitespace-nowrap">
                                                            (정답)
                                                        </span>
                                                    )}
                                                </Label>
                                                {option.images && option.images.length > 0 && (
                                                    <div className="ml-6 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {option.images.map((image, imgIndex) => (
                                                            <CommonImage
                                                                key={`${question.id}-opt-${optIndex}-img-${imgIndex}`}
                                                                src={getImageUrl(image.url)}
                                                                alt={`선택지 ${optIndex + 1} 이미지 ${imgIndex + 1}`}
                                                                hash={image.hash}
                                                                className="rounded border cursor-pointer object-contain w-full h-auto max-h-40"
                                                                width={200}
                                                                height={150}
                                                                onClick={() => imageZoom.showZoom(getImageUrl(image.url))}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {userAnswerIndex === null && (
                                        <p className="text-sm text-muted-foreground mt-2">⚠️ 답변을 선택하지 않았습니다.</p>
                                    )}
                                </div>

                                {(correctAnswerIndex !== undefined || question.explanation || (question.explanationImages && question.explanationImages.length > 0)) && (
                                    <div className="mt-4 pt-4 border-t bg-gray-50 p-4 rounded-md">
                                        {correctAnswerIndex !== undefined && (
                                            <p className="text-sm font-semibold mb-2">
                                                정답: <span className="text-blue-600">{correctAnswerIndex + 1}</span>
                                            </p>
                                        )}
                                        {question.explanation && (
                                            <div className="mb-2">
                                                <p className="text-sm font-semibold mb-1">해설:</p>
                                                <div
                                                    className="prose prose-sm max-w-none text-sm"
                                                    dangerouslySetInnerHTML={{ __html: question.explanation }}
                                                />
                                            </div>
                                        )}
                                        {question.explanationImages && question.explanationImages.length > 0 && (
                                            <div className="mt-4">
                                                <p className="text-sm font-semibold mb-2">해설 이미지:</p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                                    {question.explanationImages.map((image, imgIndex) => (
                                                        <CommonImage
                                                            key={`${question.id}-exp-img-${imgIndex}`}
                                                            src={getImageUrl(image.url)}
                                                            alt={`해설 이미지 ${imgIndex + 1}`}
                                                            hash={image.hash}
                                                            className="rounded border cursor-pointer object-contain w-full h-auto max-h-60"
                                                            width={300}
                                                            height={200}
                                                            onClick={() => imageZoom.showZoom(getImageUrl(image.url))}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="mt-8 text-center">
                <Button onClick={() => router.push('/exams')}>모의고사 목록으로</Button>
            </div>
        </div>
    );
} 