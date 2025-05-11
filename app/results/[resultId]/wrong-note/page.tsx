"use client";
import useSWR from "swr";
import { useParams } from "next/navigation";
import { CommonImage } from '@/components/common/CommonImage';
import { getImageUrl } from '@/utils/image';
import { useImageZoom } from '@/hooks/useImageZoom';
import { ImageZoomModal } from '@/components/common/ImageZoomModal';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function WrongNotePage() {
  const { resultId } = useParams();
  const { data, isLoading, error } = useSWR(`/api/wrong-note/${resultId}`, fetcher);
  const imageZoom = useImageZoom();

  if (isLoading) return <div>로딩 중...</div>;
  if (error) return <div>에러: {error.message}</div>;
  if (!data || !data.wrongNote || data.wrongNote.length === 0) return <div>오답이 없습니다!</div>;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-4">오답노트</h2>
      {data.wrongNote.map((item: any, idx: number) => (
        <div key={item.questionId} className="mb-6 p-4 border rounded bg-white">
          <div className="font-bold mb-2">Q{idx+1}. <span dangerouslySetInnerHTML={{__html: item.question}} /></div>
          {item.images && item.images.length > 0 && (
            <div className="my-4 space-y-2">
              {item.images.map((img: any, i: number) => {
                const imageUrl = getImageUrl(img);
                if (!imageUrl) return null;
                return (
                  <CommonImage
                    key={`q-${item.questionId}-img-${i}`}
                    src={imageUrl}
                    alt={`문제이미지${i+1}`}
                    className="block max-w-full h-auto object-contain mx-auto border rounded"
                    containerClassName="max-w-[400px] max-h-[300px] flex items-center justify-center cursor-zoom-in"
                    maintainAspectRatio={true}
                    onClick={() => imageZoom.showZoom(imageUrl)}
                  />
                );
              })}
            </div>
          )}
          <div className="space-y-1 mb-2">
            {item.options && item.options.map((opt: any, i: number) => {
              const isUser = String(i) === String(item.userAnswer);
              const isCorrect = String(i) === String(item.correctAnswer);
              return (
                <div
                  key={i}
                  className={`flex flex-col gap-1 p-2 rounded border ${isUser ? (isCorrect ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300') : 'hover:bg-gray-50 border-gray-200'}`}
                >
                  <div className="flex items-start">
                    <span className="font-medium text-gray-700 mr-2">{i+1}.</span>
                    <span>{opt.text}</span>
                  </div>
                  {opt.images && opt.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1 pl-6">
                      {opt.images.map((img: any, j: number) => {
                        const imageUrl = getImageUrl(img);
                        if (!imageUrl) return null;
                        return (
                          <CommonImage
                            key={`opt-${i}-img-${j}`}
                            src={imageUrl}
                            alt={`선택지이미지${i+1}-${j+1}`}
                            className="block max-w-full h-auto object-contain mx-auto border rounded"
                            containerClassName="max-w-[300px] max-h-[200px] flex items-center justify-center cursor-zoom-in"
                            maintainAspectRatio={true}
                            onClick={() => imageZoom.showZoom(imageUrl)}
                          />
                        );
                      })}
                    </div>
                  )}
                  <div className="flex items-center mt-1">
                    {isUser && (
                      <span className={`ml-2 text-xs font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '정답' : '내 답'}</span>
                    )}
                    {isCorrect && !isUser && (
                      <span className="ml-2 text-xs font-bold text-blue-600">(정답)</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mb-1">누적 오답 횟수: <span className="text-orange-600">{item.wrongCount}회</span></div>
          <div className="text-gray-600 mb-2">해설: {item.explanation}</div>
          {item.explanationImages && item.explanationImages.length > 0 && (
            <div className="mt-3 space-y-2">
              {item.explanationImages.map((img: any, i: number) => {
                const imageUrl = getImageUrl(img);
                if (!imageUrl) return null;
                return (
                  <CommonImage
                    key={`exp-${item.questionId}-img-${i}`}
                    src={imageUrl}
                    alt={`해설이미지${i+1}`}
                    className="block max-w-full h-auto object-contain mx-auto border rounded"
                    containerClassName="max-w-[400px] max-h-[300px] flex items-center justify-center cursor-zoom-in"
                    maintainAspectRatio={true}
                    onClick={() => imageZoom.showZoom(imageUrl)}
                  />
                );
              })}
            </div>
          )}
        </div>
      ))}
      <ImageZoomModal src={imageZoom.zoomedImage} onClose={imageZoom.closeZoom} />
    </div>
  );
} 