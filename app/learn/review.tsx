"use client";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function WrongNoteReviewPage() {
  const { data, isLoading, error } = useSWR(`/api/wrong-note/review`, fetcher);

  if (isLoading) return <div>로딩 중...</div>;
  if (error) return <div>에러: {error.message}</div>;
  if (!data || !data.review || data.review.length === 0) return <div>자주 틀리는 문제가 없습니다!</div>;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-4">자주 틀리는 문제 복습</h2>
      {data.review.map((item: any, idx: number) => (
        <div key={item.questionId} className="mb-6 p-4 border rounded bg-yellow-50">
          <div className="font-bold mb-2">Q{idx+1}. {item.question}</div>
          <div className="mb-1">누적 오답 횟수: <span className="text-orange-600">{item.wrongCount}회</span></div>
          <div className="mb-1">내 최근 답: <span className="text-red-600">{item.userAnswer}</span></div>
          <div className="mb-1">정답: <span className="text-green-600">{item.correctAnswer}</span></div>
          <div className="text-gray-600">해설: {item.explanation}</div>
        </div>
      ))}
    </div>
  );
} 