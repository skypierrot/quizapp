"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { IExamResult } from '@/db/schema/examResults'; // Import the result type
import Breadcrumb from '@/components/common/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

// Helper function to format time (can be moved to utils)
const formatTime = (totalSeconds: number | null | undefined): string => {
    if (totalSeconds === null || totalSeconds === undefined) return '-';
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export default function ResultPage() {
    const params = useParams();
    const router = useRouter();
    const resultId = params.resultId as string;

    const [resultData, setResultData] = useState<IExamResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!resultId || isNaN(parseInt(resultId, 10))) {
            setError('유효하지 않은 결과 ID입니다.');
            setLoading(false);
            return;
        }

        const fetchResultData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/exam-results/${resultId}`);
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
                    if (response.status === 404) {
                        throw new Error('시험 결과를 찾을 수 없습니다.');
                    } else if (response.status === 403) {
                         throw new Error('결과를 볼 권한이 없습니다.');
                    } else {
                         throw new Error(errorData.message || `결과 조회 중 오류 발생 (${response.status})`);
                    }
                }
                const data: IExamResult = await response.json();
                setResultData(data);
            } catch (err) {
                console.error("Failed to fetch exam result:", err);
                setError(err instanceof Error ? err.message : '결과를 불러오는 중 오류가 발생했습니다.');
                setResultData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchResultData();
    }, [resultId]);

    // Breadcrumb items
    const breadcrumbItems = [
        { label: '홈', href: '/' },
        { label: '시험 결과', href: '#', isCurrent: true }, // Simple breadcrumb for now
        ...(resultData ? [{ label: `결과 #${resultData.id}`, href: '', isCurrent: true }] : [])
    ];

    if (loading) {
        return <div className="container mx-auto py-8 text-center">결과를 불러오는 중...</div>;
    }

    if (error) {
        return <div className="container mx-auto py-8 text-center text-red-500">오류: {error}</div>;
    }

    if (!resultData) {
        return <div className="container mx-auto py-8 text-center">결과 데이터가 없습니다.</div>;
    }

    // Calculate incorrect questions (basic list for now)
    const incorrectAnswers = resultData.answers.filter(ans => !ans.isCorrect);

    return (
        <div className="container mx-auto py-8 px-4">
            <Breadcrumb items={breadcrumbItems} />
            <Card className="mt-6 max-w-3xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-2xl md:text-3xl text-center">
                        {resultData.examName} {resultData.examYear}년 {resultData.examSession}차 결과
                    </CardTitle>
                    <CardDescription className="text-center">
                        시험 응시 결과를 확인하세요.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Score Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500 mb-1">점수</p>
                            <p className="text-3xl font-bold text-blue-600">{resultData.score}<span className="text-lg">점</span></p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500 mb-1">정답</p>
                            <p className="text-3xl font-bold">{resultData.correctCount} / {resultData.totalQuestions}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg col-span-2 md:col-span-1">
                            <p className="text-sm text-gray-500 mb-1">소요 시간</p>
                            <p className="text-3xl font-bold">{formatTime(resultData.elapsedTime)}</p>
                            {resultData.limitTime && <p className="text-xs text-gray-400">(제한 시간: {formatTime(resultData.limitTime)})</p>}
                        </div>
                    </div>

                    {/* Incorrect Questions Summary */}
                    {incorrectAnswers.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-3 border-b pb-2">틀린 문제 ({incorrectAnswers.length}개)</h3>
                            <div className="space-y-2 max-h-60 overflow-y-auto p-1">
                                {incorrectAnswers.map((ans, index) => (
                                    // TODO: Fetch question content based on ans.questionId for better display
                                    // TODO: Link to the specific question or study page section
                                    <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-md text-sm">
                                        <p>문제 ID: {ans.questionId} (선택: {ans.selectedOptionIndex !== null ? ans.selectedOptionIndex + 1 : '미선택'})</p>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">* 상세 내용은 추후 오답노트 기능에서 제공됩니다.</p>
                        </div>
                    )}
                     {incorrectAnswers.length === 0 && (
                         <div className="text-center py-4 border rounded-md bg-green-50 border-green-200">
                             <p className="font-semibold text-green-700">🎉 모든 문제를 맞혔습니다! 🎉</p>
                         </div>
                     )}

                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row justify-center gap-3 pt-6 border-t">
                    {/* TODO: Implement Retake Incorrect Questions */} 
                    <Button variant="destructive" disabled={incorrectAnswers.length === 0}>
                        틀린 문제만 다시 풀기
                    </Button>
                    {/* TODO: Implement Retake Exam */} 
                    <Button variant="outline">
                        전체 다시 풀기
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/learn/exams">
                            다른 문제 풀어보기
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
} 