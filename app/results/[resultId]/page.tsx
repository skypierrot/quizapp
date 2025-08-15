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
import { formatTime, formatKoreanDateTime } from '@/utils/time';
import { Label } from '@/components/ui/label';

export default function Page() {
const params = useParams();
const router = useRouter();
const imageZoom = useImageZoom();

const [examResult, setExamResult] = useState<IExamResult | null>(null);
const [questions, setQuestions] = useState<IQuestion[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

const resultId = params?.resultId as string || '';

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

// subjectStats가 undefined일 경우를 처리하기 위한 함수
const isAnySubjectFailed = () => {
if (!examResult.subjectStats) return false;
return Object.values(examResult.subjectStats).some(
stats => (stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0) < 60
);
};

return (
<div className="w-full md:w-11/12 lg:w-4/5 mx-auto my-4 md:my-10 px-4 md:px-0">
{/* 시험명 및 응시일 */}
<div className="mb-4 md:mb-8">
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
<div className="bg-white rounded-xl shadow p-4 md:p-8 mb-4 md:mb-8">
<div className="text-base md:text-lg font-bold mb-3 md:mb-6">시험 결과 요약</div>
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

{examResult.totalQuestions - examResult.correctCount > 0 && (
  <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between">
    <div className="text-sm text-rose-600 font-medium mb-2 sm:mb-0">
      <span className="font-bold">{examResult.totalQuestions - examResult.correctCount}개</span>의 오답이 있습니다.
    </div>
    <Button 
      variant="outline" 
      size="sm"
      className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700" 
      onClick={() => router.push(`/results/${resultId}/wrong-note`)}
    >
      오답노트로 학습하기
    </Button>
  </div>
)}
</div>

{/* 과목별 성적 */}
{examResult.subjectStats && Object.keys(examResult.subjectStats).length > 0 && (
<div className="bg-white rounded-xl shadow p-4 md:p-8 mb-4 md:mb-8 overflow-x-auto">
<div className="text-base md:text-lg font-bold mb-2 md:mb-4">과목별 성적</div>
<table className="w-full table-auto text-center text-sm">
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
{(examResult.score < 60 || isAnySubjectFailed()) && (
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
<div
className="mb-4 prose max-w-none"
dangerouslySetInnerHTML={{ __html: question.content }}
/>
{question.images && question.images.length > 0 && (
<div className="mb-6 flex flex-wrap gap-3">
{question.images.map((image, imgIndex) => (
<CommonImage
key={`${question.id}-img-${imgIndex}`}
src={getImageUrl(image.url)}
alt={`문제 ${index + 1} 이미지 ${imgIndex + 1}`}
hash={image.hash}
className="rounded border cursor-pointer object-contain min-w-[150px] min-h-[150px] max-w-[300px] max-h-[250px] w-auto h-auto"
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
정답
</span>
)}
</Label>
{option.images && option.images.length > 0 && (
<div className="ml-6 mt-2 flex flex-wrap gap-2">
{option.images.map((image, imgIndex) => (
<CommonImage
key={`${question.id}-opt-${optIndex}-img-${imgIndex}`}
src={getImageUrl(image.url)}
alt={`선택지 ${optIndex + 1} 이미지 ${imgIndex + 1}`}
hash={image.hash}
className="rounded border cursor-pointer object-contain min-w-[120px] min-h-[120px] max-w-[250px] max-h-[200px] w-auto h-auto"
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
<div className="mt-4 pt-4 border-t bg-gray-50 p-3 md:p-4 rounded-md">
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
<div className="flex flex-wrap gap-3">
{question.explanationImages.map((image, imgIndex) => (
<CommonImage
key={`${question.id}-exp-img-${imgIndex}`}
src={getImageUrl(image.url)}
alt={`해설 이미지 ${imgIndex + 1}`}
hash={image.hash}
className="rounded border cursor-pointer object-contain min-w-[150px] min-h-[150px] max-w-[300px] max-h-[250px] w-auto h-auto"
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

<div className="mt-6 md:mt-8 flex flex-col sm:flex-row justify-center gap-3 md:gap-4 pb-6">
<Button 
  onClick={() => router.push('/exams')} 
  className="w-full sm:w-auto"
>
  모의고사 목록으로
</Button>
<Button 
  variant="default" 
  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700" 
  onClick={() => router.push(`/results/${resultId}/wrong-note`)}
>
  오답노트로 가기
</Button>
</div>
</div>
);
}