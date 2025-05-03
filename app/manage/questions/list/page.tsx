"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { ImageIcon, BookOpen, User, Calendar, PlusCircle, Pencil } from "lucide-react";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import Breadcrumb from '@/components/common/Breadcrumb';
import { IQuestion } from "@/types";
import { CommonImage } from "@/components/common/CommonImage";
import { getImageUrl } from "@/utils/image";

// 문제 카드(요약/상세) 컴포넌트
function QuestionCard({
  question,
  index,
  page,
  onDetail,
  onEdit,
  onDelete,
  detailView,
  onImageZoom,
}: {
  question: IQuestion;
  index: number;
  page: number;
  onDetail: (q: IQuestion) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  detailView: boolean;
  onImageZoom: (url: string) => void;
}) {
    return (
    <Card className="h-full overflow-hidden flex flex-col">
      <CardHeader className="p-4 pb-2 space-y-2 bg-gray-50">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="font-medium">#{(page - 1) * 10 + index + 1}</span>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <User className="h-3 w-3" />
              <span>{question.userId || "익명"}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Calendar className="h-3 w-3" />
              <span>{question.createdAt ? new Date(question.createdAt).toLocaleDateString() : ''}</span>
            </div>
          </div>
        </div>
        {question.tags && question.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {question.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <div className="mb-3">
          <p className="font-medium line-clamp-3">{question.content}</p>
        </div>
        {detailView && (
          <div className="mt-4 space-y-4">
            {/* 문제 이미지 */}
            {question.images && question.images.length > 0 && (
              <div className="mt-2">
                <h4 className="text-sm font-medium mb-2">문제 이미지</h4>
                <div className="flex flex-col gap-3">
                  {question.images.map((img, idx) => (
                    <CommonImage
                      key={idx}
                      src={getImageUrl(img)}
                      alt={`문제 이미지 ${idx + 1}`}
                      className="block max-w-full h-auto object-contain mx-auto border rounded"
                      containerClassName="max-w-[400px] max-h-[300px] flex items-center justify-center cursor-zoom-in"
                      maintainAspectRatio={true}
                      onClick={() => onImageZoom(getImageUrl(img))}
                    />
                  ))}
                </div>
              </div>
            )}
            {/* 해설 이미지 */}
            {question.explanationImages && question.explanationImages.length > 0 && (
              <div className="mt-2">
                <h4 className="text-sm font-medium mb-2">해설 이미지</h4>
                <div className="flex flex-col gap-3">
                  {question.explanationImages.map((img, idx) => (
                    <CommonImage
                      key={idx}
                      src={getImageUrl(img)}
                      alt={`해설 이미지 ${idx + 1}`}
                      className="block max-w-full h-auto object-contain mx-auto border rounded"
                      containerClassName="max-w-[400px] max-h-[300px] flex items-center justify-center cursor-zoom-in"
                      maintainAspectRatio={true}
                      onClick={() => onImageZoom(getImageUrl(img))}
                    />
                  ))}
                </div>
              </div>
            )}
            {/* 선택지 */}
            {question.options && question.options.length > 0 && (
              <div className="mt-2">
                <h4 className="text-sm font-medium mb-1">선택지</h4>
                <div className="space-y-1">
                  {question.options.map((option, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-md text-base transition-all duration-150
                        ${question.answer === idx
                          ? 'border-2 bg-green-50 text-black font-extrabold shadow-lg ring-2 ring-green-300 hover:bg-green-100'
                          : 'border border-gray-200 bg-gray-100 text-gray-800 hover:bg-gray-50'}
                      `}
                    >
                      {idx + 1}. {option.text}
                      {/* 선택지 이미지 */}
                      {option.images && option.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {option.images.map((img, imgIdx) => (
                            <CommonImage
                              key={imgIdx}
                              src={getImageUrl(img)}
                              alt={`선택지${idx + 1} 이미지${imgIdx + 1}`}
                              className="block max-w-full h-auto object-contain mx-auto border rounded"
                              containerClassName="max-w-[400px] max-h-[300px] flex items-center justify-center cursor-zoom-in"
                              maintainAspectRatio={true}
                              onClick={() => onImageZoom(getImageUrl(img))}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 border-t mt-auto">
        <div className="flex gap-2 w-full">
          <Button variant="outline" size="sm" className="flex-1 w-full h-10 gap-1" onClick={() => onDetail(question)}>
            <BookOpen className="h-4 w-4" />
            해설
          </Button>
          <Link href={`/manage/questions/edit/${question.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="flex-1 w-full h-10">✏️ 수정</Button>
          </Link>
          {question.id && (
            <Button variant="outline" size="sm" className="flex-1 w-full h-10 hover:bg-gray-100 hover:text-gray-700" onClick={() => onDelete(question.id!)}>
            🗑️ 삭제
          </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

// 해설(상세) 다이얼로그
function QuestionDetailDialog({ open, question, onClose }: { open: boolean; question: IQuestion | null; onClose: () => void }) {
  if (!question) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>문제 해설</DialogTitle>
          <DialogDescription>문제에 대한 상세 정보와 해설을 확인하세요.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          {/* 태그 */}
          {question.tags && question.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {question.tags.map((tag, idx) => (
                <Badge key={idx}>{tag}</Badge>
              ))}
            </div>
          )}
          {/* 문제 내용/이미지/선택지/해설/해설이미지 */}
          <div>
            <h2 className="font-bold text-lg mb-2">문제</h2>
            <p className="whitespace-pre-wrap">{question.content}</p>
            {question.images && question.images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {question.images.map((img, idx) => (
                  <CommonImage
                    key={idx}
                    src={getImageUrl(img)}
                    alt={`문제 이미지 ${idx + 1}`}
                    className="block max-w-full h-auto object-contain mx-auto border rounded"
                    containerClassName="max-w-[400px] max-h-[300px] flex items-center justify-center cursor-zoom-in"
                    maintainAspectRatio={true}
                  />
                ))}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-semibold mb-2">선택지</h3>
            <div className="space-y-2">
              {question.options.map((opt, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-md text-base transition-all duration-150
                    ${question.answer === idx
                      ? 'border-2 bg-green-50 text-black font-extrabold shadow-lg ring-2 ring-green-300 hover:bg-green-100'
                      : 'border border-gray-200 bg-gray-100 text-gray-800 hover:bg-gray-50'}
                  `}
                >
                  {idx + 1}. {opt.text}
                  {opt.images && opt.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {opt.images.map((img, imgIdx) => (
                        <CommonImage
                          key={imgIdx}
                          src={getImageUrl(img)}
                          alt={`선택지${idx + 1} 이미지${imgIdx + 1}`}
                          className="block max-w-full h-auto object-contain mx-auto border rounded"
                          containerClassName="max-w-[400px] max-h-[300px] flex items-center justify-center cursor-zoom-in"
                          maintainAspectRatio={true}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          {question.explanation && (
            <div>
              <h3 className="font-semibold mb-2">해설</h3>
              <p className="whitespace-pre-wrap">{question.explanation}</p>
            </div>
          )}
          {question.explanationImages && question.explanationImages.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">해설 이미지</h3>
              <div className="flex flex-wrap gap-2">
                {question.explanationImages.map((img, idx) => (
                  <CommonImage
                    key={idx}
                    src={getImageUrl(img)}
                    alt={`해설 이미지 ${idx + 1}`}
                    className="block max-w-full h-auto object-contain mx-auto border rounded"
                    containerClassName="max-w-[400px] max-h-[300px] flex items-center justify-center cursor-zoom-in"
                    maintainAspectRatio={true}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function QuestionsListPage() {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedQuestion, setSelectedQuestion] = useState<IQuestion | null>(null);
  const [detailView, setDetailView] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  // 중복 문제 상태
  const [duplicateGroups, setDuplicateGroups] = useState<any[]>([]);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [dedupLoading, setDedupLoading] = useState(false);

  // 문제 목록 fetch
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/questions?page=${page}&limit=10`);
      if (!response.ok) throw new Error("문제 목록을 불러오는데 실패했습니다.");
      const data = await response.json();
      // images/explanationImages가 string[]일 수도 있으니 항상 객체 배열로 변환
      const normalizeImages = (imgs: any) =>
        Array.isArray(imgs)
          ? imgs.map((img) =>
              typeof img === "string" ? { url: img, hash: "" } : img
            )
          : [];
      setQuestions(
        data.questions.map((q: any) => ({
          ...q,
          images: normalizeImages(q.images),
          explanationImages: normalizeImages(q.explanationImages),
          options: (q.options || []).map((opt: any) => ({
            ...opt,
            images: normalizeImages(opt.images),
          })),
        }))
      );
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      toast({
        title: "문제 로딩 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // 삭제
  const handleDelete = async (questionId: string) => {
    if (!confirm("정말로 이 문제를 삭제하시겠습니까?")) return;
    try {
      const response = await fetch(`/api/questions/${questionId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("문제 삭제에 실패했습니다.");
      toast({ title: "문제 삭제 성공", description: "문제가 성공적으로 삭제되었습니다." });
      fetchQuestions();
    } catch (error) {
      toast({
        title: "문제 삭제 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "error",
      });
    }
  };

  // 중복문제 확인
  const handleCheckDuplicates = async () => {
    setDedupLoading(true);
    setShowDuplicates(false);
    try {
      const res = await fetch('/api/questions/deduplicate');
      if (!res.ok) throw new Error('중복 문제 조회 실패');
      const data = await res.json();
      setDuplicateGroups(data.duplicates || []);
      setShowDuplicates(true);
      if ((data.duplicates || []).length === 0) {
        toast({ title: '중복 없음', description: '중복된 문제가 없습니다.', variant: 'success' });
      }
    } catch (e: any) {
      toast({ title: '중복 확인 실패', description: e.message, variant: 'error' });
    } finally {
      setDedupLoading(false);
    }
  };

  // 중복문제 정리(삭제)
  const handleDeduplicate = async () => {
    if (!confirm('중복 문제를 한 개만 남기고 모두 삭제하시겠습니까?')) return;
    setDedupLoading(true);
    try {
      const res = await fetch('/api/questions/deduplicate', { method: 'POST' });
      if (!res.ok) throw new Error('중복 문제 정리 실패');
      const data = await res.json();
      toast({ title: '중복 정리 완료', description: `${data.deleted}개의 중복 문제가 삭제되었습니다.`, variant: 'success' });
      setShowDuplicates(false);
      setDuplicateGroups([]);
      fetchQuestions();
    } catch (e: any) {
      toast({ title: '중복 정리 실패', description: e.message, variant: 'error' });
    } finally {
      setDedupLoading(false);
    }
  };

  useEffect(() => { fetchQuestions(); }, [page]);

  // 이미지 확대
  const handleImageZoom = (url: string) => setZoomedImage(url);

  // 상세/해설 다이얼로그
  const handleDetail = (q: IQuestion) => setSelectedQuestion(q);

  // 페이지네이션
  const handlePrev = () => setPage((p) => Math.max(p - 1, 1));
  const handleNext = () => setPage((p) => Math.min(p + 1, totalPages));

  // 수정 이동
  const handleEdit = (id: string) => {
    window.location.href = `/questions/edit/${id}`;
  };

  // Breadcrumb
  const breadcrumbItems = [
    { label: "홈", href: "/" },
    { label: "문제 목록", href: "/questions/list", isCurrent: true },
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <Breadcrumb items={breadcrumbItems} />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">문제 목록</h1>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleCheckDuplicates} disabled={dedupLoading} variant="outline" className="h-10">
            {dedupLoading ? '중복 확인 중...' : '중복문제 확인하기'}
          </Button>
          {showDuplicates && duplicateGroups.length > 0 && (
            <Button onClick={handleDeduplicate} disabled={dedupLoading} variant="destructive" className="h-10">
              {dedupLoading ? '중복 정리 중...' : '중복문제 정리(삭제)'}
            </Button>
          )}
          <Button 
            variant={detailView ? "default" : "outline"} 
            size="default"
            className="gap-1 h-10"
            onClick={() => setDetailView((v) => !v)}
          >
            <ImageIcon className="h-4 w-4" />
            {detailView ? "상세보기" : "요약보기"}
          </Button>
          <Link href="/manage/questions/new">
            <Button size="default" className="h-10">
              <PlusCircle className="mr-2 h-4 w-4" /> 새 문제 등록
            </Button>
          </Link>
        </div>
      </div>
      {/* 중복 문제 그룹 표시 */}
      {showDuplicates && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-2">중복 문제 그룹 ({duplicateGroups.length}건)</h2>
          {duplicateGroups.length === 0 ? (
            <div className="text-gray-500">중복된 문제가 없습니다.</div>
          ) : (
            <div className="space-y-6">
              {duplicateGroups.map((group, idx) => (
                <div key={idx} className="border rounded p-4 bg-gray-50">
                  <div className="mb-2 font-semibold">중복 그룹 #{idx + 1} (총 {group.length}개)</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {group.map((q: any, qidx: number) => (
                      <div key={q.id} className="border rounded p-2 bg-white">
                        <div className="text-xs text-gray-400 mb-1">ID: {q.id}</div>
                        <div className="font-medium mb-1">{q.content}</div>
                        <div className="text-xs text-gray-500 mb-1">정답: {typeof q.answer === 'number' ? q.answer + 1 : q.answer}</div>
                        <div className="text-xs text-gray-500 mb-1">태그: {(q.tags || []).join(', ')}</div>
                        <div className="text-xs text-gray-500 mb-1">등록일: {q.createdAt ? new Date(q.createdAt).toLocaleString() : ''}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {loading ? (
        <div className="text-center py-8">문제를 불러오는 중...</div>
      ) : questions.length === 0 ? (
        <div className="text-center py-8 border rounded-md">
          <p className="text-gray-500">등록된 문제가 없습니다.</p>
          <p className="mt-2">
            <Link href="/manage/questions/new">
              <Button variant="link">
                <PlusCircle className="mr-2 h-4 w-4" /> 새 문제 등록하기
              </Button>
            </Link>
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {questions.map((q, idx) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={idx}
                page={page}
                onDetail={handleDetail}
                onEdit={handleEdit}
                onDelete={handleDelete}
                detailView={detailView}
                onImageZoom={handleImageZoom}
              />
            ))}
          </div>
          <div className="flex justify-center gap-2 mt-6">
            <Button variant="outline" size="default" className="h-10" onClick={handlePrev} disabled={page === 1}>
              이전
            </Button>
            <div className="flex items-center px-4 h-10 border rounded-md text-sm bg-gray-50">
              {page} / {totalPages}
            </div>
            <Button variant="outline" size="default" className="h-10" onClick={handleNext} disabled={page === totalPages}>
              다음
            </Button>
          </div>
        </>
      )}
      {/* 해설 다이얼로그 */}
      <QuestionDetailDialog open={!!selectedQuestion} question={selectedQuestion} onClose={() => setSelectedQuestion(null)} />
      {/* 이미지 확대 다이얼로그 */}
      <Dialog open={!!zoomedImage} onOpenChange={() => setZoomedImage(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto p-2">
          <VisuallyHidden>
            <DialogTitle>확대 이미지</DialogTitle>
            <DialogDescription>선택한 이미지의 확대된 모습입니다.</DialogDescription>
          </VisuallyHidden>
          {zoomedImage && (
            <img src={zoomedImage} alt="Zoomed view" className="w-full h-auto object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}